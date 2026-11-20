import { ScrollText } from "lucide-react"
import type { LogEntry } from "@/lib/game/types"

const VISIBLE = 6

export function EventLog({ log }: { log: LogEntry[] }) {
  const recent = log.slice(-VISIBLE).reverse()
  return (
    <div className="glass rounded-2xl p-4">
      <div className="mb-2 flex items-center gap-1.5 text-sm font-medium text-white/70">
        <ScrollText className="size-4" />
        动态
      </div>
      <ol className="space-y-1.5 text-sm">
        {recent.map((entry, index) => (
          <li key={entry.id} className={index === 0 ? "text-white" : "text-white/45"}>
            {entry.text}
          </li>
        ))}
      </ol>
    </div>
  )
}
