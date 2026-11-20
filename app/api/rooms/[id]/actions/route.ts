import type { ActionRequest } from "@/lib/api-types"
import { handle, json, readBody } from "@/lib/server/http"
import { roomRequest, type RoomRouteContext } from "@/lib/server/params"
import { performAction } from "@/lib/server/rooms"

/** 执行游戏操作：{ baseVersion, action } → ActionResult；冲突时 409 附带最新房间。 */
export function POST(request: Request, context: RoomRouteContext) {
  return handle(async () => {
    const { id, token } = await roomRequest(request, context)
    const body = ((await readBody(request)) ?? {}) as Partial<ActionRequest>
    return json(await performAction(id, token, body.baseVersion, body.action))
  })
}
