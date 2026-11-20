import { handle, json } from "@/lib/server/http"
import { roomRequest, type RoomRouteContext } from "@/lib/server/params"
import { pollRoom } from "@/lib/server/rooms"

/** 轮询：?since=<version>，版本未变时 room 为 null。 */
export function GET(request: Request, context: RoomRouteContext) {
  return handle(async () => {
    const { id, token } = await roomRequest(request, context)
    const since = Number(new URL(request.url).searchParams.get("since") ?? -1)
    return json(await pollRoom(id, token, Number.isInteger(since) ? since : -1))
  })
}
