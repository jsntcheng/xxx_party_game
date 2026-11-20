import { readBody, handle, json } from "@/lib/server/http"
import { loadDefaultConfig, saveDefaultConfig } from "@/lib/server/rooms"
import { assertAdmin } from "@/lib/server/security"

export const dynamic = "force-dynamic"

/** 新建房间 / 本地游戏使用的默认配置。 */
export function GET() {
  return handle(async () => json({ config: await loadDefaultConfig() }))
}

/** 管理员保存默认配置：{ password, config }。 */
export function POST(request: Request) {
  return handle(async () => {
    const body = (await readBody(request)) as { password?: unknown; config?: unknown } | null
    assertAdmin(body?.password)
    return json({ config: await saveDefaultConfig(body?.config) })
  })
}
