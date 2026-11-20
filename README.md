<div align="center">

# 🎲 情侣飞行棋

**专为情侣设计的双人飞行棋：真心话 · 大冒险 · 亲亲抱抱**

两台手机实时联机 · 一台设备同屏游玩 · 任务、棋盘、场景卡全部可自定义

</div>

---

## 功能

- **两种玩法**
  - **联机**：创建房间，把 6 位房间号或邀请链接发给 TA，双方各用自己的手机，实时同步
  - **同屏**：一台设备轮流操作，不依赖网络，进度保存在浏览器里
- **丰富的格子**：甜蜜任务、真心话、大冒险、亲亲、抱抱、惩罚、奖励，以及前进 / 后退 / 回到起点 / 停一轮 / 再掷一次 / 交换位置等效果格，终点前还有「终点冲刺」区
- **按性别抽任务**：甜蜜任务格落到时才抽，范围是「普通」里适合自己的任务加上自己的专属任务，不满意可以「换一个」（每格一次）；其他格子落到只适合异性的任务会自动换成适合自己的
- **场景卡**：开局从每个卡池各抽一张，整局生效
- **共享计时器**：预设 30 秒 / 1 分 / 2 分 / 10 分，也可以自定秒数，联机时双方看到同一个倒计时，最后 5 秒有提示音
- **自定义**：任务内容、棋盘长度、固定位置、终点奖励、场景卡都能编辑；配置可以导出 / 导入 JSON（兼容旧版导出的配置），管理员可以把配置设为服务器默认
- **断线重连**：刷新页面或重新打开邀请链接会自动回到原来的座位

## 游戏规则

1. 双方轮流掷骰子（1~6）前进，落到哪格就完成哪格的任务
2. 任务完成后才结算格子效果；效果造成的移动不会触发新格子的任务
3. 「停一轮」：轮到该玩家时跳过一次，由对方继续
4. 先到达终点的一方获胜，赢家领取终点奖励

## 快速开始

需要 Node.js 20+ 与 pnpm。

```bash
pnpm install
pnpm dev          # http://localhost:3000
```

国内网络安装慢时可以临时指定镜像：`pnpm install --registry=https://registry.npmmirror.com`

生产部署：

```bash
pnpm build
pnpm start        # 默认 3000 端口，可用 PORT=8080 pnpm start 指定
```

## 配置

复制 `.env.example` 为 `.env.local` 后按需填写：

| 变量 | 说明 |
| --- | --- |
| `DATABASE_URL` | MySQL 连接串，如 `mysql://user:pass@host:3306/db`。不配置时使用 `data/rooms.json` |
| `ADMIN_PASSWORD` | 管理员密码，用于保存服务器默认配置。不配置则不允许修改默认配置 |
| `ROOM_EXPIRY_HOURS` | 房间无操作多久后清理，默认 24 |

### 存储方式怎么选

| 部署方式 | 存储 |
| --- | --- |
| 单台服务器、单进程（`pnpm start`、PM2 单实例） | JSON 文件即可 |
| Vercel 等 Serverless、PM2 cluster、多实例 | **必须**配置 MySQL（实例之间不共享内存和文件） |

使用 MySQL 时，首次访问会自动建表：`party_rooms`（房间）、`party_presence`（在线状态）、`game_config`（默认配置，与旧版同名表兼容）。

## 开发

```bash
pnpm typecheck    # TypeScript 检查
pnpm test         # 单元测试（规则引擎、配置校验、房间服务、安全）
```

### 目录结构

```
lib/game/          规则与领域模型（纯函数，前后端共用）
  types.ts         领域类型
  engine.ts        规则引擎 applyAction(snapshot, action, ctx)
  board.ts         棋盘生成、场景卡抽取、随机数
  config.ts        配置校验与旧版格式兼容 parseGameConfig
  action.ts        操作 / 玩家资料校验
  defaults.ts      内置默认配置
  meta.ts          格子类型的名称与说明
lib/server/        服务端
  rooms.ts         房间服务：鉴权 → 版本校验 → 规则引擎 → CAS 写入
  store/           存储（JSON 文件 / MySQL）
  http.ts          统一错误处理与响应
  security.ts      管理员密码校验（常量时间比较）
lib/client/        浏览器端：接口封装、本地存储、GameController 接口
hooks/             联机轮询、同屏对局、棋子动画
components/        界面（大厅、棋盘、弹窗、配置编辑器）
app/api/           接口路由
tests/             单元测试
```

### 同步模型

- 服务端是唯一权威：客户端只提交操作（掷骰、完成任务……），由服务端执行规则、生成随机数
- 每个房间有递增的 `version`；客户端提交时带上 `baseVersion`，不一致返回 409 并附最新状态，写入使用 CAS 防止并发覆盖
- 客户端每秒轮询一次，版本没变时只返回在线状态；页面隐藏时暂停轮询
- 每个座位有独立 token（保存在浏览器），只有本人能操作自己的回合

### 接口

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/config` | 获取默认配置 |
| POST | `/api/config` | 保存默认配置 `{ password, config }` |
| POST | `/api/rooms` | 创建房间 `{ name, gender }` |
| POST | `/api/rooms/:id/join` | 加入 / 重连房间 |
| GET | `/api/rooms/:id?since=版本` | 轮询房间 |
| POST | `/api/rooms/:id/actions` | 提交操作 `{ baseVersion, action }` |

房间相关请求通过 `x-seat-token` 头携带座位 token。

## 技术栈

Next.js 16（App Router）· React 19 · TypeScript · Tailwind CSS 4 · Radix UI · Framer Motion · MySQL / JSON 文件 · Vitest
