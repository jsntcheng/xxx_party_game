import type { Metadata, Viewport } from "next"
import type { ReactNode } from "react"
import "./globals.css"

export const metadata: Metadata = {
  title: "情侣飞行棋 · 双人互动游戏",
  description: "两个人的心动飞行棋：真心话、大冒险、亲亲抱抱，支持双设备联机与同屏游玩，内容可自定义。",
}

export const viewport: Viewport = {
  themeColor: "#140b24",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
}

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body className="font-sans antialiased">
        <div className="app-backdrop" aria-hidden />
        {children}
      </body>
    </html>
  )
}
