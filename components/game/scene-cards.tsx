"use client"

import { motion } from "framer-motion"
import { Modal } from "@/components/ui/modal"
import type { SceneCard } from "@/lib/game/types"

interface SceneCardsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  cards: SceneCard[]
}

/** 本局场景卡：开局自动展示，之后可随时查看。 */
export function SceneCardsDialog({ open, onOpenChange, cards }: SceneCardsDialogProps) {
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="🎴 本局场景卡"
      description={cards.length ? "整局游戏都要遵守这些规则哦" : "本局没有场景卡"}
      className="max-w-2xl"
    >
      <div className="grid gap-3 sm:grid-cols-3">
        {cards.map((card, index) => (
          <motion.div
            key={card.id}
            initial={{ rotateY: 90, opacity: 0, y: 12 }}
            animate={{ rotateY: 0, opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + index * 0.25, type: "spring", stiffness: 160, damping: 18 }}
            className="relative overflow-hidden rounded-2xl border border-white/15 bg-gradient-to-br from-fuchsia-500/25 via-pink-500/15 to-amber-400/20 p-4 text-center shadow-lg"
            style={{ transformPerspective: 800 }}
          >
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent" />
            <div className="text-[11px] tracking-widest text-white/50">{card.pool}</div>
            <div className="my-2 text-4xl">{card.icon || "🎴"}</div>
            <div className="font-semibold text-white">{card.title}</div>
            <p className="mt-1.5 text-sm leading-relaxed text-white/70">{card.description}</p>
          </motion.div>
        ))}
      </div>
    </Modal>
  )
}
