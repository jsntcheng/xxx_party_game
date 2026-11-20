"use client"

import { AnimatePresence, motion } from "framer-motion"
import { CircleAlert, CircleCheck, Info } from "lucide-react"
import { useSyncExternalStore } from "react"
import { cn } from "@/lib/utils"

type Tone = "info" | "success" | "error"

interface ToastItem {
  id: number
  message: string
  tone: Tone
}

const DURATION_MS = 2800
let items: ToastItem[] = []
let nextId = 1
const listeners = new Set<() => void>()

function emit() {
  for (const listener of listeners) listener()
}

/** 轻量提示：任意位置调用，由 <Toaster /> 渲染。 */
export function toast(message: string, tone: Tone = "info") {
  const id = nextId++
  items = [...items.filter((item) => item.message !== message), { id, message, tone }].slice(-3)
  emit()
  setTimeout(() => {
    items = items.filter((item) => item.id !== id)
    emit()
  }, DURATION_MS)
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

const EMPTY: ToastItem[] = []
const ICONS = { info: Info, success: CircleCheck, error: CircleAlert }

export function Toaster() {
  const list = useSyncExternalStore(
    subscribe,
    () => items,
    () => EMPTY,
  )
  return (
    <div className="pointer-events-none fixed inset-x-0 top-[max(1rem,env(safe-area-inset-top))] z-[100] flex flex-col items-center gap-2 px-4">
      <AnimatePresence>
        {list.map((item) => {
          const Icon = ICONS[item.tone]
          return (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, y: -12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              role="status"
              className={cn(
                "glass-strong flex max-w-sm items-center gap-2 rounded-2xl px-4 py-2.5 text-sm shadow-xl shadow-black/30",
                item.tone === "error" && "border-rose-400/30 text-rose-100",
                item.tone === "success" && "border-emerald-400/30 text-emerald-100",
              )}
            >
              <Icon className="size-4 shrink-0" />
              {item.message}
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
