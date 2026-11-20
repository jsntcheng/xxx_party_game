import { createHash, timingSafeEqual } from "node:crypto"
import { AppError } from "./errors"

/** 常量时间比较（先摘要，避免长度差异泄露信息）。 */
export function safeEqual(a: string, b: string): boolean {
  const digest = (value: string) => new Uint8Array(createHash("sha256").update(value).digest())
  return timingSafeEqual(digest(a), digest(b))
}

/** 校验管理员密码；未配置 ADMIN_PASSWORD 时拒绝所有修改默认配置的请求。 */
export function assertAdmin(password: unknown): void {
  const expected = process.env.ADMIN_PASSWORD
  if (!expected) throw new AppError(503, "服务器未配置管理员密码（ADMIN_PASSWORD）")
  if (typeof password !== "string" || !safeEqual(password, expected)) throw new AppError(403, "管理员密码错误")
}
