"use client"

import type { SceneCard } from "@/lib/game-data"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"

interface SceneCardViewerProps {
  isOpen: boolean
  onClose: () => void
  cards: SceneCard[]
}

export function SceneCardViewer({ isOpen, onClose, cards }: SceneCardViewerProps) {
  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-hidden"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-rose-100 to-amber-100">
            <h2 className="text-lg font-bold text-rose-600 flex items-center gap-2">🎴 本局场景卡</h2>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Cards */}
          <div className="p-4 space-y-3 overflow-y-auto max-h-[60vh]">
            {cards.length === 0 ? (
              <p className="text-center text-gray-500 py-8">本局没有场景卡</p>
            ) : (
              cards.map((card, index) => (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start gap-3 p-3 bg-gradient-to-r from-rose-50 to-amber-50 rounded-lg border border-rose-200 relative"
                >
                  <div className="absolute top-2 right-2 bg-rose-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {card.pool || `#${index + 1}`}
                  </div>
                  <span className="text-2xl flex-shrink-0">{card.icon || "🎴"}</span>
                  <div className="pr-8">
                    <h3 className="font-semibold text-rose-600">{card.title}</h3>
                    <p className="text-sm text-gray-600">{card.description}</p>
                  </div>
                </motion.div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t bg-gray-50">
            <Button onClick={onClose} className="w-full bg-rose-500 hover:bg-rose-600 text-white">
              关闭
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
