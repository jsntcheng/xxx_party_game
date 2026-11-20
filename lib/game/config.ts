/**
 * 配置校验与规范化：导入 JSON、管理员保存、房间内修改都走这里。
 *
 * 宽进严出：缺失字段用默认值补齐，类型错误直接报错（带字段路径），
 * 兼容旧版导出格式（sceneCardPools 二维数组）。
 */
import { defaultGameConfig } from "./defaults"
import {
  BACK_TO_START,
  CELL_LIST_KEYS,
  EFFECT_TASK_TYPES,
  POSITIONABLE_TYPES,
  type Audience,
  type CellEffect,
  type CellListKey,
  type GameCell,
  type GameConfig,
  type PositionableType,
  type SceneCard,
  type TileKind,
} from "./types"
import { CELL_LIST_META } from "./meta"

export const BOARD_SIZE_MIN = 20
export const BOARD_SIZE_MAX = 56
const MAX_LIST_LENGTH = 500
const MAX_TEXT = 200
const MAX_MOVE = 60

export class ConfigError extends Error {}

type Json = Record<string, unknown>

const isObject = (value: unknown): value is Json => typeof value === "object" && value !== null && !Array.isArray(value)

function fail(path: string, message: string): never {
  throw new ConfigError(`${path}: ${message}`)
}

function text(value: unknown, path: string, { required = true, max = MAX_TEXT } = {}): string {
  if (value === undefined && !required) return ""
  if (typeof value !== "string") fail(path, "必须是文字")
  const trimmed = value.trim()
  if (required && !trimmed) fail(path, "不能为空")
  if (trimmed.length > max) fail(path, `不能超过 ${max} 个字`)
  return trimmed
}

function int(value: unknown, path: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) fail(path, "必须是数字")
  return Math.round(value)
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

function parseEffect(value: unknown, path: string): CellEffect | undefined {
  if (value === undefined || value === null) return undefined
  if (!isObject(value)) fail(path, "格式错误")
  switch (value.type) {
    case "move": {
      const amount = int(value.value, `${path}.value`)
      if (amount !== BACK_TO_START && (amount === 0 || Math.abs(amount) > MAX_MOVE)) {
        fail(`${path}.value`, `移动格数必须在 ±1~${MAX_MOVE} 之间，或 ${BACK_TO_START} 表示回到起点`)
      }
      return { type: "move", value: amount }
    }
    case "skip":
    case "again":
    case "swap":
      return { type: value.type }
    default:
      fail(`${path}.type`, "未知效果类型")
  }
}

function parseAudience(value: unknown, path: string, fallback: Audience): Audience {
  if (value === undefined) return fallback
  if (value === "both" || value === "male" || value === "female") return value
  fail(path, "适用对象只能是 both / male / female")
}

function resolveType(key: CellListKey, value: unknown, path: string): TileKind {
  if (key !== "effectCells") return CELL_LIST_META[key].type
  if (EFFECT_TASK_TYPES.includes(value as (typeof EFFECT_TASK_TYPES)[number])) {
    return value as TileKind
  }
  fail(path, `效果格类型必须是 ${EFFECT_TASK_TYPES.join(" / ")}`)
}

function parseCells(key: CellListKey, value: unknown): GameCell[] {
  if (value === undefined) return defaultGameConfig[key]
  if (!Array.isArray(value)) fail(key, "必须是数组")
  if (value.length > MAX_LIST_LENGTH) fail(key, `最多 ${MAX_LIST_LENGTH} 条`)
  const forcedAudience: Audience | null = key === "maleCells" ? "male" : key === "femaleCells" ? "female" : null

  return value.map((raw, index) => {
    const path = `${key}[${index}]`
    if (!isObject(raw)) fail(path, "格式错误")
    return {
      id: typeof raw.id === "number" && Number.isFinite(raw.id) ? raw.id : index + 1,
      content: text(raw.content, `${path}.content`),
      type: resolveType(key, raw.type, `${path}.type`),
      player: forcedAudience ?? parseAudience(raw.player, `${path}.player`, "both"),
      effect: parseEffect(raw.effect, `${path}.effect`),
    }
  })
}

function parsePositions(value: unknown, boardSize: number): Record<number, PositionableType> {
  if (value === undefined) {
    return Object.fromEntries(
      Object.entries(defaultGameConfig.specialCellPositions).filter(([pos]) => Number(pos) <= boardSize),
    )
  }
  if (!isObject(value)) fail("specialCellPositions", "格式错误")
  const result: Record<number, PositionableType> = {}
  for (const [key, type] of Object.entries(value)) {
    const position = Number(key)
    if (!Number.isInteger(position)) fail(`specialCellPositions.${key}`, "位置必须是整数")
    if (!POSITIONABLE_TYPES.includes(type as PositionableType)) fail(`specialCellPositions.${key}`, "未知格子类型")
    if (position >= 1 && position <= boardSize) result[position] = type as PositionableType
  }
  return result
}

function parseSceneCard(raw: unknown, path: string, pool: string | undefined, index: number): SceneCard {
  if (!isObject(raw)) fail(path, "格式错误")
  const icon = text(raw.icon, `${path}.icon`, { required: false, max: 8 })
  return {
    id: typeof raw.id === "number" && Number.isFinite(raw.id) ? raw.id : index + 1,
    title: text(raw.title, `${path}.title`, { max: 30 }),
    description: text(raw.description, `${path}.description`),
    ...(icon ? { icon } : {}),
    pool: pool ?? text(raw.pool, `${path}.pool`, { max: 20 }),
  }
}

function parseScenes(input: Json): Pick<GameConfig, "sceneCardPoolNames" | "sceneCards"> {
  const legacyPools = input.sceneCards === undefined && Array.isArray(input.sceneCardPools)
  if (input.sceneCards === undefined && !legacyPools) {
    return { sceneCardPoolNames: defaultGameConfig.sceneCardPoolNames, sceneCards: defaultGameConfig.sceneCards }
  }

  const rawNames = input.sceneCardPoolNames ?? []
  if (!Array.isArray(rawNames)) fail("sceneCardPoolNames", "必须是数组")
  let names = rawNames.map((name, i) => text(name, `sceneCardPoolNames[${i}]`, { max: 20 }))

  let cards: SceneCard[]
  if (legacyPools) {
    const pools = input.sceneCardPools as unknown[]
    names = pools.map((_, i) => names[i] ?? `卡池${i + 1}`)
    cards = pools.flatMap((pool, i) => {
      if (!Array.isArray(pool)) fail(`sceneCardPools[${i}]`, "必须是数组")
      return pool.map((raw, j) => parseSceneCard(raw, `sceneCardPools[${i}][${j}]`, names[i], i * 100 + j))
    })
  } else {
    if (!Array.isArray(input.sceneCards)) fail("sceneCards", "必须是数组")
    cards = input.sceneCards.map((raw, i) => parseSceneCard(raw, `sceneCards[${i}]`, undefined, i))
  }

  names = [...new Set(names)]
  for (const [i, card] of cards.entries()) {
    if (!names.includes(card.pool)) fail(`sceneCards[${i}].pool`, `卡池「${card.pool}」不存在`)
  }
  return { sceneCardPoolNames: names, sceneCards: cards }
}

export function parseGameConfig(input: unknown): GameConfig {
  if (!isObject(input)) throw new ConfigError("配置必须是 JSON 对象")

  const boardSize =
    input.boardSize === undefined
      ? defaultGameConfig.boardSize
      : clamp(int(input.boardSize, "boardSize"), BOARD_SIZE_MIN, BOARD_SIZE_MAX)

  const endpointRaw = input.endpointContent ?? defaultGameConfig.endpointContent
  if (!isObject(endpointRaw)) fail("endpointContent", "格式错误")

  const lists = Object.fromEntries(CELL_LIST_KEYS.map((key) => [key, parseCells(key, input[key])])) as Pick<
    GameConfig,
    CellListKey
  >
  const scenes = parseScenes(input)
  const sceneCardCount =
    input.sceneCardCount === undefined
      ? Math.min(defaultGameConfig.sceneCardCount, scenes.sceneCardPoolNames.length)
      : clamp(int(input.sceneCardCount, "sceneCardCount"), 0, scenes.sceneCardPoolNames.length)

  return {
    ...lists,
    endpointContent: {
      title: text(endpointRaw.title, "endpointContent.title", { max: 20 }),
      subtitle: text(endpointRaw.subtitle, "endpointContent.subtitle", { required: false, max: 40 }),
      reward: text(endpointRaw.reward, "endpointContent.reward"),
    },
    boardSize,
    specialCellPositions: parsePositions(input.specialCellPositions, boardSize),
    ...scenes,
    sceneCardCount,
  }
}
