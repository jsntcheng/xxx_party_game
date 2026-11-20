import { afterEach, describe, expect, it } from "vitest"
import { AppError } from "@/lib/server/errors"
import { assertAdmin, safeEqual } from "@/lib/server/security"

afterEach(() => {
  delete process.env.ADMIN_PASSWORD
})

describe("管理员校验", () => {
  it("safeEqual 正确比较不同长度的字符串", () => {
    expect(safeEqual("abc", "abc")).toBe(true)
    expect(safeEqual("abc", "abcd")).toBe(false)
  })

  it("未配置密码时一律拒绝", () => {
    expect(() => assertAdmin("anything")).toThrow(AppError)
    try {
      assertAdmin("anything")
    } catch (error) {
      expect((error as AppError).status).toBe(503)
    }
  })

  it("密码错误 403，正确时通过", () => {
    process.env.ADMIN_PASSWORD = "s3cret"
    expect(() => assertAdmin("wrong")).toThrow("管理员密码错误")
    expect(() => assertAdmin(undefined)).toThrow("管理员密码错误")
    expect(() => assertAdmin("s3cret")).not.toThrow()
  })
})
