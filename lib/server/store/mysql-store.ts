/**
 * MySQL 存储（多实例 / Serverless 部署）。
 *
 * 表结构：
 * - party_rooms：房间，version 列做乐观锁（UPDATE ... WHERE version = ?）
 * - party_presence：座位最近轮询时间（在线状态），每个实例节流写入
 * - game_config：沿用旧版表，id = 'default' 行保存管理员默认配置
 */
import type { Pool, ResultSetHeader, RowDataPacket } from "mysql2/promise"
import type { GameConfig, Seat } from "@/lib/game/types"
import type { Room, RoomStore } from "./types"

type RoomData = Pick<Room, "config" | "state" | "tokens" | "createdAt">

/** 同一座位在本实例内至多每 3 秒写一次在线时间。 */
const PRESENCE_WRITE_INTERVAL_MS = 3000

/** JSON 列在 MySQL 中返回对象，在 MariaDB（LONGTEXT 别名）中返回字符串。 */
function readJson<T>(value: unknown): T {
  return (typeof value === "string" ? JSON.parse(value) : value) as T
}

export class MysqlStore implements RoomStore {
  private pool: Promise<Pool> | null = null
  private readonly presenceWrites = new Map<string, number>()

  constructor(private readonly url: string) {}

  private getPool(): Promise<Pool> {
    this.pool ??= this.connect().catch((error) => {
      this.pool = null // 允许下次请求重试
      throw error
    })
    return this.pool
  }

  private async connect(): Promise<Pool> {
    const mysql = await import("mysql2/promise")
    const pool = mysql.createPool({ uri: this.url, connectionLimit: 5 })
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS party_rooms (
        id VARCHAR(8) PRIMARY KEY,
        version INT NOT NULL,
        data JSON NOT NULL,
        updated_at BIGINT NOT NULL,
        INDEX idx_updated_at (updated_at)
      )
    `)
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS party_presence (
        room_id VARCHAR(8) NOT NULL,
        seat TINYINT NOT NULL,
        last_seen BIGINT NOT NULL,
        PRIMARY KEY (room_id, seat)
      )
    `)
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS game_config (
        id VARCHAR(20) PRIMARY KEY,
        config JSON NOT NULL,
        updated_at BIGINT NOT NULL
      )
    `)
    return pool
  }

  async getRoom(id: string): Promise<Room | null> {
    const pool = await this.getPool()
    const [rows] = await pool.execute<RowDataPacket[]>(
      "SELECT version, data, updated_at FROM party_rooms WHERE id = ?",
      [id],
    )
    const row = rows[0]
    if (!row) return null
    const data = readJson<RoomData>(row.data)
    return { id, version: Number(row.version), updatedAt: Number(row.updated_at), ...data }
  }

  async createRoom(room: Room): Promise<boolean> {
    const pool = await this.getPool()
    const [result] = await pool.execute<ResultSetHeader>(
      "INSERT IGNORE INTO party_rooms (id, version, data, updated_at) VALUES (?, ?, ?, ?)",
      [room.id, room.version, serialize(room), room.updatedAt],
    )
    return result.affectedRows === 1
  }

  async updateRoom(room: Room, expectedVersion: number): Promise<boolean> {
    const pool = await this.getPool()
    const [result] = await pool.execute<ResultSetHeader>(
      "UPDATE party_rooms SET version = ?, data = ?, updated_at = ? WHERE id = ? AND version = ?",
      [room.version, serialize(room), room.updatedAt, room.id, expectedVersion],
    )
    return result.affectedRows === 1
  }

  async deleteRoomsBefore(timestamp: number): Promise<void> {
    const pool = await this.getPool()
    await pool.execute("DELETE FROM party_rooms WHERE updated_at < ?", [timestamp])
    await pool.execute("DELETE FROM party_presence WHERE last_seen < ?", [timestamp])
    for (const [key, at] of this.presenceWrites) if (at < timestamp) this.presenceWrites.delete(key)
  }

  async touchSeat(roomId: string, seat: Seat, now: number): Promise<void> {
    const key = `${roomId}:${seat}`
    if (now - (this.presenceWrites.get(key) ?? 0) < PRESENCE_WRITE_INTERVAL_MS) return
    this.presenceWrites.set(key, now)
    const pool = await this.getPool()
    await pool.execute(
      `INSERT INTO party_presence (room_id, seat, last_seen) VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE last_seen = VALUES(last_seen)`,
      [roomId, seat, now],
    )
  }

  async getLastSeen(roomId: string): Promise<[number, number]> {
    const pool = await this.getPool()
    const [rows] = await pool.execute<RowDataPacket[]>("SELECT seat, last_seen FROM party_presence WHERE room_id = ?", [
      roomId,
    ])
    const seen: [number, number] = [0, 0]
    for (const row of rows) if (row.seat === 0 || row.seat === 1) seen[row.seat as Seat] = Number(row.last_seen)
    return seen
  }

  async getDefaultConfig(): Promise<unknown | null> {
    const pool = await this.getPool()
    const [rows] = await pool.execute<RowDataPacket[]>("SELECT config FROM game_config WHERE id = 'default'")
    return rows[0] ? readJson<unknown>(rows[0].config) : null
  }

  async saveDefaultConfig(config: GameConfig): Promise<void> {
    const pool = await this.getPool()
    await pool.execute(
      `INSERT INTO game_config (id, config, updated_at) VALUES ('default', ?, ?)
       ON DUPLICATE KEY UPDATE config = VALUES(config), updated_at = VALUES(updated_at)`,
      [JSON.stringify(config), Date.now()],
    )
  }
}

function serialize(room: Room): string {
  const data: RoomData = { config: room.config, state: room.state, tokens: room.tokens, createdAt: room.createdAt }
  return JSON.stringify(data)
}
