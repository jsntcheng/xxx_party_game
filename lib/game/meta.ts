/** 格子类型与配置列表的文字元信息（单一真相源）。 */
import { BACK_TO_START, type CellEffect, type CellListKey, type TileKind } from "./types"

export const TILE_LABELS: Record<TileKind, { name: string; description: string }> = {
  start: { name: "起点", description: "旅程从这里开始" },
  end: { name: "终点", description: "先到达者获胜" },
  normal: { name: "甜蜜任务", description: "落到这里时现抽一个任务：普通任务中适合自己的，加上自己的专属任务" },
  truth: { name: "真心话", description: "回答真心话问题" },
  dare: { name: "大冒险", description: "完成大冒险任务" },
  kiss: { name: "亲亲", description: "亲亲任务" },
  hug: { name: "抱抱", description: "拥抱任务" },
  punishment: { name: "惩罚", description: "接受小惩罚" },
  reward: { name: "奖励", description: "获得奖励" },
  forward: { name: "前进", description: "前进指定格数" },
  backward: { name: "后退", description: "后退指定格数" },
  skip: { name: "停一轮", description: "暂停一回合" },
  again: { name: "再掷一次", description: "可以再掷一次骰子" },
  swap: { name: "交换", description: "与对方交换位置" },
  endpoint: { name: "终点冲刺", description: "终点前的专属任务" },
}

/** 配置编辑器里每个列表的标题，以及新增条目时的默认类型。 */
export const CELL_LIST_META: Record<CellListKey, { label: string; type: TileKind }> = {
  normalCells: { label: "普通", type: "normal" },
  maleCells: { label: "男生专属", type: "normal" },
  femaleCells: { label: "女生专属", type: "normal" },
  truthCells: { label: "真心话", type: "truth" },
  dareCells: { label: "大冒险", type: "dare" },
  kissCells: { label: "亲亲", type: "kiss" },
  hugCells: { label: "抱抱", type: "hug" },
  punishmentCells: { label: "惩罚", type: "punishment" },
  rewardCells: { label: "奖励", type: "reward" },
  effectCells: { label: "效果格", type: "forward" },
  endpointCells: { label: "终点区", type: "endpoint" },
}

/** 把效果翻译成给玩家看的提示。 */
export function describeEffect(effect: CellEffect | undefined): string | null {
  if (!effect) return null
  switch (effect.type) {
    case "move":
      if (effect.value === BACK_TO_START) return "完成后回到起点"
      return effect.value > 0 ? `完成后前进 ${effect.value} 格` : `完成后后退 ${-effect.value} 格`
    case "skip":
      return "完成后下一轮暂停"
    case "again":
      return "完成后可以再掷一次"
    case "swap":
      return "完成后与对方交换位置"
  }
}
