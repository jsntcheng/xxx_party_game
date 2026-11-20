/** localStorage 持久化：联机会话、本地对局、个人资料、偏好。 */
import { parsePlayerProfile } from "@/lib/game/action"
import { parseGameConfig } from "@/lib/game/config"
import type { GameSnapshot, PlayerProfile, Seat } from "@/lib/game/types"

export interface OnlineSession {
  roomId: string
  token: string
  seat: Seat
}

const KEYS = {
  session: "cfc:session",
  local: "cfc:local",
  profile: "cfc:profile",
  sound: "cfc:sound",
} as const

function read(key: string): unknown {
  try {
    const raw = localStorage.getItem(key)
    return raw === null ? null : (JSON.parse(raw) as unknown)
  } catch {
    return null
  }
}

function write(key: string, value: unknown) {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // 隐私模式或配额已满：不影响游戏本身
  }
}

export const storage = {
  getSession(): OnlineSession | null {
    const value = read(KEYS.session) as Partial<OnlineSession> | null
    if (typeof value?.roomId !== "string" || typeof value.token !== "string") return null
    if (value.seat !== 0 && value.seat !== 1) return null
    return { roomId: value.roomId, token: value.token, seat: value.seat }
  },
  setSession: (session: OnlineSession | null) => write(KEYS.session, session),

  /** 本地对局：配置重新校验，状态做基本结构检查，异常则丢弃。 */
  getLocalGame(): GameSnapshot | null {
    const value = read(KEYS.local) as Partial<GameSnapshot> | null
    if (!value?.state || typeof value.state.gameId !== "string" || !Array.isArray(value.state.board)) return null
    try {
      return { config: parseGameConfig(value.config), state: value.state }
    } catch {
      return null
    }
  },
  setLocalGame: (snapshot: GameSnapshot | null) => write(KEYS.local, snapshot),

  getProfile(): PlayerProfile | null {
    try {
      return parsePlayerProfile(read(KEYS.profile))
    } catch {
      return null
    }
  },
  setProfile: (profile: PlayerProfile) => write(KEYS.profile, profile),

  getSoundEnabled: () => read(KEYS.sound) !== false,
  setSoundEnabled: (enabled: boolean) => write(KEYS.sound, enabled),
}
