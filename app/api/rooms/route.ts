import { parsePlayerProfile } from "@/lib/game/action"
import { handle, json, readBody } from "@/lib/server/http"
import { createRoom } from "@/lib/server/rooms"

/** 创建房间：{ name, gender } → SeatGrant。 */
export function POST(request: Request) {
  return handle(async () => json(await createRoom(parsePlayerProfile(await readBody(request))), 201))
}
