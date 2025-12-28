"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import type { SceneCard } from "@/lib/game-data"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface SceneCardDrawProps {
  isOpen: boolean
  onClose: () => void
  poolNames: string[]
  drawnCards: SceneCard[]
}

export function SceneCardDraw({ isOpen, onClose, poolNames, drawnCards }: SceneCardDrawProps) {
  const [phase, setPhase] = useState<"shuffling" | "drawing" | "showing" | "done">("shuffling")
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const [showAllCards, setShowAllCards] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      setPhase("shuffling")
      setCurrentCardIndex(0)
      setShowAllCards(false)
      return
    }

    // 洗牌动画
    const shuffleTimer = setTimeout(() => {
      setPhase("drawing")
    }, 1500)

    return () => clearTimeout(shuffleTimer)
  }, [isOpen])

  useEffect(() => {
    if (phase === "drawing" && currentCardIndex < drawnCards.length) {
      const drawTimer = setTimeout(() => {
        if (currentCardIndex < drawnCards.length - 1) {
          setCurrentCardIndex((prev) => prev + 1)
        } else {
          setPhase("showing")
          setTimeout(() => setShowAllCards(true), 500)
        }
      }, 1200)
      return () => clearTimeout(drawTimer)
    }
  }, [phase, currentCardIndex, drawnCards.length])

  if (!isOpen || drawnCards.length === 0) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="relative w-full max-w-2xl">
        {/* 关闭按钮 */}
        {phase === "showing" && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute -top-12 right-0 text-white hover:bg-white/20"
          >
            <X className="w-6 h-6" />
          </Button>
        )}

        <div className="text-center mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
            {phase === "shuffling" && "正在洗牌..."}
            {phase === "drawing" && `抽取第 ${currentCardIndex + 1} 张场景卡`}
            {phase === "showing" && "本局场景卡"}
          </h2>
          <p className="text-white/70 text-sm">
            {phase === "drawing" && poolNames[currentCardIndex] && `从「${poolNames[currentCardIndex]}」卡池中抽取`}
            {phase === "showing" && "以下场景将在本局游戏中生效"}
          </p>
        </div>

        {/* 洗牌动画 */}
        <AnimatePresence mode="wait">
          {phase === "shuffling" && (
            <motion.div
              className="flex justify-center gap-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {[0, 1, 2, 3, 4].map((i) => (
                <motion.div
                  key={i}
                  className="w-16 h-24 md:w-20 md:h-28 bg-gradient-to-br from-rose-400 to-pink-500 rounded-lg shadow-lg"
                  animate={{
                    y: [0, -20, 0],
                    rotate: [0, 5, -5, 0],
                    x: [0, (i - 2) * 10, 0],
                  }}
                  transition={{
                    duration: 0.5,
                    repeat: Number.POSITIVE_INFINITY,
                    repeatType: "reverse",
                    delay: i * 0.1,
                  }}
                />
              ))}
            </motion.div>
          )}

          {/* 抽卡动画 */}
          {phase === "drawing" && (
            <motion.div
              key={currentCardIndex}
              className="flex justify-center"
              initial={{ scale: 0, rotateY: 180 }}
              animate={{ scale: 1, rotateY: 0 }}
              transition={{ duration: 0.6, type: "spring" }}
            >
              <div className="w-48 h-64 md:w-56 md:h-72 bg-gradient-to-br from-amber-100 to-rose-100 rounded-xl shadow-2xl p-4 flex flex-col items-center justify-center border-4 border-rose-300 relative">
                <div className="absolute top-2 left-2 bg-rose-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {drawnCards[currentCardIndex]?.pool || `#${currentCardIndex + 1}`}
                </div>
                <span className="text-4xl md:text-5xl mb-3">{drawnCards[currentCardIndex]?.icon || "🎴"}</span>
                <h3 className="text-lg md:text-xl font-bold text-rose-600 mb-2">
                  {drawnCards[currentCardIndex]?.title}
                </h3>
                <p className="text-xs md:text-sm text-gray-600 text-center">
                  {drawnCards[currentCardIndex]?.description}
                </p>
              </div>
            </motion.div>
          )}

          {/* 展示所有卡片 */}
          {phase === "showing" && (
            <motion.div
              className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {drawnCards.map((card, index) => (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, y: 50, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: index * 0.2, type: "spring" }}
                  className="bg-gradient-to-br from-amber-100 to-rose-100 rounded-xl shadow-xl p-4 border-2 border-rose-300 relative"
                >
                  <div className="absolute top-2 right-2 bg-rose-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {card.pool || `#${index + 1}`}
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{card.icon || "🎴"}</span>
                    <h3 className="font-bold text-rose-600">{card.title}</h3>
                  </div>
                  <p className="text-xs md:text-sm text-gray-600">{card.description}</p>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* 确认按钮 */}
        {phase === "showing" && showAllCards && (
          <motion.div
            className="mt-6 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <Button onClick={onClose} className="bg-rose-500 hover:bg-rose-600 text-white px-8 py-2">
              开始游戏
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  )
}
