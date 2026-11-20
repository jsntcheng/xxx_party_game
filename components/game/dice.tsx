"use client"

import { useRef, useState } from "react"
import { cn } from "@/lib/utils"

/** 让某一面朝向观察者需要的旋转角度。 */
const FACE_ROTATION: Record<number, { x: number; y: number }> = {
  1: { x: 0, y: 0 },
  6: { x: 0, y: 180 },
  3: { x: 0, y: -90 },
  4: { x: 0, y: 90 },
  5: { x: -90, y: 0 },
  2: { x: 90, y: 0 },
}

/** 每个面在立方体上的位置。 */
const FACE_PLACEMENT: Record<number, string> = {
  1: "rotateY(0deg)",
  6: "rotateY(180deg)",
  3: "rotateY(90deg)",
  4: "rotateY(-90deg)",
  5: "rotateX(90deg)",
  2: "rotateX(-90deg)",
}

/** 3×3 网格里点数的位置（1~9，行优先）。 */
const PIPS: Record<number, number[]> = {
  1: [5],
  2: [1, 9],
  3: [1, 5, 9],
  4: [1, 3, 7, 9],
  5: [1, 3, 5, 7, 9],
  6: [1, 3, 4, 6, 7, 9],
}

interface DiceProps {
  /** 当前朝上的点数（上一次掷出的值）。 */
  value: number
  /** 每次掷骰的唯一编号，变化时转动。 */
  rollKey: number | null
  size: number
  /** 不可掷时禁用；可掷时骰子跳动提示。 */
  disabled: boolean
  /** 有请求在途（联机等服务端返回）。 */
  busy: boolean
  onRoll: () => void
}

/**
 * 3D 骰子。
 *
 * 结构：button（缩放反馈）→ .dice-scene（透视 + 跳动/摇晃动画）→ .dice-cube（只做旋转）。
 * 动画和旋转必须放在不同元素上：CSS animation 的 transform 会整体覆盖内联 transform，
 * 放在一起会导致等待时永远显示 1 点、掷出时不转直接跳到结果。
 */
export function Dice({ value, rollKey, size, disabled, busy, onRoll }: DiceProps) {
  const spins = useRef({ key: rollKey, count: 0 })
  const rolled = spins.current.key !== rollKey
  if (rolled) spins.current = { key: rollKey, count: spins.current.count + 1 }

  // 联机时点击后要等服务端返回结果：期间摇晃；结果到达或请求结束（含失败）时停止
  const [requested, setRequested] = useState(false)
  if (requested && (rolled || !busy)) setRequested(false)

  const face = FACE_ROTATION[value] ?? FACE_ROTATION[1]
  const turns = spins.current.count * 720
  const half = size / 2

  const roll = () => {
    setRequested(true)
    onRoll()
  }

  return (
    <button
      type="button"
      onClick={roll}
      disabled={disabled}
      aria-label={disabled ? `骰子：${value} 点` : "掷骰子"}
      className={cn(
        "group relative cursor-pointer rounded-[22%] outline-none focus-visible:ring-4 focus-visible:ring-pink-300/50 disabled:cursor-default",
        !disabled && "transition-transform hover:scale-105 active:scale-95",
      )}
      style={{ width: size, height: size }}
    >
      {!disabled && (
        <span className="absolute -inset-3 -z-10 animate-pulse rounded-full bg-pink-500/30 blur-xl" aria-hidden />
      )}
      <div
        className={cn(
          "dice-scene",
          !disabled && "motion-safe:animate-bounce",
          requested && "motion-safe:animate-dice-shake",
        )}
      >
        <div
          className="dice-cube"
          style={{ transform: `rotateX(${face.x - 18 + turns}deg) rotateY(${face.y + 24 + turns}deg)` }}
        >
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="dice-face" style={{ transform: `${FACE_PLACEMENT[n]} translateZ(${half}px)` }}>
              {PIPS[n].map((slot) => (
                <span
                  key={slot}
                  className="dice-pip"
                  style={{ gridRow: Math.ceil(slot / 3), gridColumn: ((slot - 1) % 3) + 1 }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </button>
  )
}
