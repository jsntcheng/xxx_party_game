"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Modal } from "@/components/ui/modal"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/toast"
import { api } from "@/lib/client/api"
import { ConfigError, parseGameConfig } from "@/lib/game/config"
import { defaultGameConfig } from "@/lib/game/defaults"
import { CELL_LIST_META } from "@/lib/game/meta"
import { CELL_LIST_KEYS, type CellListKey, type GameConfig } from "@/lib/game/types"
import { cn } from "@/lib/utils"
import { BoardEditor } from "./board-editor"
import { CellListEditor } from "./cell-list-editor"
import { SceneEditor } from "./scene-editor"
import { TransferPanel } from "./transfer-panel"

interface ConfigDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  config: GameConfig
  applyLabel: string
  /** 应用到当前对局，成功返回 true。 */
  onApply: (config: GameConfig) => Promise<boolean>
}

/** 场景卡 id 只用于编辑时定位，导入的配置可能重复，打开时重新编号。 */
const toDraft = (config: GameConfig): GameConfig => ({
  ...config,
  sceneCards: config.sceneCards.map((card, index) => ({ ...card, id: index + 1 })),
})

/** 丢弃空白条目后走统一校验；失败时提示并返回 null。 */
function finalize(draft: GameConfig): GameConfig | null {
  const lists = Object.fromEntries(
    CELL_LIST_KEYS.map((key) => [key, draft[key].filter((cell) => cell.content.trim())]),
  ) as Pick<GameConfig, CellListKey>
  const sceneCards = draft.sceneCards.filter((card) => card.title.trim() || card.description.trim())
  try {
    return parseGameConfig({ ...draft, ...lists, sceneCards })
  } catch (error) {
    toast(error instanceof ConfigError ? `配置有误：${error.message}` : "配置有误", "error")
    return null
  }
}

/** 自定义游戏内容：任务列表、棋盘、场景卡、导入导出。改动在「保存」前只是草稿。 */
export function ConfigDialog({ open, onOpenChange, config, applyLabel, onApply }: ConfigDialogProps) {
  const [draft, setDraft] = useState(() => toDraft(config))
  const [listKey, setListKey] = useState<CellListKey>("normalCells")
  const [saving, setSaving] = useState(false)

  // 每次打开时从当前配置重新开始编辑
  const [wasOpen, setWasOpen] = useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) setDraft(toDraft(config))
  }

  const patch = (fields: Partial<GameConfig>) => setDraft((prev) => ({ ...prev, ...fields }))

  const resetToDefault = async () => {
    try {
      setDraft(toDraft((await api.getDefaultConfig()).config))
    } catch {
      setDraft(toDraft(defaultGameConfig))
    }
    toast("已恢复默认内容，点「保存」后生效")
  }

  const save = async () => {
    const next = finalize(draft)
    if (!next) return
    setSaving(true)
    const ok = await onApply(next)
    setSaving(false)
    if (ok) onOpenChange(false)
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="自定义游戏"
      description="编辑任务、棋盘和场景卡，双方共用同一份配置"
      className="h-[min(88dvh,760px)] max-w-2xl"
      footer={
        <>
          <Button variant="ghost" className="mr-auto" onClick={resetToDefault}>
            恢复默认
          </Button>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button disabled={saving} onClick={save}>
            {saving ? "保存中…" : applyLabel}
          </Button>
        </>
      }
    >
      <Tabs defaultValue="tasks" className="space-y-4">
        <TabsList className="sticky top-0 z-10 bg-night-soft/90 backdrop-blur">
          <TabsTrigger value="tasks" className="flex-1">
            任务内容
          </TabsTrigger>
          <TabsTrigger value="board" className="flex-1">
            棋盘
          </TabsTrigger>
          <TabsTrigger value="scenes" className="flex-1">
            场景卡
          </TabsTrigger>
          <TabsTrigger value="transfer" className="flex-1">
            导入导出
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="space-y-4">
          <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="任务列表">
            {CELL_LIST_KEYS.map((key) => (
              <button
                key={key}
                type="button"
                role="radio"
                aria-checked={listKey === key}
                onClick={() => setListKey(key)}
                className={cn(
                  "cursor-pointer rounded-full px-3 py-1 text-xs transition",
                  listKey === key
                    ? "bg-gradient-to-r from-rose-500 to-fuchsia-500 text-white shadow shadow-pink-500/30"
                    : "bg-white/6 text-white/60 hover:bg-white/12 hover:text-white",
                )}
              >
                {CELL_LIST_META[key].label}
                <span className="ml-1 opacity-60">{draft[key].length}</span>
              </button>
            ))}
          </div>
          <CellListEditor
            key={listKey}
            listKey={listKey}
            cells={draft[listKey]}
            onChange={(cells) => patch({ [listKey]: cells })}
          />
        </TabsContent>

        <TabsContent value="board">
          <BoardEditor value={draft} onChange={patch} />
        </TabsContent>

        <TabsContent value="scenes">
          <SceneEditor value={draft} onChange={patch} />
        </TabsContent>

        <TabsContent value="transfer">
          <TransferPanel getDraft={() => finalize(draft)} onImport={(config) => setDraft(toDraft(config))} />
        </TabsContent>
      </Tabs>
    </Modal>
  )
}
