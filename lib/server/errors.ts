import type { PublicRoom } from "@/lib/api-types"

/** 业务错误：带 HTTP 状态码，由 handle() 统一转换为 JSON 响应。 */
export class AppError extends Error {
  constructor(
    readonly status: 400 | 401 | 403 | 404 | 409 | 413 | 503,
    message: string,
    /** 409 冲突时附带最新房间。 */
    readonly room?: PublicRoom,
  ) {
    super(message)
  }
}
