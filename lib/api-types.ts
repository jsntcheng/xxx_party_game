/** 前后端共用的 HTTP 契约。 */
import type { Gender, GameConfig, GameState, Seat } from "./game/types"

/** 房间对外视图（不含座位 token）。 */
export interface PublicRoom {
  id: string
  version: number
  config: GameConfig
  state: GameState
}

export interface SeatStatus {
  taken: boolean
  online: boolean
}

/** 每个房间响应都携带的实时信息（在线状态不改变 version，所以单独下发）。 */
export interface RoomStatus {
  seats: [SeatStatus, SeatStatus]
  serverTime: number
}

export interface JoinRequest {
  name: string
  gender: Gender
}

/** 创建/加入房间成功：返回座位凭证。 */
export interface SeatGrant extends RoomStatus {
  token: string
  seat: Seat
  room: PublicRoom
}

/** 轮询结果：版本未变时 room 为 null；seat 为 null 表示 token 不属于该房间。 */
export interface RoomPoll extends RoomStatus {
  room: PublicRoom | null
  seat: Seat | null
}

export interface ActionRequest {
  baseVersion: number
  action: unknown
}

export interface ActionResult extends RoomStatus {
  room: PublicRoom
}

/** 错误响应；409 冲突时附带最新房间，客户端据此回到服务端真相。 */
export interface ApiErrorBody {
  error: string
  room?: PublicRoom
}

export const SEAT_TOKEN_HEADER = "x-seat-token"
export const ROOM_ID_PATTERN = /^[A-Z0-9]{6}$/
