/** 庆祝特效（canvas-confetti），自动遵守「减少动态效果」系统设置。 */
import confetti from "canvas-confetti"

const COLORS = ["#f472b6", "#fb7185", "#c084fc", "#fbbf24", "#fdba74", "#ffffff"]

export function celebrate() {
  const end = Date.now() + 2200
  const frame = () => {
    confetti({ particleCount: 4, angle: 60, spread: 70, origin: { x: 0, y: 0.7 }, colors: COLORS, disableForReducedMotion: true })
    confetti({ particleCount: 4, angle: 120, spread: 70, origin: { x: 1, y: 0.7 }, colors: COLORS, disableForReducedMotion: true })
    if (Date.now() < end) requestAnimationFrame(frame)
  }
  frame()
}

let heartShape: confetti.Shape | null = null

export function floatHearts() {
  heartShape ??= confetti.shapeFromText({ text: "💗", scalar: 2 })
  confetti({
    shapes: [heartShape],
    scalar: 2,
    particleCount: 18,
    spread: 90,
    startVelocity: 28,
    gravity: 0.6,
    origin: { y: 0.6 },
    disableForReducedMotion: true,
  })
}
