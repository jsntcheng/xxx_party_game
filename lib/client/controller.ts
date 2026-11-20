import type { SeatStatus } from "@/lib/api-types"
import type { GameAction, GameConfig, GameState, Seat } from "@/lib/game/types"

/** 游戏界面依赖的统一接口：联机与同屏两种实现。 */
export interface GameController {
  mode: "online" | "local"
  roomId: string | null
  config: GameConfig
  state: GameState
  /** 我的座位；同屏模式为 null（任何人都可以操作）。 */
  mySeat: Seat | null
  seats: [SeatStatus, SeatStatus]
  /** 联机模式下与服务器的连接是否正常。 */
  connected: boolean
  /** 有操作正在提交。 */
  busy: boolean
  /** 校准到服务器时间的当前时间戳（计时器用）。 */
  now: () => number
  /** 提交操作，成功返回 true；失败时已自行提示。 */
  dispatch: (action: GameAction) => Promise<boolean>
  leave: () => void
}

/** 当前操作者能否以 seat 的身份行动。 */
export function canActAs(controller: Pick<GameController, "mySeat">, seat: Seat): boolean {
  return controller.mySeat === null || controller.mySeat === seat
}
