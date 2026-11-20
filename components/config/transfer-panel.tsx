"use client"

import { Copy, Download, FileUp, ShieldCheck, Upload } from "lucide-react"
import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input, Textarea } from "@/components/ui/input"
import { toast } from "@/components/ui/toast"
import { api, ApiError } from "@/lib/client/api"
import { ConfigError, parseGameConfig } from "@/lib/game/config"
import type { GameConfig } from "@/lib/game/types"

interface TransferPanelProps {
  /** 当前编辑中的配置（已规范化）；返回 null 表示草稿校验失败。 */
  getDraft: () => GameConfig | null
  onImport: (config: GameConfig) => void
}

/** 导入/导出 JSON，以及管理员把配置保存为所有新房间的默认配置。 */
export function TransferPanel({ getDraft, onImport }: TransferPanelProps) {
  const [text, setText] = useState("")
  const [password, setPassword] = useState("")
  const [saving, setSaving] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)

  const exportJson = () => {
    const draft = getDraft()
    return draft && JSON.stringify(draft, null, 2)
  }

  const copy = async () => {
    const json = exportJson()
    if (!json) return
    try {
      await navigator.clipboard.writeText(json)
      toast("配置已复制到剪贴板", "success")
    } catch {
      setText(json)
      toast("无法访问剪贴板，已填入下方文本框，请手动复制")
    }
  }

  const download = () => {
    const json = exportJson()
    if (!json) return
    const url = URL.createObjectURL(new Blob([json], { type: "application/json" }))
    const link = Object.assign(document.createElement("a"), { href: url, download: "couple-chess-config.json" })
    link.click()
    URL.revokeObjectURL(url)
  }

  const importText = (raw: string) => {
    try {
      onImport(parseGameConfig(JSON.parse(raw)))
      setText("")
      toast("已导入，记得点「保存」才会生效", "success")
    } catch (error) {
      const message = error instanceof ConfigError ? error.message : "不是有效的 JSON"
      toast(`导入失败：${message}`, "error")
    }
  }

  const readFile = async (file: File | undefined) => {
    if (file) importText(await file.text())
  }

  const saveAsDefault = async () => {
    const draft = getDraft()
    if (!draft) return
    setSaving(true)
    try {
      await api.saveDefaultConfig(password, draft)
      toast("已保存为默认配置，之后新建的房间都会使用它", "success")
      setPassword("")
    } catch (error) {
      toast(error instanceof ApiError ? error.message : "保存失败", "error")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h3 className="text-sm font-medium text-white/85">导出</h3>
        <p className="text-xs text-white/45">导出当前编辑中的配置，可以分享给朋友或留作备份</p>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={copy}>
            <Copy />
            复制 JSON
          </Button>
          <Button variant="secondary" onClick={download}>
            <Download />
            下载文件
          </Button>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-medium text-white/85">导入</h3>
        <p className="text-xs text-white/45">支持本游戏（包括旧版）导出的配置，导入后覆盖编辑中的内容</p>
        <Textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="粘贴配置 JSON…"
          className="min-h-32 font-mono text-xs"
        />
        <div className="flex flex-wrap gap-2">
          <Button disabled={!text.trim()} onClick={() => importText(text)}>
            <Upload />
            导入
          </Button>
          <Button variant="secondary" onClick={() => fileInput.current?.click()}>
            <FileUp />
            从文件导入
          </Button>
          <input
            ref={fileInput}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(event) => {
              void readFile(event.target.files?.[0])
              event.target.value = ""
            }}
          />
        </div>
      </section>

      <section className="space-y-3 rounded-2xl bg-amber-300/5 p-4 ring-1 ring-amber-200/15">
        <h3 className="flex items-center gap-1.5 text-sm font-medium text-amber-100/90">
          <ShieldCheck className="size-4" />
          设为默认配置（管理员）
        </h3>
        <p className="text-xs text-white/45">保存后，所有新建房间和同屏对局都会使用这份配置，需要服务器设置的管理员密码</p>
        <div className="flex gap-2">
          <Input
            type="password"
            value={password}
            autoComplete="current-password"
            placeholder="管理员密码"
            onChange={(event) => setPassword(event.target.value)}
          />
          <Button variant="gold" className="h-10" disabled={!password || saving} onClick={saveAsDefault}>
            {saving ? "保存中…" : "保存为默认"}
          </Button>
        </div>
      </section>
    </div>
  )
}
