import path from "node:path"
import { FileStore } from "./file-store"
import { MysqlStore } from "./mysql-store"
import type { RoomStore } from "./types"

let store: RoomStore | null = null

/** 配置了 DATABASE_URL 用 MySQL，否则落盘到 data/rooms.json。 */
export function getStore(): RoomStore {
  if (!store) {
    const url = process.env.DATABASE_URL
    store = url ? new MysqlStore(url) : new FileStore(path.join(process.cwd(), "data", "rooms.json"))
    console.info(`[store] 使用 ${url ? "MySQL" : "JSON 文件"} 存储`)
  }
  return store
}

export type { Room, RoomStore } from "./types"
