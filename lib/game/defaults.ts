/** 内置默认配置（服务端未保存默认配置时使用）。 */
import type { EndpointContent, GameCell, GameConfig, SceneCard } from "./types"

// 默认普通格子内容
const defaultNormalCells: GameCell[] = [
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

const defaultMaleCells: GameCell[] = [
  { id: 1001, content: "做20个俯卧撑", type: "normal", player: "male" },
  { id: 1002, content: "单膝跪地向女方表白", type: "normal", player: "male" },
  { id: 1003, content: "公主抱女方转一圈", type: "normal", player: "male" },
  { id: 1004, content: "用最帅的声音说我爱你", type: "normal", player: "male" },
  { id: 1005, content: "为女方按摩双脚2分钟", type: "normal", player: "male" },
  { id: 1006, content: "模仿霸道总裁说一段台词", type: "normal", player: "male" },
  { id: 1007, content: "为女方倒一杯水并喂她喝", type: "normal", player: "male" },
  { id: 1008, content: "做30个深蹲", type: "normal", player: "male" },
]

const defaultFemaleCells: GameCell[] = [
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
const defaultTruthCells: GameCell[] = [
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
const defaultDareCells: GameCell[] = [
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
const defaultKissCells: GameCell[] = [
  { id: 301, content: "亲吻对方嘴唇3秒", type: "kiss", player: "both" },
  { id: 302, content: "亲吻对方脸颊", type: "kiss", player: "both" },
  { id: 303, content: "亲吻对方手背", type: "kiss", player: "both" },
  { id: 304, content: "蜻蜓点水式亲吻5次", type: "kiss", player: "both" },
  { id: 305, content: "亲吻对方耳朵", type: "kiss", player: "both" },
  { id: 306, content: "法式深吻10秒", type: "kiss", player: "both" },
]

// 抱抱格子内容
const defaultHugCells: GameCell[] = [
  { id: 401, content: "拥抱对方1分钟", type: "hug", player: "both" },
  { id: 402, content: "从背后抱住对方30秒", type: "hug", player: "both" },
  { id: 403, content: "抱着对方转一圈", type: "hug", player: "both" },
  { id: 404, content: "像树袋熊一样抱住对方", type: "hug", player: "both" },
]

// 惩罚格子内容
const defaultPunishmentCells: GameCell[] = [
  { id: 501, content: "后退3格", type: "punishment", player: "both", effect: { type: "move", value: -3 } },
  { id: 502, content: "后退2格", type: "punishment", player: "both", effect: { type: "move", value: -2 } },
  { id: 503, content: "回到起点", type: "punishment", player: "both", effect: { type: "move", value: -999 } },
  { id: 504, content: "停一轮", type: "punishment", player: "both", effect: { type: "skip" } },
  { id: 505, content: "喝一杯水", type: "punishment", player: "both" },
  { id: 506, content: "做20个深蹲", type: "punishment", player: "both" },
]

// 奖励格子内容
const defaultRewardCells: GameCell[] = [
  { id: 601, content: "前进3格", type: "reward", player: "both", effect: { type: "move", value: 3 } },
  { id: 602, content: "前进2格", type: "reward", player: "both", effect: { type: "move", value: 2 } },
  { id: 603, content: "再掷一次骰子", type: "reward", player: "both", effect: { type: "again" } },
  { id: 604, content: "可以让对方后退1格", type: "reward", player: "both" },
  { id: 605, content: "获得一次免任务机会", type: "reward", player: "both" },
]

// 特殊效果格子
const defaultEffectCells: GameCell[] = [
  { id: 701, content: "前进2格", type: "forward", player: "both", effect: { type: "move", value: 2 } },
  { id: 702, content: "前进3格", type: "forward", player: "both", effect: { type: "move", value: 3 } },
  { id: 703, content: "后退2格", type: "backward", player: "both", effect: { type: "move", value: -2 } },
  { id: 704, content: "后退3格", type: "backward", player: "both", effect: { type: "move", value: -3 } },
  { id: 705, content: "停一轮", type: "skip", player: "both", effect: { type: "skip" } },
  { id: 706, content: "再掷一次", type: "again", player: "both", effect: { type: "again" } },
  { id: 707, content: "与对方交换位置", type: "swap", player: "both", effect: { type: "swap" } },
]

// 终点区域专属内容
const defaultEndpointCells: GameCell[] = [
  { id: 801, content: "最后冲刺！深情亲吻5秒", type: "endpoint", player: "both" },
  { id: 802, content: "深情告白30秒", type: "endpoint", player: "both" },
  { id: 803, content: "紧紧拥抱1分钟", type: "endpoint", player: "both" },
  { id: 804, content: "为对方按摩2分钟", type: "endpoint", player: "both" },
  { id: 805, content: "说出今晚最想做的事", type: "endpoint", player: "both" },
  { id: 806, content: "法式深吻30秒", type: "endpoint", player: "both" },
]

const defaultEndpointContent: EndpointContent = {
  title: "终点",
  subtitle: "恭喜到达！",
  reward: "赢家可以提一个要求对方必须答应",
}

const defaultSceneCardPoolNames: string[] = ["氛围类", "互动规则", "效果增强"]

const defaultSceneCards: SceneCard[] = [
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
