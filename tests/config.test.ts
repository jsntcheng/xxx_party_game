import { describe, expect, it } from "vitest"
import { parseAction, parsePlayerProfile } from "@/lib/game/action"
import { BOARD_SIZE_MAX, ConfigError, parseGameConfig } from "@/lib/game/config"
import { defaultGameConfig } from "@/lib/game/defaults"

describe("parseGameConfig", () => {
  it("默认配置往返不变", () => {
    expect(parseGameConfig(JSON.parse(JSON.stringify(defaultGameConfig)))).toEqual(defaultGameConfig)
  })

  it("缺失字段用默认值补齐", () => {
    const config = parseGameConfig({ normalCells: [{ content: "  拥抱一下  " }] })
    expect(config.normalCells).toEqual([{ id: 1, content: "拥抱一下", type: "normal", player: "both", effect: undefined }])
    expect(config.truthCells).toBe(defaultGameConfig.truthCells)
    expect(config.boardSize).toBe(defaultGameConfig.boardSize)
  })

  it("棋盘长度被限制在范围内，超出的固定位置被丢弃", () => {
    const config = parseGameConfig({ boardSize: 999, specialCellPositions: { 5: "kiss", 80: "hug" } })
    expect(config.boardSize).toBe(BOARD_SIZE_MAX)
    expect(config.specialCellPositions).toEqual({ 5: "kiss" })
  })

  it("专属列表强制适用对象", () => {
    const config = parseGameConfig({ maleCells: [{ content: "a", player: "female" }] })
    expect(config.maleCells[0].player).toBe("male")
  })

  it("兼容旧版 sceneCardPools 二维数组", () => {
    const config = parseGameConfig({
      sceneCardPoolNames: ["地点", "氛围"],
      sceneCardPools: [[{ title: "卧室", description: "温馨" }], [{ title: "烛光", description: "浪漫", icon: "🕯️" }]],
      sceneCardCount: 5,
    })
    expect(config.sceneCards.map((card) => [card.pool, card.title])).toEqual([
      ["地点", "卧室"],
      ["氛围", "烛光"],
    ])
    expect(config.sceneCardCount).toBe(2)
  })

  it("错误信息带字段路径", () => {
    expect(() => parseGameConfig({ truthCells: [{ content: "" }] })).toThrow("truthCells[0].content: 不能为空")
    expect(() => parseGameConfig({ effectCells: [{ content: "x", type: "kiss" }] })).toThrow(/effectCells\[0\]\.type/)
    expect(() => parseGameConfig({ normalCells: [{ content: "x", effect: { type: "move", value: 0 } }] })).toThrow(
      ConfigError,
    )
    expect(() => parseGameConfig({ sceneCards: [{ title: "a", description: "b", pool: "不存在" }] })).toThrow("卡池「不存在」不存在")
    expect(() => parseGameConfig([])).toThrow("配置必须是 JSON 对象")
  })
})

describe("parseAction / parsePlayerProfile", () => {
  it("只接受已知操作", () => {
    expect(parseAction({ type: "roll", extra: 1 })).toEqual({ type: "roll" })
    expect(parseAction({ type: "timer", op: "start" })).toEqual({ type: "timer", op: "start" })
    expect(() => parseAction({ type: "timer", op: "explode" })).toThrow("未知计时操作")
    expect(() => parseAction({ type: "hack" })).toThrow("未知操作")
    expect(() => parseAction(null)).toThrow("操作格式错误")
  })

  it("updateConfig 携带的配置同样经过校验", () => {
    expect(() => parseAction({ type: "updateConfig", config: { boardSize: "abc" } })).toThrow("boardSize: 必须是数字")
  })

  it("昵称去空格并限制长度（按字符计）", () => {
    expect(parsePlayerProfile({ name: "  小红 ", gender: "female" })).toEqual({ name: "小红", gender: "female" })
    expect(parsePlayerProfile({ name: "💕".repeat(12), gender: "male" }).name).toHaveLength(24)
    expect(() => parsePlayerProfile({ name: "a".repeat(13), gender: "male" })).toThrow("昵称最多 12 个字")
    expect(() => parsePlayerProfile({ name: " ", gender: "male" })).toThrow("请输入昵称")
    expect(() => parsePlayerProfile({ name: "a", gender: "other" })).toThrow("请选择性别")
  })
})
