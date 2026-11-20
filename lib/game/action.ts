/** 校验客户端提交的操作与玩家资料（系统边界）。 */
import { ConfigError, parseGameConfig } from "./config"
import type { GameAction, PlayerProfile, TimerOp } from "./types"

export const NAME_MAX_LENGTH = 12

const TIMER_OPS: readonly TimerOp[] = ["start", "pause", "reset"]

export function parseAction(input: unknown): GameAction {
  if (typeof input !== "object" || input === null) throw new ConfigError("操作格式错误")
  const action = input as Record<string, unknown>
  switch (action.type) {
    case "roll":
    case "completeTask":
    case "changeTask":
    case "restart":
      return { type: action.type }
    case "timer":
      if (!TIMER_OPS.includes(action.op as TimerOp)) throw new ConfigError("未知计时操作")
      return { type: "timer", op: action.op as TimerOp }
    case "timerDuration":
      if (typeof action.seconds !== "number") throw new ConfigError("计时秒数必须是数字")
      return { type: "timerDuration", seconds: action.seconds }
    case "updateConfig":
      return { type: "updateConfig", config: parseGameConfig(action.config) }
    default:
      throw new ConfigError("未知操作")
  }
}

export function parsePlayerProfile(input: unknown): PlayerProfile {
  const profile = (typeof input === "object" && input !== null ? input : {}) as Record<string, unknown>
  const name = typeof profile.name === "string" ? profile.name.trim() : ""
  if (!name) throw new ConfigError("请输入昵称")
  if ([...name].length > NAME_MAX_LENGTH) throw new ConfigError(`昵称最多 ${NAME_MAX_LENGTH} 个字`)
  if (profile.gender !== "male" && profile.gender !== "female") throw new ConfigError("请选择性别")
  return { name, gender: profile.gender }
}
