import { parsePlayerProfile } from "@/lib/game/action"
import { handle, json, readBody } from "@/lib/server/http"
import { roomRequest, type RoomRouteContext } from "@/lib/server/params"
import { joinRoom } from "@/lib/server/rooms"

/** 加入房间：{ name, gender } → SeatGrant；携带本房间 token 时为重连。 */
export function POST(request: Request, context: RoomRouteContext) {
  return handle(async () => {
    const { id, token } = await roomRequest(request, context)
    return json(await joinRoom(id, parsePlayerProfile(await readBody(request)), token))
  })
}
