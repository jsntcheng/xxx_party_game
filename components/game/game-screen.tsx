"use client"

import { Copy, Layers, LogOut, RotateCcw, Settings2, Share2, WifiOff } from "lucide-react"
import { useEffect, useMemo, useState, type ReactNode } from "react"
import { ConfigDialog } from "@/components/config/config-dialog"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { toast } from "@/components/ui/toast"
import { canActAs, type GameController } from "@/lib/client/controller"
import { canChangeTask } from "@/lib/game/engine"
import { TILE_LABELS } from "@/lib/game/meta"
import type { GameAction, GameConfig, TileKind } from "@/lib/game/types"
import { cn } from "@/lib/utils"
import { usePieceAnimation } from "@/hooks/use-piece-animation"
import { Board } from "./board"
import { Dice } from "./dice"
import { floatHearts } from "./effects"
import { EventLog } from "./event-log"
import { PlayerCard } from "./player-card"
import { SceneCardsDialog } from "./scene-cards"
import { TaskDialog } from "./task-dialog"
import { TilePreview } from "./tile-preview"
import { PLAYER_STYLES, TILE_STYLES } from "./tile-style"
import { Timer } from "./timer"
import { WinnerDialog } from "./winner-dialog"

const HEART_TASKS = new Set<TileKind>(["kiss", "hug"])
const RULES = [
  "双方轮流掷骰子前进，落到哪格就完成哪格的任务",
  "任务完成后才结算格子效果（前进、后退、停一轮、交换……）",
  "甜蜜任务落到时才抽，男女各抽适合自己的；不满意可以「换一个」，每格一次",
  "先到达终点的一方获胜，赢家领取终点奖励",
]

type Confirming = "restart" | "leave" | null

export function GameScreen({ controller }: { controller: GameController }) {
  const { config, state, mode, mySeat, seats, busy, roomId } = controller
  const { positions, moving } = usePieceAnimation(state)
  const [preview, setPreview] = useState<number | null>(null)
  const [configOpen, setConfigOpen] = useState(false)
  const [confirming, setConfirming] = useState<Confirming>(null)

  // 每局开局自动展示一次场景卡（中途重连不弹）
  const [sceneFor, setSceneFor] = useState<string | null>(null)
  const [sceneOpen, setSceneOpen] = useState(false)
  if (sceneFor !== state.gameId) {
    setSceneFor(state.gameId)
    setSceneOpen(state.lastRoll === null && state.sceneCards.length > 0)
  }

  // 胜利弹窗关闭后本局不再自动弹出
  const [winnerDismissedFor, setWinnerDismissedFor] = useState<string | null>(null)

  const act = (action: GameAction) => void controller.dispatch(action)
  const goal = state.board.length - 1
  const partnerJoined = seats[1].taken
  const pending = moving ? null : state.pendingTask
  const winner = state.winner
  const winnerOpen = winner !== null && !moving && winnerDismissedFor !== state.gameId
  const canRoll =
    winner === null && !state.pendingTask && !busy && !moving && partnerJoined && canActAs(controller, state.turn)

  const taskKey = pending ? `${state.lastRoll?.id}-${pending.cellIndex}` : null
  const pendingType = pending?.task.type
  useEffect(() => {
    if (taskKey && pendingType && HEART_TASKS.has(pendingType)) floatHearts()
  }, [taskKey, pendingType])

  const applyConfig = async (next: GameConfig) => {
    const ok = await controller.dispatch({ type: "updateConfig", config: next })
    if (ok) toast(state.lastRoll === null ? "配置已生效，棋盘已重新生成" : "配置已保存，下一局生效", "success")
    return ok
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col px-3 pt-[max(env(safe-area-inset-top),0.75rem)] pb-10 sm:px-5">
      <header className="mb-3 flex items-center gap-2 sm:mb-5">
        <h1 className="text-gradient animate-shimmer text-xl font-bold tracking-wide sm:text-2xl">情侣飞行棋</h1>
        {roomId && <RoomChip roomId={roomId} />}
        {!controller.connected && (
          <span className="flex items-center gap-1 rounded-full bg-rose-500/15 px-2 py-1 text-xs text-rose-200">
            <WifiOff className="size-3.5" />
            <span className="hidden sm:inline">网络不稳，重连中…</span>
          </span>
        )}
        <nav className="ml-auto flex items-center gap-0.5 sm:gap-1">
          <HeaderButton label="场景卡" disabled={state.sceneCards.length === 0} onClick={() => setSceneOpen(true)}>
            <Layers />
          </HeaderButton>
          <HeaderButton label="自定义" onClick={() => setConfigOpen(true)}>
            <Settings2 />
          </HeaderButton>
          <HeaderButton label="重新开始" disabled={busy} onClick={() => setConfirming("restart")}>
            <RotateCcw />
          </HeaderButton>
          <HeaderButton label={mode === "online" ? "离开" : "返回"} onClick={() => setConfirming("leave")}>
            <LogOut />
          </HeaderButton>
        </nav>
      </header>

      <div className="grid gap-3 sm:gap-4 lg:grid-cols-[minmax(0,1fr)_340px] lg:grid-rows-[auto_1fr]">
        <section className="space-y-3 lg:col-start-2 lg:row-start-1">
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            {state.players.map((player, seat) => (
              <PlayerCard
                key={seat}
                player={player}
                status={seats[seat]}
                position={positions[seat]}
                goal={goal}
                active={winner === null && state.turn === seat}
                isMe={mySeat === seat}
                showPresence={mode === "online"}
              />
            ))}
          </div>
          <TurnPanel controller={controller} canRoll={canRoll} moving={moving} onRoll={() => act({ type: "roll" })} />
        </section>

        <section className="lg:col-start-1 lg:row-span-2 lg:row-start-1">
          <div className="glass rounded-3xl p-2 sm:p-4">
            <Board
              board={state.board}
              players={state.players}
              positions={positions}
              turn={state.turn}
              highlight={state.pendingTask?.cellIndex ?? null}
              onPreview={setPreview}
            />
          </div>
          <Legend kinds={state.board.map((cell) => cell.type)} />
        </section>

        <section className="space-y-3 lg:col-start-2 lg:row-start-2">
          <Timer timer={state.timer} now={controller.now} disabled={busy} silent={pending !== null} onAction={act} />
          <EventLog log={state.log} />
          <details className="glass group rounded-2xl p-4 text-sm">
            <summary className="cursor-pointer list-none font-medium text-white/80 select-none">
              玩法说明 <span className="text-white/40 group-open:hidden">（点开）</span>
            </summary>
            <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-white/60">
              {RULES.map((rule) => (
                <li key={rule}>{rule}</li>
              ))}
            </ol>
          </details>
        </section>
      </div>

      {pending && winner === null && (
        <TaskDialog
          key={taskKey}
          pending={pending}
          player={state.players[pending.seat]}
          isOwner={canActAs(controller, pending.seat)}
          canChange={canChangeTask({ config, state })}
          busy={busy}
          timer={state.timer}
          now={controller.now}
          onAction={act}
        />
      )}

      {winner !== null && (
        <WinnerDialog
          open={winnerOpen}
          onOpenChange={(open) => !open && setWinnerDismissedFor(state.gameId)}
          winner={state.players[winner]}
          isMe={mySeat === winner}
          endpoint={config.endpointContent}
          busy={busy}
          onRestart={() => act({ type: "restart" })}
        />
      )}

      <SceneCardsDialog open={sceneOpen} onOpenChange={setSceneOpen} cards={state.sceneCards} />
      <TilePreview cell={preview === null ? null : state.board[preview]} index={preview ?? 0} onClose={() => setPreview(null)} />
      <ConfigDialog
        open={configOpen}
        onOpenChange={setConfigOpen}
        config={config}
        applyLabel={state.lastRoll === null ? "保存并重新生成棋盘" : "保存（下一局生效）"}
        onApply={applyConfig}
      />
      <ConfirmDialog
        open={confirming === "restart"}
        onOpenChange={(open) => !open && setConfirming(null)}
        title="重新开始？"
        description="会重新生成棋盘、重新抽取场景卡，当前进度将清空。"
        confirmText="重新开始"
        onConfirm={() => act({ type: "restart" })}
      />
      <ConfirmDialog
        open={confirming === "leave"}
        onOpenChange={(open) => !open && setConfirming(null)}
        title={mode === "online" ? "离开房间？" : "返回首页？"}
        description={
          mode === "online" ? "房间会保留 24 小时，之后可以在首页回到这个房间。" : "进度已自动保存，下次可以继续。"
        }
        confirmText={mode === "online" ? "离开" : "返回"}
        onConfirm={controller.leave}
      />
    </div>
  )
}

function HeaderButton({ label, children, ...props }: { label: string; children: ReactNode } & Omit<React.ComponentProps<"button">, "children">) {
  return (
    <Button variant="ghost" size="sm" aria-label={label} className="h-9 px-2 sm:px-3" {...props}>
      {children}
      <span className="hidden sm:inline">{label}</span>
    </Button>
  )
}

function inviteUrl(roomId: string) {
  return `${window.location.origin}/?room=${roomId}`
}

/** 复制文字；非安全上下文（http 局域网）下 clipboard 不可用时回退。 */
async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

function RoomChip({ roomId }: { roomId: string }) {
  return (
    <button
      type="button"
      onClick={async () => {
        const ok = await copyText(roomId)
        toast(ok ? "房间号已复制" : `房间号：${roomId}`, ok ? "success" : "info")
      }}
      className="flex cursor-pointer items-center gap-1.5 rounded-full bg-white/8 px-2.5 py-1 font-mono text-xs tracking-widest text-white/80 ring-1 ring-white/10 transition hover:bg-white/14"
      aria-label={`复制房间号 ${roomId}`}
    >
      {roomId}
      <Copy className="size-3 text-white/50" />
    </button>
  )
}

interface TurnPanelProps {
  controller: GameController
  canRoll: boolean
  moving: boolean
  onRoll: () => void
}

function TurnPanel({ controller, canRoll, moving, onRoll }: TurnPanelProps) {
  const { state, mode, mySeat, seats, roomId } = controller
  const current = state.players[state.turn]
  const myTurn = canActAs(controller, state.turn)

  let headline: ReactNode
  let hint: string
  if (state.winner !== null) {
    headline = <>🎉 {state.players[state.winner].name} 获胜</>
    hint = "点右上角「重新开始」再来一局"
  } else if (mode === "online" && !seats[1].taken) {
    return <InvitePanel roomId={roomId!} />
  } else {
    const name = <span className={cn("font-semibold", PLAYER_STYLES[current.gender].text)}>{current.name}</span>
    headline = mode === "online" && myTurn ? <>轮到你啦</> : <>轮到 {name}</>
    if (state.pendingTask) hint = "正在完成任务…"
    else if (moving) hint = "棋子移动中…"
    else if (state.extraRoll) hint = "再掷一次！"
    else if (myTurn) hint = "点击骰子出发"
    else hint = `等待 ${current.name} 掷骰子`
  }
  const partnerOffline = mode === "online" && mySeat !== null && !seats[mySeat === 0 ? 1 : 0].online

  return (
    <div className="glass flex items-center gap-4 rounded-2xl p-4">
      <div className="min-w-0 flex-1">
        <p className="text-lg text-white">{headline}</p>
        <p className="mt-1 text-sm text-white/55">{hint}</p>
        {partnerOffline && state.winner === null && <p className="mt-1 text-xs text-amber-200/80">对方好像离线了，回来后会自动同步</p>}
      </div>
      <Dice
        value={state.lastRoll?.value ?? 1}
        rollKey={state.lastRoll?.id ?? null}
        size={72}
        disabled={!canRoll}
        busy={controller.busy}
        onRoll={onRoll}
      />
    </div>
  )
}

function InvitePanel({ roomId }: { roomId: string }) {
  const share = async () => {
    const url = inviteUrl(roomId)
    if (navigator.share) {
      try {
        await navigator.share({ title: "情侣飞行棋", text: `来和我玩情侣飞行棋吧，房间号 ${roomId}`, url })
        return
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return
      }
    }
    const ok = await copyText(url)
    toast(ok ? "邀请链接已复制，发给 TA 吧" : `房间号：${roomId}`, ok ? "success" : "info")
  }

  return (
    <div className="glass rounded-2xl p-4 text-center">
      <p className="text-sm text-white/60">把房间号发给你的另一半</p>
      <p className="text-gradient my-2 font-mono text-4xl font-bold tracking-[0.3em]">{roomId}</p>
      <p className="mb-3 flex items-center justify-center gap-2 text-xs text-white/45">
        <span className="size-1.5 animate-ping rounded-full bg-pink-400" />
        等待 TA 加入，加入后自动开始
      </p>
      <Button className="w-full" onClick={share}>
        <Share2 />
        邀请 TA
      </Button>
    </div>
  )
}

function Legend({ kinds }: { kinds: TileKind[] }) {
  const unique = useMemo(() => [...new Set(kinds)].filter((kind) => kind !== "start" && kind !== "end"), [kinds])
  return (
    <ul className="mt-3 flex flex-wrap gap-x-3 gap-y-1.5 px-1 text-xs text-white/55">
      {unique.map((kind) => {
        const Icon = TILE_STYLES[kind].icon
        return (
          <li key={kind} className="flex items-center gap-1.5">
            <span className={cn("grid size-4 place-items-center rounded", TILE_STYLES[kind].tile)}>
              <Icon className="size-2.5 text-white" />
            </span>
            {TILE_LABELS[kind].name}
          </li>
        )
      })}
    </ul>
  )
}
