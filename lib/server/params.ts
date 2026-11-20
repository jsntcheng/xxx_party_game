import { ROOM_ID_PATTERN, SEAT_TOKEN_HEADER } from "@/lib/api-types"
import { AppError } from "./errors"

export interface RoomRouteContext {
  params: Promise<{ id: string }>
}

/** 解析房间号（大小写不敏感）与座位 token。 */
export async function roomRequest(request: Request, context: RoomRouteContext) {
  const id = (await context.params).id.toUpperCase()
  if (!ROOM_ID_PATTERN.test(id)) throw new AppError(404, "房间不存在或已过期")
  return { id, token: request.headers.get(SEAT_TOKEN_HEADER) }
}
