export type CellType =
  | "normal"
  | "start"
  | "end"
  | "endpoint"
  | "forward" // 前进格
  | "backward" // 后退格
  | "skip" // 停一轮
  | "again" // 再掷一次
  | "truth" // 真心话
  | "dare" // 大冒险
  | "kiss" // 亲亲格
  | "hug" // 抱抱格
  | "punishment" // 惩罚格
  | "reward" // 奖励格
  | "swap" // 交换位置

export type GenderType = "male" | "female" | "both"

export interface GameCell {
  id: number
  content: string
  type: CellType
  player?: GenderType
  effect?: {
    type: "move" | "skip" | "again" | "swap"
    value?: number
  }
}

export interface SpecialCellConfig {
  type: CellType
  name: string
  color: string
  borderColor: string
  description: string
}

export const specialCellConfigs: SpecialCellConfig[] = [
  {
    type: "forward",
    name: "前进",
    color: "bg-green-400",
    borderColor: "border-green-600",
    description: "前进指定格数",
  },
  { type: "backward", name: "后退", color: "bg-red-400", borderColor: "border-red-600", description: "后退指定格数" },
  { type: "skip", name: "停一轮", color: "bg-gray-400", borderColor: "border-gray-600", description: "暂停一回合" },
  {
    type: "again",
    name: "再掷一次",
    color: "bg-yellow-400",
    borderColor: "border-yellow-600",
    description: "可以再掷一次骰子",
  },
  {
    type: "truth",
    name: "真心话",
    color: "bg-blue-400",
    borderColor: "border-blue-600",
    description: "回答真心话问题",
  },
  {
    type: "dare",
    name: "大冒险",
    color: "bg-purple-400",
    borderColor: "border-purple-600",
    description: "完成大冒险任务",
  },
  { type: "kiss", name: "亲亲", color: "bg-pink-400", borderColor: "border-pink-600", description: "亲亲任务" },
  { type: "hug", name: "抱抱", color: "bg-rose-300", borderColor: "border-rose-500", description: "拥抱任务" },
  {
    type: "punishment",
    name: "惩罚",
    color: "bg-orange-500",
    borderColor: "border-orange-700",
    description: "接受小惩罚",
  },
  { type: "reward", name: "奖励", color: "bg-emerald-400", borderColor: "border-emerald-600", description: "获得奖励" },
  {
    type: "swap",
    name: "交换",
    color: "bg-indigo-400",
    borderColor: "border-indigo-600",
    description: "与对方交换位置",
  },
]

// 默认普通格子内容
export const defaultNormalCells: GameCell[] = [
  { id: 1, content: "为对方做一次肩部按摩30秒", type: "normal", player: "both" },
  { id: 2, content: "与对方十指紧扣1分钟", type: "normal", player: "both" },
  { id: 3, content: "与对方对视30秒不许笑", type: "normal", player: "both" },
  { id: 4, content: "用唇语说一句话让对方猜", type: "normal", player: "both" },
  { id: 5, content: "为对方唱一首情歌", type: "normal", player: "both" },
  { id: 6, content: "亲吻对方额头", type: "normal", player: "both" },
  { id: 7, content: "为对方捏捏脸10秒", type: "normal", player: "both" },
  { id: 8, content: "抱对方1分钟", type: "normal", player: "both" },
  { id: 9, content: "为对方做一件贴心的小事", type: "normal", player: "both" },
  { id: 10, content: "互相按摩对方的手1分钟", type: "normal", player: "both" },
  { id: 11, content: "手牵手走一圈房间", type: "normal", player: "both" },
  { id: 12, content: "对方可以在你脸上亲一下", type: "normal", player: "both" },
  { id: 13, content: "为对方按摩肩膀1分钟", type: "normal", player: "both" },
  { id: 14, content: "互相说出3个喜欢对方的地方", type: "normal", player: "both" },
  { id: 15, content: "给对方一个公主抱/熊抱", type: "normal", player: "both" },
  { id: 16, content: "模仿对方的一个可爱动作", type: "normal", player: "both" },
]

export const defaultMaleCells: GameCell[] = [
  { id: 1001, content: "做20个俯卧撑", type: "normal", player: "male" },
  { id: 1002, content: "单膝跪地向女方表白", type: "normal", player: "male" },
  { id: 1003, content: "公主抱女方转一圈", type: "normal", player: "male" },
  { id: 1004, content: "用最帅的声音说我爱你", type: "normal", player: "male" },
  { id: 1005, content: "为女方按摩双脚2分钟", type: "normal", player: "male" },
  { id: 1006, content: "模仿霸道总裁说一段台词", type: "normal", player: "male" },
  { id: 1007, content: "为女方倒一杯水并喂她喝", type: "normal", player: "male" },
  { id: 1008, content: "做30个深蹲", type: "normal", player: "male" },
]

export const defaultFemaleCells: GameCell[] = [
  { id: 2001, content: "撒娇说一句我想你了", type: "normal", player: "female" },
  { id: 2002, content: "跳一段可爱的舞蹈", type: "normal", player: "female" },
  { id: 2003, content: "用嗲嗲的声音叫老公", type: "normal", player: "female" },
  { id: 2004, content: "做一个可爱的表情并拍照", type: "normal", player: "female" },
  { id: 2005, content: "给男方一个爱的抱抱", type: "normal", player: "female" },
  { id: 2006, content: "用萌萌的声音说我爱你", type: "normal", player: "female" },
  { id: 2007, content: "亲吻男方的手背", type: "normal", player: "female" },
  { id: 2008, content: "模仿小猫叫三声", type: "normal", player: "female" },
]

// 真心话格子内容
export const defaultTruthCells: GameCell[] = [
  { id: 101, content: "说出你最喜欢对方的3个优点", type: "truth", player: "both" },
  { id: 102, content: "第一次见到对方是什么感觉", type: "truth", player: "both" },
  { id: 103, content: "告诉对方你的一个小秘密", type: "truth", player: "both" },
  { id: 104, content: "说出你们在一起最开心的一件事", type: "truth", player: "both" },
  { id: 105, content: "你最想和对方一起去的地方", type: "truth", player: "both" },
  { id: 106, content: "说出你觉得对方最性感的地方", type: "truth", player: "both" },
  { id: 107, content: "你对对方做过最浪漫的事", type: "truth", player: "both" },
  { id: 108, content: "说出你最想对对方说的一句话", type: "truth", player: "both" },
]

// 大冒险格子内容
export const defaultDareCells: GameCell[] = [
  { id: 201, content: "模仿对方的一个习惯动作", type: "dare", player: "both" },
  { id: 202, content: "用搞笑的声音说我爱你", type: "dare", player: "both" },
  { id: 203, content: "表演一段即兴舞蹈", type: "dare", player: "both" },
  { id: 204, content: "用肢体语言表演一部电影", type: "dare", player: "both" },
  { id: 205, content: "闭眼画对方的画像", type: "dare", player: "both" },
  { id: 206, content: "男生做10个俯卧撑", type: "dare", player: "male" },
  { id: 207, content: "女生跳一段可爱的舞", type: "dare", player: "female" },
  { id: 208, content: "用方言说一段告白", type: "dare", player: "both" },
]

// 亲亲格子内容
export const defaultKissCells: GameCell[] = [
  { id: 301, content: "亲吻对方嘴唇3秒", type: "kiss", player: "both" },
  { id: 302, content: "亲吻对方脸颊", type: "kiss", player: "both" },
  { id: 303, content: "亲吻对方手背", type: "kiss", player: "both" },
  { id: 304, content: "蜻蜓点水式亲吻5次", type: "kiss", player: "both" },
  { id: 305, content: "亲吻对方耳朵", type: "kiss", player: "both" },
  { id: 306, content: "法式深吻10秒", type: "kiss", player: "both" },
]

// 抱抱格子内容
export const defaultHugCells: GameCell[] = [
  { id: 401, content: "拥抱对方1分钟", type: "hug", player: "both" },
  { id: 402, content: "从背后抱住对方30秒", type: "hug", player: "both" },
  { id: 403, content: "抱着对方转一圈", type: "hug", player: "both" },
  { id: 404, content: "像树袋熊一样抱住对方", type: "hug", player: "both" },
]

// 惩罚格子内容
export const defaultPunishmentCells: GameCell[] = [
  { id: 501, content: "后退3格", type: "punishment", player: "both", effect: { type: "move", value: -3 } },
  { id: 502, content: "后退2格", type: "punishment", player: "both", effect: { type: "move", value: -2 } },
  { id: 503, content: "回到起点", type: "punishment", player: "both", effect: { type: "move", value: -999 } },
  { id: 504, content: "停一轮", type: "punishment", player: "both", effect: { type: "skip" } },
  { id: 505, content: "喝一杯水", type: "punishment", player: "both" },
  { id: 506, content: "做20个深蹲", type: "punishment", player: "both" },
]

// 奖励格子内容
export const defaultRewardCells: GameCell[] = [
  { id: 601, content: "前进3格", type: "reward", player: "both", effect: { type: "move", value: 3 } },
  { id: 602, content: "前进2格", type: "reward", player: "both", effect: { type: "move", value: 2 } },
  { id: 603, content: "再掷一次骰子", type: "reward", player: "both", effect: { type: "again" } },
  { id: 604, content: "可以让对方后退1格", type: "reward", player: "both" },
  { id: 605, content: "获得一次免任务机会", type: "reward", player: "both" },
]

// 特殊效果格子
export const defaultEffectCells: GameCell[] = [
  { id: 701, content: "前进2格", type: "forward", player: "both", effect: { type: "move", value: 2 } },
  { id: 702, content: "前进3格", type: "forward", player: "both", effect: { type: "move", value: 3 } },
  { id: 703, content: "后退2格", type: "backward", player: "both", effect: { type: "move", value: -2 } },
  { id: 704, content: "后退3格", type: "backward", player: "both", effect: { type: "move", value: -3 } },
  { id: 705, content: "停一轮", type: "skip", player: "both", effect: { type: "skip" } },
  { id: 706, content: "再掷一次", type: "again", player: "both", effect: { type: "again" } },
  { id: 707, content: "与对方交换位置", type: "swap", player: "both", effect: { type: "swap" } },
]

// 终点区域专属内容
export const defaultEndpointCells: GameCell[] = [
  { id: 801, content: "最后冲刺！深情亲吻5秒", type: "endpoint", player: "both" },
  { id: 802, content: "深情告白30秒", type: "endpoint", player: "both" },
  { id: 803, content: "紧紧拥抱1分钟", type: "endpoint", player: "both" },
  { id: 804, content: "为对方按摩2分钟", type: "endpoint", player: "both" },
  { id: 805, content: "说出今晚最想做的事", type: "endpoint", player: "both" },
  { id: 806, content: "法式深吻30秒", type: "endpoint", player: "both" },
]

export const defaultEndpointContent = {
  title: "终点",
  subtitle: "恭喜到达！",
  reward: "赢家可以提一个要求对方必须答应",
}

// 场景卡相关配置
export interface SceneCard {
  id: number
  title: string
  description: string
  icon?: string
  pool: string // 添加 pool 属性指定属于哪个卡池
}

export const defaultSceneCardPoolNames: string[] = ["氛围类", "互动规则", "效果增强"]

export const defaultSceneCards: SceneCard[] = [
  // 氛围类
  {
    id: 101,
    title: "浪漫烛光",
    description: "关掉灯，点上蜡烛或打开手机手电筒营造浪漫氛围",
    icon: "🕯️",
    pool: "氛围类",
  },
  { id: 102, title: "背景音乐", description: "播放一首浪漫的情歌作为背景音乐", icon: "🎵", pool: "氛围类" },
  { id: 103, title: "星空投影", description: "打开星空投影灯或手机星空壁纸营造梦幻氛围", icon: "✨", pool: "氛围类" },
  { id: 104, title: "香氛弥漫", description: "点上香薰或喷洒香水，让空气充满浪漫气息", icon: "🌸", pool: "氛围类" },
  // 互动规则
  { id: 201, title: "眼神交流", description: "每次完成任务前，先深情对视10秒", icon: "👀", pool: "互动规则" },
  { id: 202, title: "甜言蜜语", description: "每次轮到自己时，先对对方说一句情话", icon: "💬", pool: "互动规则" },
  { id: 203, title: "肢体接触", description: "游戏过程中双方必须保持手牵手", icon: "🤝", pool: "互动规则" },
  {
    id: 204,
    title: "角色扮演",
    description: "接下来的任务中，双方要用角色扮演的方式完成",
    icon: "🎭",
    pool: "互动规则",
  },
  { id: 205, title: "禁止说话", description: "接下来3轮内只能用肢体语言交流", icon: "🤫", pool: "互动规则" },
  // 效果增强
  { id: 301, title: "惩罚加倍", description: "所有惩罚格子的效果翻倍", icon: "⚡", pool: "效果增强" },
  { id: 302, title: "奖励加倍", description: "所有奖励格子的效果翻倍", icon: "🎁", pool: "效果增强" },
  { id: 303, title: "亲密升级", description: "所有亲亲抱抱任务时间延长一倍", icon: "💕", pool: "效果增强" },
  { id: 304, title: "真心时刻", description: "每次完成任务后要说一件喜欢对方的事", icon: "❤️", pool: "效果增强" },
  { id: 305, title: "服装要求", description: "选择一件对方喜欢的衣服穿上继续游戏", icon: "👗", pool: "效果增强" },
]

// 兼容旧格式的转换函数
export const defaultSceneCardPools: SceneCard[][] = defaultSceneCardPoolNames.map((poolName) =>
  defaultSceneCards.filter((card) => card.pool === poolName),
)

// 完整的游戏配置
export interface GameConfig {
  normalCells: GameCell[]
  maleCells: GameCell[]
  femaleCells: GameCell[]
  truthCells: GameCell[]
  dareCells: GameCell[]
  kissCells: GameCell[]
  hugCells: GameCell[]
  punishmentCells: GameCell[]
  rewardCells: GameCell[]
  effectCells: GameCell[]
  endpointCells: GameCell[]
  endpointContent: typeof defaultEndpointContent
  boardSize: number
  specialCellPositions: { [position: number]: CellType }
  sceneCardPoolNames: string[] // 卡池名称列表
  sceneCards: SceneCard[] // 所有场景卡，每张卡有pool属性
  sceneCardCount: number // 游戏开始时抽取的场景卡数量（每个卡池抽一张）
  // 保留兼容旧格式
  sceneCardPools?: SceneCard[][]
}

export const defaultGameConfig: GameConfig = {
  normalCells: defaultNormalCells,
  maleCells: defaultMaleCells,
  femaleCells: defaultFemaleCells,
  truthCells: defaultTruthCells,
  dareCells: defaultDareCells,
  kissCells: defaultKissCells,
  hugCells: defaultHugCells,
  punishmentCells: defaultPunishmentCells,
  rewardCells: defaultRewardCells,
  effectCells: defaultEffectCells,
  endpointCells: defaultEndpointCells,
  endpointContent: defaultEndpointContent,
  boardSize: 48,
  specialCellPositions: {
    5: "truth",
    10: "forward",
    15: "dare",
    18: "backward",
    22: "kiss",
    25: "again",
    28: "truth",
    32: "hug",
    35: "punishment",
    38: "reward",
    40: "dare",
    42: "swap",
    45: "kiss",
  },
  sceneCardPoolNames: defaultSceneCardPoolNames,
  sceneCards: defaultSceneCards,
  sceneCardCount: 3,
}

export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

// 根据配置生成棋盘
export function generateBoard(config: GameConfig): GameCell[] {
  const board: GameCell[] = []

  // 准备各类型格子的池
  const pools: { [key in CellType]?: GameCell[] } = {
    normal: shuffleArray([...config.normalCells]),
    truth: shuffleArray([...config.truthCells]),
    dare: shuffleArray([...config.dareCells]),
    kiss: shuffleArray([...config.kissCells]),
    hug: shuffleArray([...config.hugCells]),
    punishment: shuffleArray([...config.punishmentCells]),
    reward: shuffleArray([...config.rewardCells]),
    forward: config.effectCells.filter((c) => c.type === "forward"),
    backward: config.effectCells.filter((c) => c.type === "backward"),
    skip: config.effectCells.filter((c) => c.type === "skip"),
    again: config.effectCells.filter((c) => c.type === "again"),
    swap: config.effectCells.filter((c) => c.type === "swap"),
  }

  const poolIndexes: { [key: string]: number } = {}

  const getFromPool = (type: CellType): GameCell | null => {
    const pool = pools[type]
    if (!pool || pool.length === 0) return null

    if (!poolIndexes[type]) poolIndexes[type] = 0
    const index = poolIndexes[type] % pool.length
    poolIndexes[type]++
    return { ...pool[index] }
  }

  // 生成棋盘
  for (let i = 1; i <= config.boardSize; i++) {
    const fixedType = config.specialCellPositions[i]

    if (fixedType) {
      const cell = getFromPool(fixedType)
      if (cell) {
        board.push({ ...cell, id: i })
      } else {
        board.push({ id: i, content: "休息一下", type: "normal", player: "both" })
      }
    } else {
      // 随机分配普通格子或随机特殊格子
      const random = Math.random()
      let cell: GameCell | null = null

      if (random < 0.6) {
        cell = getFromPool("normal")
      } else if (random < 0.7) {
        cell = getFromPool("truth")
      } else if (random < 0.8) {
        cell = getFromPool("dare")
      } else if (random < 0.85) {
        cell = getFromPool("kiss")
      } else if (random < 0.9) {
        cell = getFromPool("hug")
      } else if (random < 0.98) {
        cell = getFromPool("reward")
      } else {
        cell = getFromPool("punishment")
      }

      if (cell) {
        board.push({ ...cell, id: i })
      } else {
        board.push({ id: i, content: "安全格", type: "normal", player: "both" })
      }
    }
  }

  return board
}
