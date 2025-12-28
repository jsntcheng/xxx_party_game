<div align="center">

# 🎲 情侣飞行棋

**一款浪漫有趣的双人飞行棋游戏，专为情侣设计**

支持多端同步 · 自定义任务 · 性别专属内容

---

[开始游戏](#快速开始) · [功能特点](#功能特点) · [部署指南](#部署指南) · [配置说明](#配置说明) · [自定义指南](#自定义指南)

</div>

---

## 功能特点

### 🎮 丰富的游戏玩法
- **多种格子类型** - 真心话、大冒险、亲亲、抱抱、前进、后退等
- **性别专属任务** - 可为男生/女生配置不同的专属任务
- **任务换一换** - 普通格子支持更换为性别专属任务（每格限一次）
- **特殊格子** - 自定义固定位置的特殊事件

### 👫 双人游戏模式
- **在线对战** - 创建房间，分享房间号，异地也能一起玩
- **本地双人** - 两人共用一台设备，面对面游戏
- **等待房间** - 房主创建后等待对方加入，双方就绪后开始

### ⚙️ 高度可定制
- **自定义格子内容** - 编辑各类格子的任务内容
- **性别专属配置** - 分别配置男生任务和女生任务
- **特殊位置设定** - 设置特殊格子的固定位置
- **终点奖励** - 自定义到达终点的奖励内容
- **配置导入导出** - 保存和分享你的游戏配置
- **默认配置管理** - 管理员可设置服务器默认配置

### 🕐 实用工具
- **游戏计时器** - 支持 30秒/1分钟/2分钟/10分钟 快速选择
- **自定义计时** - 可输入任意秒数
- **计时器同步** - 在线模式下计时器状态同步

### 📱 全平台适配
- **响应式设计** - 完美适配手机和电脑
- **触屏优化** - 移动端操作流畅

---

## 快速开始

### 本地游戏（无需配置）

直接访问游戏页面，选择「本地双人游戏」即可开始。

### 在线联机

1. **创建房间** - 选择性别，点击「创建房间」
2. **分享房间号** - 将 6 位房间号发送给对方
3. **等待加入** - 对方输入房间号加入
4. **开始游戏** - 双方就绪后自动开始

---

## 部署指南

### 1. 安装 Node.js

推荐使用 Node.js 18 或更高版本。

**Windows:**
\`\`\`bash
# 下载安装包
# 访问 https://nodejs.org/ 下载 LTS 版本并安装

# 或使用 winget
winget install OpenJS.NodeJS.LTS
\`\`\`

**macOS:**
\`\`\`bash
# 使用 Homebrew
brew install node@22
\`\`\`

**Linux (Ubuntu/Debian):**
\`\`\`bash
# 使用 NodeSource
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs
\`\`\`

验证安装：
\`\`\`bash
node -v  # 应显示 v22.x.x 或更高
npm -v   # 应显示 npm 版本
\`\`\`

### 2. 安装 pnpm

\`\`\`bash
# 使用 npm 安装 pnpm
npm install -g pnpm

# 验证安装
pnpm -v
\`\`\`

### 3. 设置镜像源（国内用户推荐）

\`\`\`bash
# 设置 npm 镜像
npm config set registry https://registry.npmmirror.com

# 设置 pnpm 镜像
pnpm config set registry https://registry.npmmirror.com

# 验证镜像设置
pnpm config get registry
\`\`\`

### 4. 克隆并安装项目

\`\`\`bash
# 克隆项目
git clone https://github.com/jsntcheng/xxx_party_game.git
cd xxx-party-game

# 安装依赖
pnpm install
\`\`\`

### 5. 配置环境变量

\`\`\`bash
# 复制环境变量模板
cp .env.example .env.local

# 编辑配置文件
# Windows: notepad .env.local
# macOS/Linux: nano .env.local
\`\`\`

根据需要配置以下变量（参见 [配置说明](#配置说明)）：
- `DATABASE_URL` - 数据库连接(可选)
- `ADMIN_PASSWORD` - 管理员密码(可选)
- `ROOM_EXPIRY_HOURS` - 房间过期时限(可选)

### 6. 启动项目

**开发模式：**
\`\`\`bash
pnpm dev
\`\`\`
访问 http://localhost:3000

**生产模式：**
\`\`\`bash
# 构建项目
pnpm build

# 启动服务
pnpm start
\`\`\`

**指定端口启动：**
\`\`\`bash
# 开发模式指定端口
pnpm dev -p 8080

# 生产模式指定端口
PORT=8080 pnpm start
\`\`\`

### 7. 使用 PM2 后台运行（可选）

\`\`\`bash
# 安装 PM2
pnpm add -g pm2

# 构建项目
pnpm build

# 启动服务
pm2 start npm --name "couple-game" -- start

# 查看状态
pm2 status

# 查看日志
pm2 logs couple-game

# 开机自启
pm2 startup
pm2 save
\`\`\`

---

## 配置说明

### 环境变量

在项目根目录创建 `.env.local` 文件：

\`\`\`env
# 数据库配置（可选，不配置则使用本地 JSON 文件存储）
DATABASE_URL=mysql://用户名:密码@主机:端口/数据库名

# 管理员密码（用于保存默认配置）
ADMIN_PASSWORD=your_admin_password

# 房间过期时限（小时，默认 24）
ROOM_EXPIRY_HOURS=24
\`\`\`

### 存储方式

| 配置方式 | 存储位置 | 适用场景 |
|---------|---------|---------|
| 无 DATABASE_URL | `data/rooms.json` | 本地开发、单机部署 |
| 有 DATABASE_URL | MySQL 数据库 | 生产环境、多实例部署 |

### 数据库初始化

如使用 MySQL，应用启动时会自动创建所需表，无需手动执行 SQL。

---

## 自定义指南

点击游戏界面的「自定义」按钮进入配置：

### 基础设置
- **棋盘大小** - 设置游戏格子总数
- **终点奖励** - 编辑到达终点的奖励内容

### 格子内容
- **普通格子** - 真心话、大冒险等随机内容
- **男生任务** - 男生专属的任务内容
- **女生任务** - 女生专属的任务内容

### 位置设定
- 为特殊格子类型指定固定位置
- 支持前进、后退、亲亲、抱抱等类型

### 导入导出
- **导出配置** - 复制当前配置 JSON
- **导入配置** - 可选择导入到当前房间或默认配置
- **默认配置** - 需要管理员密码验证

---

## 技术栈

- **框架** - Next.js 15 (App Router)
- **语言** - TypeScript
- **样式** - Tailwind CSS
- **数据库** - MySQL / JSON 文件
- **部署** - Vercel / 自托管

---

## 常见问题

### Q: 启动时报错 "Module not found"
\`\`\`bash
# 删除依赖重新安装
rm -rf node_modules pnpm-lock.yaml
pnpm install
\`\`\`

### Q: 端口被占用
\`\`\`bash
# 使用其他端口
pnpm dev -p 3001
\`\`\`

### Q: 国内安装依赖很慢
确保已设置镜像源，参考 [设置镜像源](#3-设置镜像源国内用户推荐)

### Q: 数据库连接失败
- 检查 `DATABASE_URL` 格式是否正确
- 确保 MySQL 服务已启动
- 检查数据库用户权限

---

## 开源协议

MIT License

---

<div align="center">

**用心制作，为爱加码** 💕

</div>
