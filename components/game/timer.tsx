"use client"

import { Pause, Play, RotateCcw, Volume2, VolumeX } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { storage } from "@/lib/client/storage"
import { TIMER_MAX_SECONDS, timerRemaining } from "@/lib/game/engine"
import type { GameAction, TimerState } from "@/lib/game/types"
import { cn } from "@/lib/utils"

const PRESETS = [
  { label: "30秒", seconds: 30 },
  { label: "1分", seconds: 60 },
  { label: "2分", seconds: 120 },
  { label: "10分", seconds: 600 },
]
const WARNING_SECONDS = 5

interface TimerProps {
  timer: TimerState
  now: () => number
  disabled: boolean
  /** 同一时刻界面上有多个计时器时，只让一个发声。 */
  silent?: boolean
  onAction: (action: GameAction) => void
}

interface CustomSecondsProps {
  disabled: boolean
  /** 当前时长不是预设值时高亮。 */
  active: boolean
  duration: number
  onSubmit: (seconds: number) => void
}

/** 自定义秒数：回车或失焦提交，非法输入恢复原值。 */
function CustomSeconds({ disabled, active, duration, onSubmit }: CustomSecondsProps) {
  const commit = (input: HTMLInputElement) => {
    const seconds = Number(input.value)
    if (!input.value || seconds === duration) return
    if (Number.isInteger(seconds) && seconds >= 1 && seconds <= TIMER_MAX_SECONDS) onSubmit(seconds)
    else input.value = active ? String(duration) : ""
  }
  return (
    <label
      className={cn(
        "flex items-center gap-0.5 rounded-lg px-2 py-1 text-xs text-white/60 focus-within:bg-white/10",
        active && "bg-white/12 text-white",
      )}
    >
      <input
        key={duration}
        type="number"
        inputMode="numeric"
        min={1}
        max={TIMER_MAX_SECONDS}
        disabled={disabled}
        defaultValue={active ? duration : ""}
        placeholder="自定"
        aria-label="自定义秒数"
        onBlur={(event) => commit(event.currentTarget)}
        onKeyDown={(event) => event.key === "Enter" && event.currentTarget.blur()}
        className="w-9 bg-transparent text-center outline-none placeholder:text-white/40 disabled:opacity-40 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
      />
      秒
    </label>
  )
}

/** 共享倒计时：状态在服务器，剩余时间由各端按校准后的时钟本地计算。 */
export function Timer({ timer, now, disabled, silent = false, onAction }: TimerProps) {
  const [remaining, setRemaining] = useState(() => timerRemaining(timer, now()))
  const [sound, setSound] = useState(true)
  const beeper = useBeeper(sound && !silent)
  const running = timer.endsAt !== null && remaining > 0
  const finished = timer.endsAt !== null && remaining === 0

  useEffect(() => setSound(storage.getSoundEnabled()), [])

  useEffect(() => {
    const update = () => setRemaining(timerRemaining(timer, now()))
    update()
    if (timer.endsAt === null) return
    const interval = setInterval(update, 250)
    return () => clearInterval(interval)
  }, [timer, now])

  // 只在运行中、秒数变化时发声
  const lastBeep = useRef(remaining)
  useEffect(() => {
    if (timer.endsAt === null || lastBeep.current === remaining) return
    lastBeep.current = remaining
    if (remaining === 0) beeper.finish()
    else if (remaining <= WARNING_SECONDS) beeper.tick(remaining)
  }, [remaining, timer.endsAt, beeper])

  const progress = timer.duration ? remaining / timer.duration : 0
  const minutes = Math.floor(remaining / 60)
  const seconds = remaining % 60

  return (
    <div className="glass rounded-2xl p-4">
      <div className="flex items-center gap-4">
        <div className="relative size-20 shrink-0">
          <svg viewBox="0 0 40 40" className="size-full -rotate-90">
            <circle cx="20" cy="20" r="17" fill="none" stroke="rgb(255 255 255 / 0.1)" strokeWidth="3" />
            <circle
              cx="20"
              cy="20"
              r="17"
              fill="none"
              stroke={remaining <= WARNING_SECONDS && running ? "#fb7185" : "url(#timer-gradient)"}
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={`${progress * 106.8} 106.8`}
              className="transition-[stroke-dasharray] duration-300"
            />
            <defs>
              <linearGradient id="timer-gradient">
                <stop offset="0" stopColor="#f472b6" />
                <stop offset="1" stopColor="#c084fc" />
              </linearGradient>
            </defs>
          </svg>
          <div
            className={cn(
              "absolute inset-0 flex items-center justify-center text-lg font-semibold tabular-nums",
              finished && "animate-pulse text-rose-300",
            )}
          >
            {finished ? "时间到" : `${minutes}:${String(seconds).padStart(2, "0")}`}
          </div>
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              disabled={disabled}
              onClick={() => {
                beeper.unlock()
                onAction({ type: "timer", op: running ? "pause" : "start" })
              }}
            >
              {running ? <Pause /> : <Play />}
              {running ? "暂停" : "开始"}
            </Button>
            <Button size="icon-sm" variant="secondary" disabled={disabled} onClick={() => onAction({ type: "timer", op: "reset" })} aria-label="重置计时">
              <RotateCcw />
            </Button>
            <Button
              size="icon-sm"
              variant="ghost"
              className="ml-auto"
              onClick={() => {
                storage.setSoundEnabled(!sound)
                setSound(!sound)
              }}
              aria-label={sound ? "关闭提示音" : "打开提示音"}
            >
              {sound ? <Volume2 /> : <VolumeX />}
            </Button>
          </div>
          <div className="flex flex-wrap gap-1">
            {PRESETS.map((preset) => (
              <button
                key={preset.seconds}
                type="button"
                disabled={disabled}
                onClick={() => onAction({ type: "timerDuration", seconds: preset.seconds })}
                className={cn(
                  "cursor-pointer rounded-lg px-2 py-1 text-xs text-white/60 transition hover:bg-white/10 hover:text-white disabled:opacity-40",
                  timer.duration === preset.seconds && "bg-white/12 text-white",
                )}
              >
                {preset.label}
              </button>
            ))}
            <CustomSeconds
              disabled={disabled}
              active={!PRESETS.some((preset) => preset.seconds === timer.duration)}
              duration={timer.duration}
              onSubmit={(seconds) => onAction({ type: "timerDuration", seconds })}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

/** WebAudio 提示音；浏览器要求用户交互后才能出声，unlock 在点击时调用。 */
function useBeeper(enabled: boolean) {
  const enabledRef = useRef(enabled)
  useEffect(() => {
    enabledRef.current = enabled
  }, [enabled])
  const [beeper] = useState(() => createBeeper(() => enabledRef.current))
  return beeper
}

function createBeeper(isEnabled: () => boolean) {
  let context: AudioContext | null = null
  const ensure = () => {
    context ??= new AudioContext()
    if (context.state === "suspended") void context.resume().catch(() => undefined)
    return context
  }
  const beep = (frequency: number, durationMs: number, volume: number, delayMs = 0) => {
    const audio = ensure()
    const start = audio.currentTime + delayMs / 1000
    const oscillator = audio.createOscillator()
    const gain = audio.createGain()
    oscillator.frequency.value = frequency
    gain.gain.setValueAtTime(volume, start)
    gain.gain.exponentialRampToValueAtTime(0.001, start + durationMs / 1000)
    oscillator.connect(gain).connect(audio.destination)
    oscillator.start(start)
    oscillator.stop(start + durationMs / 1000)
  }
  return {
    unlock: () => void ensure(),
    tick: (left: number) => {
      if (isEnabled()) beep(600 + (WARNING_SECONDS - left) * 100, 100, 0.25)
    },
    finish: () => {
      if (!isEnabled()) return
      beep(1000, 150, 0.45)
      beep(1200, 150, 0.5, 200)
      beep(1400, 320, 0.55, 400)
    },
  }
}
