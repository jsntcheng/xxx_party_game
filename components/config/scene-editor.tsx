"use client"

import { ChevronDown, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input, Textarea } from "@/components/ui/input"
import type { GameConfig, SceneCard } from "@/lib/game/types"
import { nextId } from "./utils"

type SceneFields = Pick<GameConfig, "sceneCardPoolNames" | "sceneCards" | "sceneCardCount">

interface SceneEditorProps {
  value: SceneFields
  onChange: (patch: Partial<SceneFields>) => void
}

/** 场景卡：卡池（顺序决定开局抽哪些）+ 每个卡池里的卡片。 */
export function SceneEditor({ value, onChange }: SceneEditorProps) {
  const { sceneCardPoolNames: pools, sceneCards: cards, sceneCardCount } = value

  const renamePool = (index: number, name: string) => {
    const old = pools[index]
    onChange({
      sceneCardPoolNames: pools.map((pool, i) => (i === index ? name : pool)),
      sceneCards: cards.map((card) => (card.pool === old ? { ...card, pool: name } : card)),
    })
  }

  const removePool = (index: number) => {
    const name = pools[index]
    const nextPools = pools.filter((_, i) => i !== index)
    onChange({
      sceneCardPoolNames: nextPools,
      sceneCards: cards.filter((card) => card.pool !== name),
      sceneCardCount: Math.min(sceneCardCount, nextPools.length),
    })
  }

  const addPool = () => {
    let n = pools.length + 1
    while (pools.includes(`卡池${n}`)) n++
    onChange({ sceneCardPoolNames: [...pools, `卡池${n}`] })
  }

  const updateCard = (id: number, patch: Partial<SceneCard>) =>
    onChange({ sceneCards: cards.map((card) => (card.id === id ? { ...card, ...patch } : card)) })

  const addCard = (pool: string) =>
    onChange({ sceneCards: [...cards, { id: nextId(cards), title: "", description: "", icon: "🎴", pool }] })

  return (
    <div className="space-y-5">
      <section className="flex flex-wrap items-center gap-3 rounded-2xl bg-white/5 p-3 ring-1 ring-white/8">
        <label className="flex items-center gap-2 text-sm text-white/75">
          开局抽取
          <Input
            type="number"
            min={0}
            max={pools.length}
            value={sceneCardCount}
            onChange={(event) =>
              onChange({ sceneCardCount: Math.min(pools.length, Math.max(0, Math.round(Number(event.target.value)) || 0)) })
            }
            className="h-9 w-16 text-center"
          />
          张
        </label>
        <p className="text-xs text-white/45">从前 {sceneCardCount} 个卡池里各随机抽一张，整局生效；设为 0 不抽卡</p>
      </section>

      {pools.map((pool, index) => {
        const poolCards = cards.filter((card) => card.pool === pool)
        return (
          <details key={index} open={index === 0} className="group rounded-2xl bg-white/5 ring-1 ring-white/8">
            <summary className="flex cursor-pointer list-none items-center gap-2 p-3 select-none">
              <ChevronDown className="size-4 text-white/50 transition group-open:rotate-180" />
              <span className="flex-1 font-medium text-white/85">
                {pool || "（未命名）"}
                <span className="ml-2 text-xs font-normal text-white/40">
                  {poolCards.length} 张{index < sceneCardCount && " · 会被抽取"}
                </span>
              </span>
            </summary>
            <div className="space-y-2 border-t border-white/8 p-3">
              <div className="flex gap-2">
                <Input value={pool} maxLength={20} onChange={(event) => renamePool(index, event.target.value)} aria-label="卡池名称" />
                <Button size="sm" className="h-10" onClick={() => addCard(pool)}>
                  <Plus />
                  加卡
                </Button>
                <Button variant="danger" size="sm" className="h-10" onClick={() => removePool(index)}>
                  <Trash2 />
                  删池
                </Button>
              </div>
              {poolCards.map((card) => (
                <div key={card.id} className="flex gap-2 rounded-xl bg-black/15 p-2">
                  <Input
                    value={card.icon ?? ""}
                    maxLength={8}
                    onChange={(event) => updateCard(card.id, { icon: event.target.value })}
                    className="w-12 px-0 text-center text-xl"
                    aria-label="图标"
                  />
                  <div className="min-w-0 flex-1 space-y-2">
                    <Input
                      value={card.title}
                      maxLength={30}
                      placeholder="卡片标题"
                      onChange={(event) => updateCard(card.id, { title: event.target.value })}
                    />
                    <Textarea
                      value={card.description}
                      maxLength={200}
                      rows={2}
                      placeholder="规则描述"
                      className="min-h-14"
                      onChange={(event) => updateCard(card.id, { description: event.target.value })}
                    />
                  </div>
                  <Button
                    variant="danger"
                    size="icon-sm"
                    aria-label="删除卡片"
                    onClick={() => onChange({ sceneCards: cards.filter((c) => c.id !== card.id) })}
                  >
                    <Trash2 />
                  </Button>
                </div>
              ))}
            </div>
          </details>
        )
      })}

      <Button variant="secondary" className="w-full" onClick={addPool}>
        <Plus />
        新建卡池
      </Button>
    </div>
  )
}
