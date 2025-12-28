"use client"
import { useState, useEffect } from "react"
import { X, Plus, Trash2, Download, Upload, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  type GameConfig,
  type GameCell,
  type SceneCard,
  defaultSceneCardPoolNames,
  defaultSceneCards,
} from "@/lib/game-data"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ConfigModalProps {
  isOpen: boolean
  onClose: () => void
  config: GameConfig
  onSave: (config: GameConfig) => void
  onReset: () => void
}

export function ConfigModal({ isOpen, onClose, config, onSave, onReset }: ConfigModalProps) {
  const [localConfig, setLocalConfig] = useState<GameConfig>(config)
  const [activeTab, setActiveTab] = useState("normal")
  const [newCellContent, setNewCellContent] = useState("")
  const [newCellGender, setNewCellGender] = useState<"both" | "male" | "female">("both")
  const [newPosition, setNewPosition] = useState("")
  const [newPositionType, setNewPositionType] = useState<string>("truth")
  const [newSceneTitle, setNewSceneTitle] = useState("")
  const [newSceneDesc, setNewSceneDesc] = useState("")
  const [newSceneIcon, setNewSceneIcon] = useState("")
  const [newScenePool, setNewScenePool] = useState("")
  const [newPoolName, setNewPoolName] = useState("")
  const [expandedPools, setExpandedPools] = useState<{ [key: string]: boolean }>({})

  const [showExportDialog, setShowExportDialog] = useState(false)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [importText, setImportText] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [importTarget, setImportTarget] = useState<"current" | "default">("current")
  const [adminPassword, setAdminPassword] = useState("")

  useEffect(() => {
    if (config) {
      let configWithNewFormat = { ...config }
      if (!config.sceneCardPoolNames || !config.sceneCards) {
        // 旧格式转换
        if (config.sceneCardPools && config.sceneCardPools.length > 0) {
          const poolNames = config.sceneCardPools.map((_, i) => `卡池${i + 1}`)
          const cards: SceneCard[] = []
          config.sceneCardPools.forEach((pool, i) => {
            pool.forEach((card) => {
              cards.push({ ...card, pool: poolNames[i] })
            })
          })
          configWithNewFormat = {
            ...config,
            sceneCardPoolNames: poolNames,
            sceneCards: cards,
            sceneCardCount: config.sceneCardCount ?? config.sceneCardPools.length,
          }
        } else {
          configWithNewFormat = {
            ...config,
            sceneCardPoolNames: defaultSceneCardPoolNames,
            sceneCards: defaultSceneCards,
            sceneCardCount: config.sceneCardCount ?? 3,
          }
        }
      }
      setLocalConfig(configWithNewFormat)
      // 初始化展开状态
      if (configWithNewFormat.sceneCardPoolNames) {
        const expanded: { [key: string]: boolean } = {}
        configWithNewFormat.sceneCardPoolNames.forEach((name, i) => {
          expanded[name] = i === 0
        })
        setExpandedPools(expanded)
        if (configWithNewFormat.sceneCardPoolNames.length > 0) {
          setNewScenePool(configWithNewFormat.sceneCardPoolNames[0])
        }
      }
    }
  }, [config])

  const tabToConfigKey: { [key: string]: keyof GameConfig } = {
    normal: "normalCells",
    male: "maleCells",
    female: "femaleCells",
    truth: "truthCells",
    dare: "dareCells",
    kiss: "kissCells",
    hug: "hugCells",
    punishment: "punishmentCells",
    reward: "rewardCells",
    endpoint: "endpointCells",
  }

  const handleAddCell = () => {
    if (!newCellContent.trim()) return
    const key = tabToConfigKey[activeTab]
    if (!key) return
    const currentCells = (localConfig[key] as GameCell[]) || []
    const cellType = activeTab
    const gender = activeTab === "male" ? "male" : activeTab === "female" ? "female" : newCellGender
    const newCell: GameCell = {
      id: Date.now(),
      content: newCellContent.trim(),
      type: cellType as GameCell["type"],
      player: gender,
    }
    setLocalConfig({
      ...localConfig,
      [key]: [...currentCells, newCell],
    })
    setNewCellContent("")
    setNewCellGender("both")
  }

  const handleDeleteCell = (id: number) => {
    const key = tabToConfigKey[activeTab]
    if (!key) return
    setLocalConfig({
      ...localConfig,
      [key]: ((localConfig[key] as GameCell[]) || []).filter((cell) => cell.id !== id),
    })
  }

  const handleAddPosition = () => {
    const pos = Number.parseInt(newPosition)
    if (isNaN(pos) || pos < 1 || pos > localConfig.boardSize) return
    setLocalConfig({
      ...localConfig,
      specialCellPositions: {
        ...localConfig.specialCellPositions,
        [pos]: newPositionType as GameCell["type"],
      },
    })
    setNewPosition("")
  }

  const handleDeletePosition = (position: number) => {
    const newPositions = { ...localConfig.specialCellPositions }
    delete newPositions[position]
    setLocalConfig({
      ...localConfig,
      specialCellPositions: newPositions,
    })
  }

  const handleSave = () => {
    onSave(localConfig)
    onClose()
  }

  const handleAddPool = () => {
    if (!newPoolName.trim()) return
    const poolNames = [...(localConfig.sceneCardPoolNames || [])]
    if (poolNames.includes(newPoolName.trim())) {
      alert("卡池名称已存在")
      return
    }
    poolNames.push(newPoolName.trim())
    setLocalConfig({ ...localConfig, sceneCardPoolNames: poolNames })
    setExpandedPools({ ...expandedPools, [newPoolName.trim()]: true })
    setNewPoolName("")
  }

  const handleDeletePool = (poolName: string) => {
    const poolNames = (localConfig.sceneCardPoolNames || []).filter((n) => n !== poolName)
    const cards = (localConfig.sceneCards || []).filter((c) => c.pool !== poolName)
    const newCount = Math.min(localConfig.sceneCardCount || 3, poolNames.length)
    setLocalConfig({ ...localConfig, sceneCardPoolNames: poolNames, sceneCards: cards, sceneCardCount: newCount })
  }

  const handleAddSceneCard = () => {
    if (!newSceneTitle.trim() || !newSceneDesc.trim() || !newScenePool) return
    const newCard: SceneCard = {
      id: Date.now(),
      title: newSceneTitle.trim(),
      description: newSceneDesc.trim(),
      icon: newSceneIcon.trim() || "🎴",
      pool: newScenePool,
    }
    setLocalConfig({
      ...localConfig,
      sceneCards: [...(localConfig.sceneCards || []), newCard],
    })
    setNewSceneTitle("")
    setNewSceneDesc("")
    setNewSceneIcon("")
  }

  const handleDeleteSceneCard = (cardId: number) => {
    setLocalConfig({
      ...localConfig,
      sceneCards: (localConfig.sceneCards || []).filter((c) => c.id !== cardId),
    })
  }

  const togglePoolExpanded = (poolName: string) => {
    setExpandedPools({ ...expandedPools, [poolName]: !expandedPools[poolName] })
  }

  const getCardsInPool = (poolName: string) => {
    return (localConfig.sceneCards || []).filter((c) => c.pool === poolName)
  }

  const handleImport = async () => {
    try {
      const parsed = JSON.parse(importText)
      if (!parsed.normalCells || !parsed.boardSize) {
        alert("配置格式不正确")
        return
      }
      // 兼容处理
      let configWithNewFormat = { ...parsed }
      if (!parsed.sceneCardPoolNames || !parsed.sceneCards) {
        if (parsed.sceneCardPools && parsed.sceneCardPools.length > 0) {
          const poolNames = parsed.sceneCardPools.map((_: SceneCard[], i: number) => `卡池${i + 1}`)
          const cards: SceneCard[] = []
          parsed.sceneCardPools.forEach((pool: SceneCard[], i: number) => {
            pool.forEach((card: SceneCard) => {
              cards.push({ ...card, pool: poolNames[i] })
            })
          })
          configWithNewFormat = {
            ...parsed,
            sceneCardPoolNames: poolNames,
            sceneCards: cards,
            sceneCardCount: parsed.sceneCardCount ?? parsed.sceneCardPools.length,
          }
        } else {
          configWithNewFormat = {
            ...parsed,
            sceneCardPoolNames: defaultSceneCardPoolNames,
            sceneCards: defaultSceneCards,
            sceneCardCount: parsed.sceneCardCount ?? 3,
          }
        }
      }
      if (importTarget === "default") {
        setIsSubmitting(true)
        try {
          const res = await fetch("/api/default-config", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ config: configWithNewFormat, password: adminPassword }),
          })
          const data = await res.json()
          if (!res.ok) {
            alert(data.error || "保存失败")
            return
          }
          alert("默认配置已更新")
        } finally {
          setIsSubmitting(false)
        }
      } else {
        setLocalConfig(configWithNewFormat)
        onSave(configWithNewFormat)
      }
      setShowImportDialog(false)
      setImportText("")
      setAdminPassword("")
    } catch {
      alert("JSON格式错误")
    }
  }

  const renderSceneCardsTab = () => {
    const poolNames = localConfig.sceneCardPoolNames || []
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <label className="text-sm text-muted-foreground block mb-1">抽取场景卡数量</label>
            <p className="text-xs text-gray-400">依次从前N个卡池各抽1张</p>
          </div>
          <Input
            type="number"
            value={localConfig.sceneCardCount ?? 3}
            onChange={(e) => {
              const count = Math.max(0, Math.min(Number.parseInt(e.target.value) || 0, poolNames.length))
              setLocalConfig({ ...localConfig, sceneCardCount: count })
            }}
            min={0}
            max={poolNames.length}
            className="w-20 h-8"
          />
        </div>

        {/* 卡池列表 */}
        <div className="space-y-2 max-h-64 md:max-h-72 overflow-y-auto">
          {poolNames.map((poolName, index) => {
            const cardsInPool = getCardsInPool(poolName)
            const isExpanded = expandedPools[poolName]
            return (
              <div key={poolName} className="border rounded-lg overflow-hidden">
                <div
                  className="flex items-center justify-between p-2 bg-gradient-to-r from-amber-50 to-orange-50 cursor-pointer"
                  onClick={() => togglePoolExpanded(poolName)}
                >
                  <div className="flex items-center gap-2">
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    )}
                    <span className="font-medium text-sm text-amber-700">
                      {index < (localConfig.sceneCardCount || 0) && (
                        <span className="text-xs bg-amber-500 text-white px-1 rounded mr-1">第{index + 1}张</span>
                      )}
                      {poolName}
                    </span>
                    <span className="text-xs text-gray-500">({cardsInPool.length}张)</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeletePool(poolName)
                    }}
                  >
                    <Trash2 className="w-3 h-3 text-red-500" />
                  </Button>
                </div>
                {isExpanded && (
                  <div className="p-2 space-y-2 bg-white">
                    {cardsInPool.map((card) => (
                      <div key={card.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded text-sm">
                        <span className="text-lg">{card.icon || "🎴"}</span>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate text-xs">{card.title}</div>
                          <div className="text-xs text-gray-500 truncate">{card.description}</div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 shrink-0"
                          onClick={() => handleDeleteSceneCard(card.id)}
                        >
                          <Trash2 className="w-3 h-3 text-red-500" />
                        </Button>
                      </div>
                    ))}
                    {cardsInPool.length === 0 && <p className="text-center text-gray-400 py-2 text-xs">此卡池为空</p>}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* 添加新卡池 */}
        <div className="flex gap-2">
          <Input
            value={newPoolName}
            onChange={(e) => setNewPoolName(e.target.value)}
            placeholder="新卡池名称..."
            className="flex-1 h-8 text-sm"
            onKeyDown={(e) => e.key === "Enter" && handleAddPool()}
          />
          <Button
            onClick={handleAddPool}
            size="sm"
            className="bg-amber-500 hover:bg-amber-600 text-white h-8"
            disabled={!newPoolName.trim()}
          >
            <Plus className="w-3 h-3 mr-1" />
            添加卡池
          </Button>
        </div>

        {/* 添加新场景卡 */}
        {poolNames.length > 0 && (
          <div className="border-t pt-3 space-y-2">
            <label className="text-sm font-medium">添加场景卡</label>
            <div className="flex gap-2 flex-wrap">
              <Input
                value={newSceneIcon}
                onChange={(e) => setNewSceneIcon(e.target.value)}
                placeholder="图标"
                className="w-14 h-8 text-sm"
              />
              <Input
                value={newSceneTitle}
                onChange={(e) => setNewSceneTitle(e.target.value)}
                placeholder="名称"
                className="flex-1 min-w-24 h-8 text-sm"
              />
              <Select value={newScenePool} onValueChange={setNewScenePool}>
                <SelectTrigger className="w-28 h-8 text-sm">
                  <SelectValue placeholder="选择卡池" />
                </SelectTrigger>
                <SelectContent>
                  {poolNames.map((name) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Input
                value={newSceneDesc}
                onChange={(e) => setNewSceneDesc(e.target.value)}
                placeholder="描述..."
                className="flex-1 h-8 text-sm"
                onKeyDown={(e) => e.key === "Enter" && handleAddSceneCard()}
              />
              <Button
                onClick={handleAddSceneCard}
                size="sm"
                className="bg-amber-500 hover:bg-amber-600 text-white h-8"
                disabled={!newSceneTitle.trim() || !newSceneDesc.trim() || !newScenePool}
              >
                <Plus className="w-3 h-3" />
              </Button>
            </div>
          </div>
        )}
      </div>
    )
  }

  const renderCellsList = () => {
    const key = tabToConfigKey[activeTab]
    if (!key) return null
    const cells = (localConfig[key] as GameCell[]) || []
    return (
      <div className="space-y-4">
        <div className="max-h-48 md:max-h-64 overflow-y-auto space-y-2">
          {cells.map((cell) => (
            <div key={cell.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
              <span className="flex-1 text-sm">{cell.content}</span>
              {cell.player && cell.player !== "both" && (
                <span
                  className={`text-xs px-1 rounded ${cell.player === "male" ? "bg-blue-100 text-blue-600" : "bg-pink-100 text-pink-600"}`}
                >
                  {cell.player === "male" ? "♂" : "♀"}
                </span>
              )}
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDeleteCell(cell.id)}>
                <Trash2 className="w-3 h-3 text-red-500" />
              </Button>
            </div>
          ))}
          {cells.length === 0 && <p className="text-center text-gray-400 py-4">暂无内容</p>}
        </div>
        <div className="flex gap-2">
          <Input
            value={newCellContent}
            onChange={(e) => setNewCellContent(e.target.value)}
            placeholder="输入新内容..."
            className="flex-1"
            onKeyDown={(e) => e.key === "Enter" && handleAddCell()}
          />
          {activeTab === "normal" && (
            <Select value={newCellGender} onValueChange={(v) => setNewCellGender(v as "both" | "male" | "female")}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="both">通用</SelectItem>
                <SelectItem value="male">♂</SelectItem>
                <SelectItem value="female">♀</SelectItem>
              </SelectContent>
            </Select>
          )}
          <Button onClick={handleAddCell} className="bg-rose-500 hover:bg-rose-600 text-white">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>
    )
  }

  const renderPositionsTab = () => {
    const positions = Object.entries(localConfig.specialCellPositions || {}).sort(([a], [b]) => Number(a) - Number(b))
    const cellTypes = [
      { value: "truth", label: "真心话" },
      { value: "dare", label: "大冒险" },
      { value: "kiss", label: "亲亲" },
      { value: "hug", label: "抱抱" },
      { value: "punishment", label: "惩罚" },
      { value: "reward", label: "奖励" },
      { value: "forward", label: "前进" },
      { value: "backward", label: "后退" },
      { value: "skip", label: "停一轮" },
      { value: "again", label: "再掷一次" },
      { value: "swap", label: "交换" },
    ]
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">棋盘大小</label>
          <Input
            type="number"
            value={localConfig.boardSize}
            onChange={(e) =>
              setLocalConfig({ ...localConfig, boardSize: Math.max(10, Number.parseInt(e.target.value) || 48) })
            }
            min={10}
          />
          <p className="text-xs text-muted-foreground">棋盘会根据格子数量自动调整行列数，建议范围：20-100格</p>
          <p className="text-xs text-amber-600">修改后需要点击"重新开始"按钮才能生效</p>
        </div>
        <div className="max-h-48 md:max-h-64 overflow-y-auto space-y-2">
          {positions.map(([pos, type]) => (
            <div key={pos} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
              <span className="w-12 text-sm font-medium">第{pos}格</span>
              <span className="flex-1 text-sm">{cellTypes.find((t) => t.value === type)?.label || type}</span>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDeletePosition(Number(pos))}>
                <Trash2 className="w-3 h-3 text-red-500" />
              </Button>
            </div>
          ))}
          {positions.length === 0 && <p className="text-center text-gray-400 py-4">暂无特殊位置设定</p>}
        </div>
        <div className="flex gap-2">
          <Input
            type="number"
            value={newPosition}
            onChange={(e) => setNewPosition(e.target.value)}
            placeholder="位置"
            className="w-20"
            min={1}
            max={localConfig.boardSize}
          />
          <Select value={newPositionType} onValueChange={setNewPositionType}>
            <SelectTrigger className="flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {cellTypes.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleAddPosition} className="bg-rose-500 hover:bg-rose-600 text-white">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>
    )
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 md:p-4">
      <div className="w-full max-w-2xl max-h-[90vh] bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-3 md:p-4 border-b">
          <h2 className="text-base md:text-lg font-bold">游戏配置</h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowExportDialog(true)}
              className="text-xs bg-transparent"
            >
              <Download className="w-3 h-3 mr-1" />
              导出
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowImportDialog(true)}
              className="text-xs bg-transparent"
            >
              <Upload className="w-3 h-3 mr-1" />
              导入
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 md:p-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="flex flex-wrap gap-1 h-auto mb-4 bg-transparent">
              <TabsTrigger value="normal" className="text-xs md:text-sm data-[state=active]:bg-rose-100">
                普通
              </TabsTrigger>
              <TabsTrigger value="male" className="text-xs md:text-sm data-[state=active]:bg-blue-100">
                男生专属
              </TabsTrigger>
              <TabsTrigger value="female" className="text-xs md:text-sm data-[state=active]:bg-pink-100">
                女生专属
              </TabsTrigger>
              <TabsTrigger value="truth" className="text-xs md:text-sm data-[state=active]:bg-blue-100">
                真心话
              </TabsTrigger>
              <TabsTrigger value="dare" className="text-xs md:text-sm data-[state=active]:bg-purple-100">
                大冒险
              </TabsTrigger>
              <TabsTrigger value="kiss" className="text-xs md:text-sm data-[state=active]:bg-pink-100">
                亲亲
              </TabsTrigger>
              <TabsTrigger value="hug" className="text-xs md:text-sm data-[state=active]:bg-rose-100">
                抱抱
              </TabsTrigger>
              <TabsTrigger value="punishment" className="text-xs md:text-sm data-[state=active]:bg-orange-100">
                惩罚
              </TabsTrigger>
              <TabsTrigger value="reward" className="text-xs md:text-sm data-[state=active]:bg-emerald-100">
                奖励
              </TabsTrigger>
              <TabsTrigger value="endpoint" className="text-xs md:text-sm data-[state=active]:bg-yellow-100">
                终点区
              </TabsTrigger>
              <TabsTrigger value="positions" className="text-xs md:text-sm data-[state=active]:bg-indigo-100">
                位置设定
              </TabsTrigger>
              <TabsTrigger value="scenes" className="text-xs md:text-sm data-[state=active]:bg-amber-100">
                场景卡
              </TabsTrigger>
            </TabsList>

            <TabsContent value="normal">{renderCellsList()}</TabsContent>
            <TabsContent value="male">{renderCellsList()}</TabsContent>
            <TabsContent value="female">{renderCellsList()}</TabsContent>
            <TabsContent value="truth">{renderCellsList()}</TabsContent>
            <TabsContent value="dare">{renderCellsList()}</TabsContent>
            <TabsContent value="kiss">{renderCellsList()}</TabsContent>
            <TabsContent value="hug">{renderCellsList()}</TabsContent>
            <TabsContent value="punishment">{renderCellsList()}</TabsContent>
            <TabsContent value="reward">{renderCellsList()}</TabsContent>
            <TabsContent value="endpoint">{renderCellsList()}</TabsContent>
            <TabsContent value="positions">{renderPositionsTab()}</TabsContent>
            <TabsContent value="scenes">{renderSceneCardsTab()}</TabsContent>
          </Tabs>
        </div>

        <div className="p-3 md:p-4 border-t flex gap-2 justify-end">
          <Button variant="outline" onClick={onReset} className="bg-transparent">
            恢复默认
          </Button>
          <Button variant="outline" onClick={onClose} className="bg-transparent">
            取消
          </Button>
          <Button onClick={handleSave} className="bg-rose-500 hover:bg-rose-600 text-white">
            保存
          </Button>
        </div>
      </div>

      {/* 导出对话框 */}
      {showExportDialog && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-4">
            <h3 className="font-bold mb-3">导出配置</h3>
            <textarea
              id="export-config-text"
              value={JSON.stringify(localConfig, null, 2)}
              className="w-full h-48 p-2 border rounded text-xs font-mono"
              readOnly
            />
            <div className="flex gap-2 mt-3 justify-end">
              <Button variant="outline" onClick={() => setShowExportDialog(false)} className="bg-transparent">
                关闭
              </Button>
              <Button
                onClick={() => {
                  const text = JSON.stringify(localConfig, null, 2)
                  if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard
                      .writeText(text)
                      .then(() => {
                        alert("已复制到剪贴板")
                      })
                      .catch(() => {
                        // fallback
                        const textarea = document.getElementById("export-config-text") as HTMLTextAreaElement
                        if (textarea) {
                          textarea.select()
                          document.execCommand("copy")
                          alert("已复制到剪贴板")
                        }
                      })
                  } else {
                    // fallback for environments without clipboard API
                    const textarea = document.getElementById("export-config-text") as HTMLTextAreaElement
                    if (textarea) {
                      textarea.select()
                      document.execCommand("copy")
                      alert("已复制到剪贴板")
                    } else {
                      alert("请手动选择并复制上方文本")
                    }
                  }
                }}
                className="bg-rose-500 hover:bg-rose-600 text-white"
              >
                复制到剪贴板
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 导入对话框 */}
      {showImportDialog && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-4">
            <h3 className="font-bold mb-3">导入配置</h3>
            <div className="mb-3">
              <label className="text-sm text-muted-foreground mb-1 block">导入目标</label>
              <div className="flex gap-2">
                <Button
                  variant={importTarget === "current" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setImportTarget("current")}
                  className={importTarget === "current" ? "bg-rose-500" : "bg-transparent"}
                >
                  当前房间
                </Button>
                <Button
                  variant={importTarget === "default" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setImportTarget("default")}
                  className={importTarget === "default" ? "bg-rose-500" : "bg-transparent"}
                >
                  默认配置
                </Button>
              </div>
            </div>
            {importTarget === "default" && (
              <div className="mb-3">
                <label className="text-sm text-muted-foreground mb-1 block">管理员密码</label>
                <Input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="请输入管理员密码"
                />
              </div>
            )}
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              className="w-full h-48 p-2 border rounded text-xs font-mono"
              placeholder="粘贴配置JSON..."
            />
            <div className="flex gap-2 mt-3 justify-end">
              <Button variant="outline" onClick={() => setShowImportDialog(false)} className="bg-transparent">
                取消
              </Button>
              <Button
                onClick={handleImport}
                disabled={isSubmitting || !importText.trim()}
                className="bg-rose-500 hover:bg-rose-600 text-white"
              >
                {isSubmitting ? "保存中..." : "导入配置"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
