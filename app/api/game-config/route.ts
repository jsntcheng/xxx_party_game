import { NextResponse } from "next/server"
import { defaultGameConfig } from "@/lib/game-data"
import { getDefaultConfig } from "@/lib/db"

export async function GET() {
  try {
    // 从数据库获取默认配置
    const config = await getDefaultConfig()
    return NextResponse.json(config)
  } catch (error) {
    console.error("获取配置失败:", error)
    // 如果数据库读取失败，返回代码中的默认配置
    return NextResponse.json(defaultGameConfig)
  }
}

export async function POST(request: Request) {
  try {
    const config = await request.json()
    // 注意：这里只是临时保存到内存，房间配置由 game-sync 处理
    // 如果需要保存为默认配置，应该使用 /api/default-config 并提供密码
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "保存失败" }, { status: 500 })
  }
}
