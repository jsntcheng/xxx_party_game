"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { toast } from "@/components/ui/toast"
import type { PublicRoom, SeatGrant, SeatStatus } from "@/lib/api-types"
import { api, ApiError } from "@/lib/client/api"
import type { GameController } from "@/lib/client/controller"
import type { OnlineSession } from "@/lib/client/storage"
import type { GameAction } from "@/lib/game/types"

const POLL_INTERVAL_MS = 1000
const OFFLINE_RETRY_MS = 3000
const EMPTY_SEATS: [SeatStatus, SeatStatus] = [
  { taken: true, online: true },
  { taken: false, online: false },
]

interface OnlineGameOptions {
  session: OnlineSession
  /** 刚创建/加入时服务器返回的房间，省去一次首屏轮询。 */
  initial: SeatGrant | null
  /** 房间失效（过期、token 无效）时退出，reason 用于提示。 */
  onExit: (reason?: string) => void
}

/**
 * 联机模式：服务端权威。
 * - 每秒带 since=version 轮询，版本没变只拿在线状态；页面隐藏时暂停
 * - 操作带 baseVersion 提交，409 时服务器回传最新房间，直接采用
 * - 房间只接受更高版本，避免慢请求把新状态覆盖回旧状态
 */
export function useOnlineGame({ session, initial, onExit }: OnlineGameOptions): GameController | null {
  const { roomId, token, seat } = session
  const [room, setRoom] = useState<PublicRoom | null>(initial?.room ?? null)
  const [seats, setSeats] = useState(initial?.seats ?? EMPTY_SEATS)
  const [connected, setConnected] = useState(true)
  const [busy, setBusy] = useState(false)

  const version = useRef(initial?.room.version ?? -1)
  const clockOffset = useRef(initial ? initial.serverTime - Date.now() : 0)
  const busyRef = useRef(false)
  const exitRef = useRef(onExit)
  useEffect(() => {
    exitRef.current = onExit
  }, [onExit])

  const adopt = useCallback((next: PublicRoom) => {
    if (next.version <= version.current) return
    version.current = next.version
    setRoom(next)
  }, [])

  useEffect(() => {
    let stopped = false
    let inFlight = false
    let timer: ReturnType<typeof setTimeout> | undefined

    const schedule = (delay: number) => {
      clearTimeout(timer)
      timer = setTimeout(tick, delay)
    }

    async function tick() {
      if (stopped || inFlight) return
      if (document.visibilityState === "hidden") return schedule(POLL_INTERVAL_MS)
      inFlight = true
      const sentAt = Date.now()
      try {
        const poll = await api.pollRoom(roomId, token, version.current)
        if (stopped) return
        clockOffset.current = poll.serverTime - (sentAt + Date.now()) / 2
        if (poll.seat === null) return exitRef.current("你的座位已失效，请重新加入")
        if (poll.room) adopt(poll.room)
        setSeats(poll.seats)
        setConnected(true)
        schedule(POLL_INTERVAL_MS)
      } catch (error) {
        if (stopped) return
        if (error instanceof ApiError && error.status === 404) return exitRef.current(error.message)
        setConnected(false)
        schedule(OFFLINE_RETRY_MS)
      } finally {
        inFlight = false
      }
    }

    const onVisible = () => {
      if (document.visibilityState === "visible") void tick()
    }
    void tick()
    document.addEventListener("visibilitychange", onVisible)
    return () => {
      stopped = true
      clearTimeout(timer)
      document.removeEventListener("visibilitychange", onVisible)
    }
  }, [roomId, token, adopt])

  const dispatch = useCallback(
    async (action: GameAction) => {
      if (busyRef.current) return false
      busyRef.current = true
      setBusy(true)
      try {
        const result = await api.act(roomId, token, version.current, action)
        adopt(result.room)
        setSeats(result.seats)
        return true
      } catch (error) {
        const apiError = error instanceof ApiError ? error : new ApiError(0, "操作失败，请重试")
        if (apiError.room) adopt(apiError.room)
        if (apiError.status === 404 || apiError.status === 403) exitRef.current(apiError.message)
        else toast(apiError.message, "error")
        return false
      } finally {
        busyRef.current = false
        setBusy(false)
      }
    },
    [roomId, token, adopt],
  )

  const now = useCallback(() => Date.now() + clockOffset.current, [])
  const leave = useCallback(() => exitRef.current(), [])

  return useMemo(
    () =>
      room && {
        mode: "online",
        roomId,
        config: room.config,
        state: room.state,
        mySeat: seat,
        seats,
        connected,
        busy,
        now,
        dispatch,
        leave,
      },
    [room, roomId, seat, seats, connected, busy, now, dispatch, leave],
  )
}
