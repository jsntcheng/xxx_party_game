/** Route Handler 公共工具：统一错误转换、请求体大小限制、禁用缓存。 */
import { NextResponse } from "next/server"
import type { ApiErrorBody } from "@/lib/api-types"
import { ConfigError } from "@/lib/game/config"
import { AppError } from "./errors"

const BODY_LIMIT_BYTES = 512 * 1024

export function json<T>(data: T, status = 200): Response {
  return NextResponse.json(data, { status, headers: { "cache-control": "no-store" } })
}

/** 执行处理函数，业务错误转为对应状态码，未知错误记录日志后返回 500。 */
export async function handle(run: () => Promise<Response>): Promise<Response> {
  try {
    return await run()
  } catch (error) {
    if (error instanceof AppError) {
      return json<ApiErrorBody>({ error: error.message, ...(error.room && { room: error.room }) }, error.status)
    }
    if (error instanceof ConfigError) return json<ApiErrorBody>({ error: error.message }, 400)
    console.error("[api] 未处理的错误", error)
    return json<ApiErrorBody>({ error: "服务器开小差了，请稍后再试" }, 500)
  }
}

export async function readBody(request: Request): Promise<unknown> {
  const declared = Number(request.headers.get("content-length") ?? 0)
  if (declared > BODY_LIMIT_BYTES) throw new AppError(413, "内容太大了")
  const text = await request.text()
  if (text.length > BODY_LIMIT_BYTES) throw new AppError(413, "内容太大了")
  try {
    return JSON.parse(text) as unknown
  } catch {
    throw new AppError(400, "请求格式错误")
  }
}
