"use client"

import { useState, useEffect, useCallback, useRef, useImperativeHandle, forwardRef } from "react"
import { Button } from "@/components/ui/button"
import { Play, Pause, RotateCcw, Timer, Volume2, VolumeX } from "lucide-react"

export interface TimerState {
  duration: number
  timeLeft: number
  isRunning: boolean
  startedAt?: number
  pausedAt?: number
}

interface GameTimerProps {
  onTimeUp?: () => void
  syncState?: TimerState
  onStateChange?: (state: TimerState) => void
  isRemoteUpdate?: boolean
}

export interface GameTimerRef {
  getState: () => TimerState
  setState: (state: TimerState) => void
}

export const GameTimer = forwardRef<GameTimerRef, GameTimerProps>(
  ({ onTimeUp, syncState, onStateChange, isRemoteUpdate }, ref) => {
    const [duration, setDuration] = useState(60)
    const [timeLeft, setTimeLeft] = useState(60)
    const [isRunning, setIsRunning] = useState(false)
    const [customInput, setCustomInput] = useState("")
    const [soundEnabled, setSoundEnabled] = useState(true)
    const audioContextRef = useRef<AudioContext | null>(null)
    const startedAtRef = useRef<number | undefined>(undefined)
    const lastSyncRef = useRef<number>(0)

    const presets = [
      { label: "30秒", value: 30 },
      { label: "1分钟", value: 60 },
      { label: "2分钟", value: 120 },
      { label: "10分钟", value: 600 },
    ]

    useImperativeHandle(ref, () => ({
      getState: () => ({
        duration,
        timeLeft,
        isRunning,
        startedAt: startedAtRef.current,
      }),
      setState: (state: TimerState) => {
        setDuration(state.duration)
        setTimeLeft(state.timeLeft)
        setIsRunning(state.isRunning)
        startedAtRef.current = state.startedAt
      },
    }))

    useEffect(() => {
      if (syncState && syncState.duration !== undefined) {
        const now = Date.now()

        // 只在有明显变化时才更新
        if (now - lastSyncRef.current > 200) {
          setDuration(syncState.duration)

          if (syncState.isRunning && syncState.startedAt) {
            // 根据启动时间计算当前剩余时间
            const elapsed = Math.floor((now - syncState.startedAt) / 1000)
            const calculatedTimeLeft = Math.max(0, syncState.duration - elapsed)
            setTimeLeft(calculatedTimeLeft)
            startedAtRef.current = syncState.startedAt
          } else {
            setTimeLeft(syncState.timeLeft)
            startedAtRef.current = undefined
          }

          setIsRunning(syncState.isRunning)
          lastSyncRef.current = now
        }
      }
    }, [syncState])

    const playBeep = useCallback(
      (frequency = 800, dur = 200, volume = 0.5) => {
        if (!soundEnabled) return

        try {
          if (!audioContextRef.current) {
            audioContextRef.current = new (
              window.AudioContext ||
              (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
            )()
          }

          const ctx = audioContextRef.current
          const oscillator = ctx.createOscillator()
          const gainNode = ctx.createGain()

          oscillator.connect(gainNode)
          gainNode.connect(ctx.destination)

          oscillator.frequency.value = frequency
          oscillator.type = "sine"
          gainNode.gain.value = volume

          oscillator.start()
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + dur / 1000)
          oscillator.stop(ctx.currentTime + dur / 1000)
        } catch (error) {
          console.error("播放声音失败:", error)
        }
      },
      [soundEnabled],
    )

    const playTimeUpSound = useCallback(() => {
      if (!soundEnabled) return
      playBeep(1000, 150, 0.6)
      setTimeout(() => playBeep(1200, 150, 0.6), 200)
      setTimeout(() => playBeep(1400, 300, 0.7), 400)
    }, [soundEnabled, playBeep])

    useEffect(() => {
      let interval: NodeJS.Timeout | null = null

      if (isRunning && timeLeft > 0) {
        interval = setInterval(() => {
          setTimeLeft((prev) => {
            const newTime = prev - 1
            if (newTime <= 0) {
              setIsRunning(false)
              startedAtRef.current = undefined
              playTimeUpSound()
              onTimeUp?.()
              onStateChange?.({ duration, timeLeft: 0, isRunning: false })
              return 0
            }
            if (newTime <= 5 && newTime > 0) {
              playBeep(600 + (5 - newTime) * 100, 100, 0.3)
            }
            return newTime
          })
        }, 1000)
      }

      return () => {
        if (interval) clearInterval(interval)
      }
    }, [isRunning, timeLeft, duration, onTimeUp, playBeep, playTimeUpSound, onStateChange])

    const handlePresetClick = useCallback(
      (value: number) => {
        setDuration(value)
        setTimeLeft(value)
        setIsRunning(false)
        startedAtRef.current = undefined
        onStateChange?.({ duration: value, timeLeft: value, isRunning: false })
      },
      [onStateChange],
    )

    const handleCustomTime = useCallback(() => {
      const value = Number.parseInt(customInput)
      if (value > 0 && value <= 3600) {
        setDuration(value)
        setTimeLeft(value)
        setIsRunning(false)
        setCustomInput("")
        startedAtRef.current = undefined
        onStateChange?.({ duration: value, timeLeft: value, isRunning: false })
      }
    }, [customInput, onStateChange])

    const handleReset = useCallback(() => {
      setTimeLeft(duration)
      setIsRunning(false)
      startedAtRef.current = undefined
      onStateChange?.({ duration, timeLeft: duration, isRunning: false })
    }, [duration, onStateChange])

    const handleToggle = useCallback(() => {
      const newRunning = !isRunning
      const now = Date.now()

      if (newRunning) {
        // 开始计时，记录启动时间
        startedAtRef.current = now - (duration - timeLeft) * 1000
        setIsRunning(true)
        onStateChange?.({
          duration,
          timeLeft,
          isRunning: true,
          startedAt: startedAtRef.current,
        })
      } else {
        // 暂停计时
        startedAtRef.current = undefined
        setIsRunning(false)
        onStateChange?.({
          duration,
          timeLeft,
          isRunning: false,
        })
      }
    }, [isRunning, duration, timeLeft, onStateChange])

    const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60)
      const secs = seconds % 60
      return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
    }

    const progress = (timeLeft / duration) * 100
    const isLowTime = timeLeft <= 10 && timeLeft > 0

    return (
      <div className="bg-white/90 rounded-xl p-3 md:p-4 shadow-lg">
        <div className="flex items-center justify-between mb-2 md:mb-3">
          <div className="flex items-center gap-2">
            <Timer className="w-4 h-4 text-rose-500" />
            <h3 className="font-bold text-rose-600 text-sm">计时器</h3>
          </div>
          <Button size="sm" variant="ghost" onClick={() => setSoundEnabled(!soundEnabled)} className="h-7 w-7 p-0">
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-rose-500" />
            ) : (
              <VolumeX className="w-4 h-4 text-gray-400" />
            )}
          </Button>
        </div>

        <div className="relative mb-2 md:mb-3">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-1000 ${isLowTime ? "bg-red-500 animate-pulse" : "bg-rose-400"}`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <div
            className={`text-center text-2xl md:text-3xl font-mono font-bold mt-2 ${
              isLowTime ? "text-red-500 animate-pulse" : "text-gray-800"
            }`}
          >
            {formatTime(timeLeft)}
          </div>
        </div>

        <div className="flex justify-center gap-2 mb-2 md:mb-3">
          <Button
            size="sm"
            variant={isRunning ? "destructive" : "default"}
            onClick={handleToggle}
            className={`text-xs md:text-sm ${isRunning ? "" : "bg-rose-500 hover:bg-rose-600"}`}
          >
            {isRunning ? (
              <Pause className="w-3 h-3 md:w-4 md:h-4 mr-1" />
            ) : (
              <Play className="w-3 h-3 md:w-4 md:h-4 mr-1" />
            )}
            {isRunning ? "暂停" : "开始"}
          </Button>
          <Button size="sm" variant="outline" onClick={handleReset} className="text-xs md:text-sm bg-transparent">
            <RotateCcw className="w-3 h-3 md:w-4 md:h-4 mr-1" />
            重置
          </Button>
        </div>

        <div className="grid grid-cols-4 md:grid-cols-4 gap-1 mb-2">
          {presets.map((preset) => (
            <Button
              key={preset.value}
              size="sm"
              variant={duration === preset.value ? "default" : "outline"}
              onClick={() => handlePresetClick(preset.value)}
              className={`text-[10px] md:text-xs px-1 py-1 h-7 ${duration === preset.value ? "bg-rose-500 hover:bg-rose-600" : ""}`}
            >
              {preset.label}
            </Button>
          ))}
        </div>

        <div className="flex gap-1">
          <input
            type="number"
            placeholder="自定义秒数"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCustomTime()}
            className="flex-1 text-xs px-2 py-1 border rounded-md focus:outline-none focus:ring-1 focus:ring-rose-400"
            min={1}
            max={3600}
          />
          <Button size="sm" variant="outline" onClick={handleCustomTime} className="text-xs px-2 bg-transparent">
            设定
          </Button>
        </div>
      </div>
    )
  },
)

GameTimer.displayName = "GameTimer"
