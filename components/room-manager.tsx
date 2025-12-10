"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Copy, Check, Users, Plus, LogIn, Loader2, Minus, User } from "lucide-react"

interface RoomConfig {
  maleCount: number
  femaleCount: number
  totalPlayers: number
  seats: {
    index: number
    gender: "male" | "female"
    playerId: string | null
    playerName: string | null
  }[]
}

interface RoomManagerProps {
  onCreateRoom: (config: { maleCount: number; femaleCount: number }) => Promise<string | null>
  onJoinRoom: (roomId: string) => Promise<{ success: boolean; roomConfig?: RoomConfig }>
  onPlayLocal: () => void
  onSeatSelected: (seatIndex: number, gender: "male" | "female") => void
  roomConfig: RoomConfig | null
  roomId: string | null
  playerId: string
}

export function RoomManager({
  onCreateRoom,
  onJoinRoom,
  onPlayLocal,
  onSeatSelected,
  roomConfig,
  roomId,
  playerId,
}: RoomManagerProps) {
  const [mode, setMode] = useState<"select" | "create" | "join" | "seats">("select")
  const [createdRoomId, setCreatedRoomId] = useState("")
  const [inputRoomId, setInputRoomId] = useState("")
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [maleCount, setMaleCount] = useState(1)
  const [femaleCount, setFemaleCount] = useState(1)
  const [playerName, setPlayerName] = useState("")

  useEffect(() => {
    // 生成随机玩家名
    if (!playerName) {
      setPlayerName(`玩家${Math.floor(Math.random() * 10000)}`)
    }
  }, [playerName])

  const handleCreate = async () => {
    setLoading(true)
    setError("")
    const id = await onCreateRoom({ maleCount, femaleCount })
    if (id) {
      setCreatedRoomId(id)
      setMode("seats")
    } else {
      setError("创建房间失败，请重试")
    }
    setLoading(false)
  }

  const handleJoin = async () => {
    if (!inputRoomId.trim()) {
      setError("请输入房间号")
      return
    }
    setLoading(true)
    setError("")
    const result = await onJoinRoom(inputRoomId.toUpperCase())
    if (result.success) {
      setCreatedRoomId(inputRoomId.toUpperCase())
      setMode("seats")
    } else {
      setError("房间不存在或已过期")
    }
    setLoading(false)
  }

  const copyRoomId = async () => {
    const idToCopy = createdRoomId || roomId || ""
    if (!idToCopy) return

    try {
      // 尝试使用 Clipboard API
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(idToCopy)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } else {
        // 降级方案：使用 execCommand
        const textArea = document.createElement("textarea")
        textArea.value = idToCopy
        textArea.style.position = "fixed"
        textArea.style.left = "-999999px"
        textArea.style.top = "-999999px"
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()

        const successful = document.execCommand("copy")
        document.body.removeChild(textArea)

        if (successful) {
          setCopied(true)
          setTimeout(() => setCopied(false), 2000)
        } else {
          setError("复制失败，请手动复制")
        }
      }
    } catch (err) {
      console.error("复制失败:", err)
      setError("复制失败，请手动复制: " + idToCopy)
      setTimeout(() => setError(""), 3000)
    }
  }

  const handleSeatClick = (seat: RoomConfig["seats"][0]) => {
    if (seat.playerId && seat.playerId !== playerId) return // 已被其他人占用
    onSeatSelected(seat.index, seat.gender)
  }

  // 显示座位选择界面
  if (mode === "seats" && (roomConfig || createdRoomId)) {
    const displayRoomId = roomId || createdRoomId
    const allSeated = roomConfig?.seats.every((s) => s.playerId !== null)
    const mySeated = roomConfig?.seats.some((s) => s.playerId === playerId)

    return (
      <Card className="w-full max-w-lg mx-auto bg-white/95 shadow-xl">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-xl text-rose-600">选择座位</CardTitle>
          <div className="flex items-center justify-center gap-2 mt-2">
            <input
              type="text"
              readOnly
              value={displayRoomId}
              className="text-xl md:text-2xl font-mono font-bold tracking-widest bg-rose-50 px-4 py-1 rounded-lg text-center border-0 focus:outline-none focus:ring-2 focus:ring-rose-300 w-36 md:w-40"
              onClick={(e) => (e.target as HTMLInputElement).select()}
            />
            <Button variant="outline" size="icon" onClick={copyRoomId} className="h-9 w-9 bg-transparent">
              {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
          <CardDescription className="mt-2">分享房间号邀请其他玩家加入</CardDescription>
          {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 玩家昵称输入 */}
          <div className="flex gap-2 items-center">
            <span className="text-sm text-muted-foreground whitespace-nowrap">我的昵称:</span>
            <Input
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="flex-1"
              placeholder="输入昵称"
              maxLength={10}
            />
          </div>

          {/* 座位列表 */}
          <div className="grid grid-cols-2 gap-3">
            {roomConfig?.seats.map((seat) => {
              const isOccupied = seat.playerId !== null
              const isMe = seat.playerId === playerId
              const isMale = seat.gender === "male"

              return (
                <button
                  key={seat.index}
                  onClick={() => handleSeatClick(seat)}
                  disabled={isOccupied && !isMe}
                  className={`p-3 rounded-xl border-2 transition-all ${
                    isMale
                      ? isMe
                        ? "bg-blue-100 border-blue-500 ring-2 ring-blue-400"
                        : isOccupied
                          ? "bg-blue-50 border-blue-200 opacity-60"
                          : "bg-blue-50 border-blue-300 hover:border-blue-500 hover:bg-blue-100"
                      : isMe
                        ? "bg-pink-100 border-pink-500 ring-2 ring-pink-400"
                        : isOccupied
                          ? "bg-pink-50 border-pink-200 opacity-60"
                          : "bg-pink-50 border-pink-300 hover:border-pink-500 hover:bg-pink-100"
                  } ${!isOccupied || isMe ? "cursor-pointer" : "cursor-not-allowed"}`}
                >
                  <div className="flex flex-col items-center gap-1">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-lg ${
                        isMale ? "bg-blue-500" : "bg-pink-500"
                      }`}
                    >
                      {isMale ? "♂" : "♀"}
                    </div>
                    <span className="text-xs font-medium">
                      {isOccupied ? seat.playerName || (isMe ? playerName : "已入座") : "空位"}
                    </span>
                    {isMe && <span className="text-[10px] text-green-600 font-bold">我</span>}
                  </div>
                </button>
              )
            })}
          </div>

          {!mySeated && <p className="text-center text-sm text-amber-600">请点击一个空位入座</p>}

          {mySeated && !allSeated && (
            <div className="text-center space-y-2">
              <Loader2 className="w-5 h-5 animate-spin mx-auto text-rose-400" />
              <p className="text-sm text-muted-foreground">等待其他玩家入座...</p>
            </div>
          )}

          {allSeated && mySeated && (
            <p className="text-center text-sm text-green-600 font-medium">所有玩家已就位，游戏即将开始!</p>
          )}
        </CardContent>
      </Card>
    )
  }

  // 创建房间配置界面
  if (mode === "create") {
    return (
      <Card className="w-full max-w-md mx-auto bg-white/95 shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-xl text-rose-600">创建房间</CardTitle>
          <CardDescription>设置房间人数</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 男生数量 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white">♂</div>
              <span className="font-medium">男生数量</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 bg-transparent"
                onClick={() => setMaleCount(Math.max(0, maleCount - 1))}
                disabled={maleCount <= 0}
              >
                <Minus className="w-4 h-4" />
              </Button>
              <span className="w-8 text-center text-lg font-bold">{maleCount}</span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 bg-transparent"
                onClick={() => setMaleCount(Math.min(4, maleCount + 1))}
                disabled={maleCount >= 4}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* 女生数量 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-pink-500 flex items-center justify-center text-white">♀</div>
              <span className="font-medium">女生数量</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 bg-transparent"
                onClick={() => setFemaleCount(Math.max(0, femaleCount - 1))}
                disabled={femaleCount <= 0}
              >
                <Minus className="w-4 h-4" />
              </Button>
              <span className="w-8 text-center text-lg font-bold">{femaleCount}</span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 bg-transparent"
                onClick={() => setFemaleCount(Math.min(4, femaleCount + 1))}
                disabled={femaleCount >= 4}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 py-2 bg-rose-50 rounded-lg">
            <Users className="w-5 h-5 text-rose-500" />
            <span className="font-medium text-rose-600">总人数: {maleCount + femaleCount}</span>
          </div>

          {maleCount + femaleCount < 2 && <p className="text-center text-sm text-amber-600">至少需要2名玩家</p>}

          {error && <p className="text-sm text-red-500 text-center">{error}</p>}

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setMode("select")} className="flex-1">
              返回
            </Button>
            <Button
              onClick={handleCreate}
              disabled={loading || maleCount + femaleCount < 2}
              className="flex-1 bg-rose-500 hover:bg-rose-600"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              创建
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // 加入房间界面
  if (mode === "join") {
    return (
      <Card className="w-full max-w-md mx-auto bg-white/95 shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-xl text-rose-600">加入房间</CardTitle>
          <CardDescription>输入对方分享的房间号</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="请输入6位房间号"
            value={inputRoomId}
            onChange={(e) => setInputRoomId(e.target.value.toUpperCase())}
            className="text-center text-xl font-mono tracking-widest"
            maxLength={6}
          />
          {error && <p className="text-sm text-red-500 text-center">{error}</p>}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setMode("select")} className="flex-1">
              返回
            </Button>
            <Button onClick={handleJoin} disabled={loading} className="flex-1 bg-rose-500 hover:bg-rose-600">
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              加入
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // 初始选择界面
  return (
    <Card className="w-full max-w-md mx-auto bg-white/95 shadow-xl">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl text-rose-600">多端同步已启用</CardTitle>
        <CardDescription>选择游戏模式开始游玩</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button
          onClick={() => setMode("create")}
          disabled={loading}
          className="w-full h-14 text-lg bg-rose-500 hover:bg-rose-600"
        >
          <Plus className="w-5 h-5 mr-2" />
          创建房间
        </Button>
        <Button onClick={() => setMode("join")} variant="outline" className="w-full h-14 text-lg">
          <LogIn className="w-5 h-5 mr-2" />
          加入房间
        </Button>
        <div className="relative py-2">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-muted-foreground">或者</span>
          </div>
        </div>
        <Button onClick={onPlayLocal} variant="ghost" className="w-full text-muted-foreground">
          <User className="w-4 h-4 mr-2" />
          本地游戏（不同步）
        </Button>
        {error && <p className="text-sm text-red-500 text-center">{error}</p>}
      </CardContent>
    </Card>
  )
}
