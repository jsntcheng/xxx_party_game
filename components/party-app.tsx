"use client"

import { Heart } from "lucide-react"
import { useCallback, useState, useSyncExternalStore } from "react"
import { GameScreen } from "@/components/game/game-screen"
import { Lobby } from "@/components/lobby"
import { toast, Toaster } from "@/components/ui/toast"
import { useLocalGame } from "@/hooks/use-local-game"
import { useOnlineGame } from "@/hooks/use-online-game"
import { ROOM_ID_PATTERN, type SeatGrant } from "@/lib/api-types"
import { api, ApiError } from "@/lib/client/api"
import { storage, type OnlineSession } from "@/lib/client/storage"
import { secureRng } from "@/lib/game/board"
import { defaultGameConfig } from "@/lib/game/defaults"
import { createGame } from "@/lib/game/engine"
import type { GameConfig, GameSnapshot, PlayerProfile } from "@/lib/game/types"

type Phase =
  | { kind: "lobby" }
  | { kind: "online"; session: OnlineSession; initial: SeatGrant | null }
  | { kind: "local"; snapshot: GameSnapshot }

/** 地址栏反映当前所在：/?room=ID 联机、/?local 同屏、/ 大厅，刷新后可以回到原处。 */
function syncUrl(phase: Phase) {
  const query = phase.kind === "online" ? `?room=${phase.session.roomId}` : phase.kind === "local" ? "?local" : ""
  window.history.replaceState(null, "", `${window.location.pathname}${query}`)
}

/** 首次进入：按地址栏和本地存档决定落在哪里。 */
function initialPhase(): { phase: Phase; inviteRoom: string | null } {
  const params = new URLSearchParams(window.location.search)
  const roomParam = params.get("room")?.trim().toUpperCase() ?? null
  const inviteRoom = roomParam && ROOM_ID_PATTERN.test(roomParam) ? roomParam : null
  const session = storage.getSession()

  if (inviteRoom && session?.roomId === inviteRoom) {
    return { phase: { kind: "online", session, initial: null }, inviteRoom: null }
  }
  if (!inviteRoom && params.has("local")) {
    const snapshot = storage.getLocalGame()
    if (snapshot) return { phase: { kind: "local", snapshot }, inviteRoom: null }
  }
  return { phase: { kind: "lobby" }, inviteRoom }
}

const noopSubscribe = () => () => {}

/** 客户端渲染：游戏状态全部来自 localStorage 与接口，服务端只输出外壳。 */
export function PartyApp() {
  const hydrated = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  )
  return (
    <>
      {hydrated ? <PartyRouter /> : <Splash />}
      <Toaster />
    </>
  )
}

function PartyRouter() {
  const [start] = useState(initialPhase)
  const [phase, setPhaseState] = useState<Phase>(start.phase)
  const [inviteRoom, setInviteRoom] = useState(start.inviteRoom)
  const [busy, setBusy] = useState(false)

  const setPhase = useCallback((next: Phase) => {
    syncUrl(next)
    setPhaseState(next)
  }, [])

  const enterRoom = (grant: SeatGrant) => {
    const session = { roomId: grant.room.id, token: grant.token, seat: grant.seat }
    storage.setSession(session)
    setInviteRoom(null)
    setPhase({ kind: "online", session, initial: grant })
  }

  /** 包装大厅里的联网操作：防重复点击 + 统一错误提示。 */
  const withBusy = async (run: () => Promise<void>) => {
    if (busy) return
    setBusy(true)
    try {
      await run()
    } catch (error) {
      toast(error instanceof ApiError ? error.message : "操作失败，请重试", "error")
    } finally {
      setBusy(false)
    }
  }

  const create = (profile: PlayerProfile) => withBusy(async () => enterRoom(await api.createRoom(profile)))

  const join = (roomId: string, profile: PlayerProfile) =>
    withBusy(async () => {
      const session = storage.getSession()
      const token = session?.roomId === roomId ? session.token : null
      enterRoom(await api.joinRoom(roomId, profile, token))
    })

  const startLocal = (players: [PlayerProfile, PlayerProfile]) =>
    withBusy(async () => {
      const config = await loadDefaultConfig()
      const snapshot = { config, state: createGame(config, players, secureRng) }
      storage.setLocalGame(snapshot)
      setPhase({ kind: "local", snapshot })
    })

  const resumeRoom = () => {
    const session = storage.getSession()
    if (session) setPhase({ kind: "online", session, initial: null })
  }

  const resumeLocal = () => {
    const snapshot = storage.getLocalGame()
    if (snapshot) setPhase({ kind: "local", snapshot })
    else toast("同屏存档已损坏，请重新开始", "error")
  }

  /** 主动离开保留会话（大厅可「回到房间」）；房间失效时清除会话并提示原因。 */
  const exitOnline = useCallback(
    (reason?: string) => {
      if (reason) {
        storage.setSession(null)
        toast(reason, "error")
      }
      setPhase({ kind: "lobby" })
    },
    [setPhase],
  )

  const exitLocal = useCallback(() => setPhase({ kind: "lobby" }), [setPhase])

  if (phase.kind === "online") {
    return (
      <OnlineGame key={phase.session.token} session={phase.session} initial={phase.initial} onExit={exitOnline} />
    )
  }
  if (phase.kind === "local") {
    return <LocalGame key={phase.snapshot.state.gameId} snapshot={phase.snapshot} onLeave={exitLocal} />
  }
  return (
    <Lobby
      inviteRoom={inviteRoom}
      resumeRoom={storage.getSession()?.roomId ?? null}
      hasLocalGame={storage.getLocalGame() !== null}
      busy={busy}
      onCreate={create}
      onJoin={join}
      onLocal={startLocal}
      onResumeRoom={resumeRoom}
      onResumeLocal={resumeLocal}
    />
  )
}

/** 同屏对局使用服务器上的默认配置（管理员可修改），离线时用内置配置。 */
async function loadDefaultConfig(): Promise<GameConfig> {
  try {
    return (await api.getDefaultConfig()).config
  } catch {
    return defaultGameConfig
  }
}

interface OnlineGameProps {
  session: OnlineSession
  initial: SeatGrant | null
  onExit: (reason?: string) => void
}

function OnlineGame({ session, initial, onExit }: OnlineGameProps) {
  const controller = useOnlineGame({ session, initial, onExit })
  return controller ? <GameScreen controller={controller} /> : <Splash text={`正在进入房间 ${session.roomId}…`} />
}

function LocalGame({ snapshot, onLeave }: { snapshot: GameSnapshot; onLeave: () => void }) {
  return <GameScreen controller={useLocalGame(snapshot, onLeave)} />
}

function Splash({ text = "加载中…" }: { text?: string }) {
  return (
    <main className="grid min-h-dvh place-items-center">
      <div className="flex flex-col items-center gap-4 text-white/60">
        <Heart className="size-10 animate-pulse fill-pink-400 text-pink-400" />
        <p className="text-sm">{text}</p>
      </div>
    </main>
  )
}
