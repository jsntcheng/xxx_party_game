/** 棋盘生成与随机抽取（纯函数，随机源可注入以便测试）。 */
import { TILE_LABELS } from "./meta"
import type { Audience, GameCell, GameConfig, PositionableType, SceneCard, TaskType } from "./types"

/** 返回 [0, 1) 的随机数。 */
export type Rng = () => number

/** 密码学安全随机源（浏览器与 Node 均可用），服务端掷骰用它避免可预测。 */
export const secureRng: Rng = () => crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32

/** 终点区最多放几格专属任务。 */
export const ENDPOINT_ZONE_MAX = 6

/** 非固定位置格子的随机类型权重。 */
const RANDOM_WEIGHTS: [TaskType, number][] = [
  ["normal", 0.6],
  ["truth", 0.1],
  ["dare", 0.1],
  ["kiss", 0.05],
  ["hug", 0.05],
  ["reward", 0.08],
  ["punishment", 0.02],
]

function shuffle<T>(items: readonly T[], rng: Rng): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

export function pickOne<T>(items: readonly T[], rng: Rng): T | undefined {
  return items.length ? items[Math.floor(rng() * items.length)] : undefined
}

/** 某类型对应的任务池。 */
export function poolOf(config: GameConfig, type: TaskType): GameCell[] {
  switch (type) {
    case "normal":
      return config.normalCells
    case "truth":
      return config.truthCells
    case "dare":
      return config.dareCells
    case "kiss":
      return config.kissCells
    case "hug":
      return config.hugCells
    case "punishment":
      return config.punishmentCells
    case "reward":
      return config.rewardCells
    case "endpoint":
      return config.endpointCells
    default:
      return config.effectCells.filter((cell) => cell.type === type)
  }
}

/** 按顺序轮流从洗好的池子里取，尽量不重复。 */
function createDealer(config: GameConfig, rng: Rng) {
  const decks = new Map<TaskType, { cards: GameCell[]; next: number }>()
  return (type: TaskType): GameCell | null => {
    let deck = decks.get(type)
    if (!deck) {
      deck = { cards: shuffle(poolOf(config, type), rng), next: 0 }
      decks.set(type, deck)
    }
    if (deck.cards.length === 0) return null
    const card = deck.cards[deck.next % deck.cards.length]
    deck.next++
    return card
  }
}

function weightedType(rng: Rng): TaskType {
  let roll = rng()
  for (const [type, weight] of RANDOM_WEIGHTS) {
    if (roll < weight) return type
    roll -= weight
  }
  return "normal"
}

/** 甜蜜任务格只占位，具体任务在玩家落到这里时按性别现抽（见 engine 的 sweetPool）。 */
const SWEET_TILE: Omit<GameCell, "id"> = { content: TILE_LABELS.normal.name, type: "normal", player: "both" }

/**
 * 生成完整路径：[起点, ...任务格, ...终点区, 终点]，每格 id 等于其下标。
 * 其他类型的格子在这里就发好任务；对应卡池为空时退化为甜蜜任务格。
 */
export function generateBoard(config: GameConfig, rng: Rng): GameCell[] {
  const deal = createDealer(config, rng)
  const tiles: Omit<GameCell, "id">[] = [{ content: "起点", type: "start", player: "both" }]

  for (let position = 1; position <= config.boardSize; position++) {
    // Record 下标可能不存在，显式标注避免被收窄成「必有值」
    const fixed = config.specialCellPositions[position] as PositionableType | undefined
    const type = fixed ?? weightedType(rng)
    const dealt = type === "normal" ? null : deal(type)
    tiles.push(dealt ?? SWEET_TILE)
  }

  const zone = shuffle(config.endpointCells, rng).slice(0, ENDPOINT_ZONE_MAX)
  tiles.push(...zone)
  tiles.push({ content: config.endpointContent.title, type: "end", player: "both" })

  return tiles.map((tile, index) => ({ ...tile, id: index }))
}

/** 前 N 个卡池各抽一张。 */
export function drawSceneCards(config: GameConfig, rng: Rng): SceneCard[] {
  return config.sceneCardPoolNames
    .slice(0, config.sceneCardCount)
    .map((pool) => pickOne(config.sceneCards.filter((card) => card.pool === pool), rng))
    .filter((card): card is SceneCard => card !== undefined)
}

export function suitsAudience(audience: Audience, gender: "male" | "female"): boolean {
  return audience === "both" || audience === gender
}
