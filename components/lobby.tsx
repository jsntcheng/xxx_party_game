"use client"

import { DoorOpen, Heart, History, Smartphone, Sparkles, Users } from "lucide-react"
import { useState, type CSSProperties, type ReactNode } from "react"
import { PLAYER_STYLES } from "@/components/game/tile-style"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/toast"
import { storage } from "@/lib/client/storage"
import { NAME_MAX_LENGTH, parsePlayerProfile } from "@/lib/game/action"
import { ConfigError } from "@/lib/game/config"
import type { Gender, PlayerProfile } from "@/lib/game/types"
import { ROOM_ID_PATTERN } from "@/lib/api-types"
import { cn } from "@/lib/utils"

interface LobbyProps {
  /** 邀请链接 ?room= 带来的房间号。 */
  inviteRoom: string | null
  /** 上次所在的联机房间。 */
  resumeRoom: string | null
  hasLocalGame: boolean
  busy: boolean
  onCreate: (profile: PlayerProfile) => void
  onJoin: (roomId: string, profile: PlayerProfile) => void
  onLocal: (players: [PlayerProfile, PlayerProfile]) => void
  onResumeRoom: () => void
  onResumeLocal: () => void
}

const opposite = (gender: Gender): Gender => (gender === "male" ? "female" : "male")

/** 背景飘落的爱心（固定参数，保证渲染稳定）。 */
const HEARTS = Array.from({ length: 14 }, (_, i) => ({
  left: `${(i * 37) % 100}%`,
  delay: `${-((i * 1.7) % 14)}s`,
  duration: `${11 + (i % 5) * 2}s`,
  scale: 0.6 + ((i * 7) % 5) / 6,
  drift: `${((i % 3) - 1) * 40}px`,
  emoji: ["💗", "💕", "✨", "💖"][i % 4],
}))

export function Lobby(props: LobbyProps) {
  const { inviteRoom, resumeRoom, hasLocalGame, busy } = props
  const [saved] = useState(() => storage.getProfile())
  const [name, setName] = useState(saved?.name ?? "")
  const [gender, setGender] = useState<Gender>(saved?.gender ?? "female")
  const [roomCode, setRoomCode] = useState(inviteRoom ?? "")
  const [partnerName, setPartnerName] = useState("")

  /** 校验并记住自己的昵称，失败时提示。 */
  const profile = (): PlayerProfile | null => {
    try {
      const result = parsePlayerProfile({ name, gender })
      storage.setProfile(result)
      return result
    } catch (error) {
      toast(error instanceof ConfigError ? error.message : "请检查昵称", "error")
      return null
    }
  }

  const create = () => {
    const me = profile()
    if (me) props.onCreate(me)
  }

  const join = () => {
    const code = roomCode.trim().toUpperCase()
    if (!ROOM_ID_PATTERN.test(code)) return toast("房间号是 6 位字母或数字", "error")
    const me = profile()
    if (me) props.onJoin(code, me)
  }

  const startLocal = () => {
    const me = profile()
    if (!me) return
    try {
      props.onLocal([me, parsePlayerProfile({ name: partnerName, gender: opposite(gender) })])
    } catch (error) {
      toast(error instanceof ConfigError ? `TA 的${error.message}` : "请检查 TA 的昵称", "error")
    }
  }

  return (
    <main className="relative mx-auto flex min-h-dvh w-full max-w-5xl flex-col px-4 pt-[max(env(safe-area-inset-top),1.5rem)] pb-12">
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-0 overflow-hidden">
        {HEARTS.map((heart, i) => (
          <span
            key={i}
            className="animate-float-up absolute -bottom-10 text-2xl"
            style={
              {
                left: heart.left,
                animationDelay: heart.delay,
                "--float-duration": heart.duration,
                "--float-scale": heart.scale,
                "--float-drift": heart.drift,
                "--float-opacity": 0.45,
              } as CSSProperties
            }
          >
            {heart.emoji}
          </span>
        ))}
      </div>

      <header className="relative mt-6 mb-8 text-center sm:mt-12 sm:mb-12">
        <div className="mx-auto mb-4 grid size-16 place-items-center rounded-3xl bg-gradient-to-br from-rose-400 to-fuchsia-500 shadow-2xl shadow-pink-500/40">
          <Heart className="size-8 fill-white text-white" />
        </div>
        <h1 className="text-gradient animate-shimmer text-4xl font-bold tracking-wide sm:text-6xl">情侣飞行棋</h1>
        <p className="mt-3 text-sm text-white/60 sm:text-base">两个人的心动冒险 · 真心话 · 大冒险 · 亲亲抱抱</p>
      </header>

      <div className="relative grid gap-4 lg:grid-cols-[320px_1fr]">
        <section className="glass space-y-4 rounded-3xl p-5">
          <h2 className="font-medium text-white/90">先介绍一下你自己</h2>
          <Input
            value={name}
            maxLength={NAME_MAX_LENGTH}
            placeholder="你的昵称"
            onChange={(event) => setName(event.target.value)}
            aria-label="你的昵称"
          />
          <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="性别">
            {(["female", "male"] as const).map((option) => (
              <button
                key={option}
                type="button"
                role="radio"
                aria-checked={gender === option}
                onClick={() => setGender(option)}
                className={cn(
                  "flex cursor-pointer items-center justify-center gap-2 rounded-2xl border py-3 text-sm transition",
                  gender === option
                    ? "border-transparent bg-gradient-to-br text-white shadow-lg " + PLAYER_STYLES[option].piece
                    : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10",
                )}
              >
                <span className="text-lg">{option === "female" ? "👧" : "👦"}</span>
                我是{PLAYER_STYLES[option].label}
              </button>
            ))}
          </div>

          {(resumeRoom || hasLocalGame) && (
            <div className="space-y-2 border-t border-white/8 pt-4">
              <p className="flex items-center gap-1.5 text-xs text-white/45">
                <History className="size-3.5" />
                继续上次
              </p>
              {resumeRoom && (
                <Button variant="secondary" className="w-full justify-start" onClick={props.onResumeRoom}>
                  <DoorOpen />
                  回到房间 <span className="font-mono tracking-widest">{resumeRoom}</span>
                </Button>
              )}
              {hasLocalGame && (
                <Button variant="secondary" className="w-full justify-start" onClick={props.onResumeLocal}>
                  <Smartphone />
                  继续同屏对局
                </Button>
              )}
            </div>
          )}
        </section>

        <div className="grid gap-4 md:grid-cols-3">
          <ModeCard
            icon={<Sparkles />}
            title="创建房间"
            description="两台手机各玩各的，实时同步，把房间号发给 TA 就行"
            tone="from-rose-500/30 to-fuchsia-500/10"
          >
            <Button className="w-full" disabled={busy} onClick={create}>
              创建房间
            </Button>
          </ModeCard>

          <ModeCard
            icon={<Users />}
            title="加入房间"
            description="输入 TA 分享的 6 位房间号"
            tone="from-violet-500/30 to-sky-500/10"
            highlight={!!inviteRoom}
          >
            <Input
              value={roomCode}
              maxLength={6}
              placeholder="房间号"
              autoCapitalize="characters"
              onChange={(event) => setRoomCode(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
              onKeyDown={(event) => event.key === "Enter" && join()}
              className="text-center font-mono text-lg tracking-[0.4em] uppercase"
              aria-label="房间号"
            />
            <Button variant="secondary" className="w-full" disabled={busy || roomCode.length !== 6} onClick={join}>
              加入
            </Button>
          </ModeCard>

          <ModeCard
            icon={<Smartphone />}
            title="同屏游玩"
            description="一台设备轮流操作，不需要网络也能玩"
            tone="from-amber-400/30 to-pink-500/10"
          >
            <Input
              value={partnerName}
              maxLength={NAME_MAX_LENGTH}
              placeholder={`TA 的昵称（${PLAYER_STYLES[opposite(gender)].label}）`}
              onChange={(event) => setPartnerName(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && startLocal()}
              aria-label="TA 的昵称"
            />
            <Button variant="gold" className="w-full" disabled={busy} onClick={startLocal}>
              开始
            </Button>
          </ModeCard>
        </div>
      </div>

      <footer className="relative mt-10 text-center text-xs text-white/35">
        所有任务、棋盘和场景卡都可以在游戏里「自定义」 · 请在双方都舒适的前提下游玩 💕
      </footer>
    </main>
  )
}

interface ModeCardProps {
  icon: ReactNode
  title: string
  description: string
  tone: string
  highlight?: boolean
  children: ReactNode
}

function ModeCard({ icon, title, description, tone, highlight, children }: ModeCardProps) {
  return (
    <section
      className={cn(
        "glass relative flex flex-col overflow-hidden rounded-3xl p-5",
        highlight && "ring-2 ring-pink-400/60",
      )}
    >
      <div className={cn("pointer-events-none absolute inset-0 bg-gradient-to-br opacity-80", tone)} />
      <div className="relative flex flex-1 flex-col">
        <div className="mb-3 grid size-10 place-items-center rounded-2xl bg-white/12 text-white [&_svg]:size-5">{icon}</div>
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        <p className="mt-1 mb-4 flex-1 text-sm leading-relaxed text-white/60">{description}</p>
        <div className="space-y-2">{children}</div>
      </div>
    </section>
  )
}
