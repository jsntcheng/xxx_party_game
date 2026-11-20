import type { ComponentProps } from "react"
import { cn } from "@/lib/utils"

const fieldClass =
  "w-full min-w-0 rounded-xl border border-white/12 bg-white/6 px-3 text-base text-white placeholder:text-white/35 outline-none transition focus:border-pink-300/60 focus:bg-white/10 focus:ring-2 focus:ring-pink-400/25 disabled:opacity-50 md:text-sm"

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input data-slot="input" className={cn(fieldClass, "h-10", className)} {...props} />
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea data-slot="textarea" className={cn(fieldClass, "min-h-20 py-2 leading-relaxed", className)} {...props} />
}

export function Select({ className, ...props }: ComponentProps<"select">) {
  return (
    <select
      data-slot="select"
      className={cn(fieldClass, "h-10 cursor-pointer appearance-auto pr-2 [&>option]:bg-night-soft", className)}
      {...props}
    />
  )
}
