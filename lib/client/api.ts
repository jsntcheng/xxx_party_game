/** 浏览器端 API 客户端。 */
import {
  SEAT_TOKEN_HEADER,
  type ActionResult,
  type ApiErrorBody,
  type JoinRequest,
  type PublicRoom,
  type RoomPoll,
  type SeatGrant,
} from "@/lib/api-types"
import type { GameAction, GameConfig } from "@/lib/game/types"

export class ApiError extends Error {
  constructor(
    /** 0 表示网络错误。 */
    readonly status: number,
    message: string,
    readonly room?: PublicRoom,
  ) {
    super(message)
  }
}

interface RequestOptions {
  method?: "GET" | "POST"
  body?: unknown
  token?: string | null
}

async function request<T>(path: string, { method = "GET", body, token }: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {}
  if (body !== undefined) headers["content-type"] = "application/json"
  if (token) headers[SEAT_TOKEN_HEADER] = token

  let response: Response
  try {
    response = await fetch(path, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
    })
  } catch {
    throw new ApiError(0, "网络连接失败，请检查网络")
  }
  const data = (await response.json().catch(() => null)) as (T & ApiErrorBody) | null
  if (!response.ok) throw new ApiError(response.status, data?.error ?? `请求失败（${response.status}）`, data?.room)
  return data as T
}

export const api = {
  getDefaultConfig: () => request<{ config: GameConfig }>("/api/config"),
  saveDefaultConfig: (password: string, config: GameConfig) =>
    request<{ config: GameConfig }>("/api/config", { method: "POST", body: { password, config } }),
  createRoom: (profile: JoinRequest) => request<SeatGrant>("/api/rooms", { method: "POST", body: profile }),
  joinRoom: (roomId: string, profile: JoinRequest, token: string | null) =>
    request<SeatGrant>(`/api/rooms/${roomId}/join`, { method: "POST", body: profile, token }),
  pollRoom: (roomId: string, token: string, since: number) =>
    request<RoomPoll>(`/api/rooms/${roomId}?since=${since}`, { token }),
  act: (roomId: string, token: string, baseVersion: number, action: GameAction) =>
    request<ActionResult>(`/api/rooms/${roomId}/actions`, { method: "POST", body: { baseVersion, action }, token }),
}
