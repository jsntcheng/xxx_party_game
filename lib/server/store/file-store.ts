/**
 * JSON 文件存储（单进程部署）。
 *
 * 内存为准、落盘为备份：读写都走内存 Map，CAS 在同步代码里完成因而天然原子；
 * 每次变更后串行地「写临时文件 + rename」原子落盘，进程重启后从文件恢复。
 */
import { promises as fs } from "node:fs"
import path from "node:path"
import type { GameConfig, Seat } from "@/lib/game/types"
import type { Room, RoomStore } from "./types"

interface FileData {
  rooms: Record<string, Room>
  defaultConfig?: unknown
}

/** 旧版数据里的房间没有 version/tokens，直接丢弃（房间本身 24 小时过期）。 */
function isCurrentRoom(value: unknown): value is Room {
  const room = value as Room
  return typeof room?.version === "number" && Array.isArray(room.tokens) && typeof room.state?.gameId === "string"
}

export class FileStore implements RoomStore {
  private data: FileData | null = null
  private loading: Promise<FileData> | null = null
  private writing: Promise<void> = Promise.resolve()
  private dirty = false
  /** 在线状态只存内存，重启后自然清空。 */
  private readonly lastSeen = new Map<string, [number, number]>()

  constructor(private readonly file: string) {}

  private async load(): Promise<FileData> {
    if (this.data) return this.data
    this.loading ??= this.readFile()
    this.data = await this.loading
    return this.data
  }

  private async readFile(): Promise<FileData> {
    try {
      const raw = JSON.parse(await fs.readFile(this.file, "utf-8")) as Partial<FileData>
      const rooms = Object.fromEntries(Object.entries(raw.rooms ?? {}).filter(([, room]) => isCurrentRoom(room)))
      return { rooms, defaultConfig: raw.defaultConfig }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return { rooms: {} }
      // 文件损坏时保留现场，避免被空数据覆盖
      const backup = `${this.file}.corrupt-${Date.now()}`
      await fs.rename(this.file, backup).catch(() => undefined)
      console.error(`[store] ${this.file} 解析失败，已备份到 ${backup}`, error)
      return { rooms: {} }
    }
  }

  /** 合并短时间内的多次写入，始终写最新内存快照。 */
  private persist(): Promise<void> {
    this.dirty = true
    // 上一次写失败不能卡死后续写入
    const run = this.writing
      .catch(() => undefined)
      .then(async () => {
        if (!this.dirty || !this.data) return
        this.dirty = false
        const tmp = `${this.file}.tmp`
        await fs.mkdir(path.dirname(this.file), { recursive: true })
        await fs.writeFile(tmp, JSON.stringify(this.data), "utf-8")
        await fs.rename(tmp, this.file)
      })
    this.writing = run
    return run
  }

  async getRoom(id: string): Promise<Room | null> {
    const data = await this.load()
    return data.rooms[id] ?? null
  }

  async createRoom(room: Room): Promise<boolean> {
    const data = await this.load()
    if (data.rooms[room.id]) return false
    data.rooms[room.id] = room
    await this.persist()
    return true
  }

  async updateRoom(room: Room, expectedVersion: number): Promise<boolean> {
    const data = await this.load()
    if (data.rooms[room.id]?.version !== expectedVersion) return false
    data.rooms[room.id] = room
    await this.persist()
    return true
  }

  async deleteRoomsBefore(timestamp: number): Promise<void> {
    const data = await this.load()
    const expired = Object.values(data.rooms).filter((room) => room.updatedAt < timestamp)
    if (!expired.length) return
    for (const room of expired) {
      delete data.rooms[room.id]
      this.lastSeen.delete(room.id)
    }
    await this.persist()
  }

  async touchSeat(roomId: string, seat: Seat, now: number): Promise<void> {
    const seen = this.lastSeen.get(roomId) ?? [0, 0]
    seen[seat] = now
    this.lastSeen.set(roomId, seen)
  }

  async getLastSeen(roomId: string): Promise<[number, number]> {
    const seen = this.lastSeen.get(roomId)
    return seen ? [seen[0], seen[1]] : [0, 0]
  }

  async getDefaultConfig(): Promise<unknown | null> {
    return (await this.load()).defaultConfig ?? null
  }

  async saveDefaultConfig(config: GameConfig): Promise<void> {
    const data = await this.load()
    data.defaultConfig = config
    await this.persist()
  }
}
