# 收藏集网站

一个简洁美观的收藏展示网站，运行在 **Cloudflare Pages** 上：前端是纯 HTML + 原生 JS，后端是 Pages Functions，数据存在 Cloudflare D1。表单直接提交、即时生效，不再经过 GitHub Issue 转一圈。

## ✨ 功能特性

- 📱 **响应式设计** - 桌面侧边标签栏，移动端抽屉式导航
- 🔍 **实时搜索** - 按标题、描述、链接、标签查找
- 🏷️ **标签筛选** - 侧栏多选 + 计数徽章 + 筛选 chips
- 🔀 **双视图** - 卡片网格 / 紧凑列表，偏好本地记忆
- 📋 **详情抽屉** - 侧滑面板展示 Markdown 详情、复制链接、直达访问
- 🌓 **主题切换** - 亮色/暗色模式，跟随记忆
- 📝 **Markdown 支持** - 详细内容用 Markdown 编写（先转义再渲染，杜绝 XSS）
- ✍️ **表单直提交** - 填完即入库，无需跳转 GitHub
- ✂️ **编辑 / 删除** - 详情抽屉里直接改；删除有两步确认
- 🤖 **链接自动填充** - 输入网址自动抓取标题/描述/图标（支持 gbk 等中文站编码）
- 🔑 **密码保护写入** - 管理密码存 Cloudflare Secret；顶栏 🔒 随时解锁管理（编辑/删除/自动填充都需要），验证一次存本机 localStorage
- 🚀 **零依赖前端** - 无框架、无构建步骤

## 🏗️ 架构

```
浏览器
  │  GET  /api/favorites                （公开，拉取列表）
  │  POST /api/favorites  x-fav-key: …  （密码，新增收藏）
  ▼
Cloudflare Pages
  ├── 静态资源：index.html / styles.css / app.js
  └── functions/api/favorites.js      ← Pages Functions（校验 + 参数化写入）
        ▼
      Cloudflare D1（binding: DB，favorites 表）
```

新增收藏的完整链路：表单填写 → POST 校验（URL 合法性、长度、标签格式）→ D1 参数化 INSERT → 新条目直接插到列表最前面，全程不刷新页面。

## 📡 API

| 方法 | 路径 | 鉴权 | 说明 |
|---|---|---|---|
| GET | `/api/favorites` | 无 | 列表，`created_at` 倒序。可选 `?limit=`（1–1000，默认 500） |
| POST | `/api/favorites` | `x-fav-key` 请求头 = `FAV_PASSWORD` | 新增收藏。JSON body：`{title, url, icon?, description?, tags?, content?}` |
| PUT | `/api/favorites/:id` | 密码 | 全量更新，body 同 POST，返回更新后的完整记录 |
| DELETE | `/api/favorites/:id` | 密码 | 删除单条 |
| GET | `/api/preview?url=` | 密码 | 抓取目标站点的标题/描述/图标，供表单自动填充。只读 `<head>` 附近字节、自动识别 gbk 等编码、拒绝内网地址、8 秒超时 |
| GET | `/api/auth` | 密码 | 校验管理密码（前端「解锁管理」用），正确返回 200 |

响应统一为 `{success, data}` 或 `{success: false, error}`。错误码：

| 状态码 | 场景 |
|---|---|
| 400 | 校验失败（error 里有具体原因） |
| 403 | 密码错误或缺失 |
| 404 | 收藏不存在（可能已被删除） |
| 409 | 该链接已收藏过（url 唯一索引） |
| 500 | 数据库写入失败 |
| 502/504 | 抓取目标站点失败/超时 |
| 503 | 服务端未设置 `FAV_PASSWORD`（fail closed，不会静默放开写入） |

服务端校验规则：`title` 必填 ≤120 字；`url` 必填、合法 http(s) URL ≤2048 字；`icon` 可选（emoji 或图片 URL）；`description` ≤300 字；`tags` 可选，数组或逗号分隔，≤20 个；`content` 可选 Markdown ≤20000 字。

所有 SQL 均为参数化查询（`prepare().bind()`），用户输入永不拼进 SQL 文本。

## 📦 数据结构

```json
{
  "id": 1,
  "title": "食用手册",
  "url": "https://cook.yunyoujun.cn/",
  "icon": "🍳",
  "description": "美食烹饪指南",
  "tags": ["美食", "料理", "生活"],
  "content": "# Markdown 详细内容…",
  "createdAt": "2026-11-06 12:00:00"
}
```

`tags` 在数据库里是 JSON 字符串（单表设计，读列表只查一次，无 N+1）；接口层解析回数组。

## 🚀 本地开发

需要 Node.js 18+。

```bash
npm install                     # 安装 wrangler
cp .dev.vars.example .dev.vars  # 本地管理密码（默认 dev）
npm run db:init:local           # 建表（本地 D1）
npm run seed:local              # 可选：导入历史数据
npm run dev                     # http://localhost:8788
```

打开页面密码填 `dev` 即可提交。

## ☁️ 部署到 Cloudflare

完整步骤（创建 D1、绑定、设密码、自定义域名）见 **[SETUP.md](SETUP.md)**。核心配置：

- `wrangler.toml`：Pages 项目名须与 `name` 一致，D1 绑定自动生效
- `FAV_PASSWORD`：Cloudflare Secret，写入接口的密码
- `migrations/0001_init.sql`：建表 SQL，也可在 D1 控制台直接粘贴执行

## 📁 项目结构

```
.
├── index.html               # 主页面（表单 + 列表容器）
├── styles.css               # 样式（CSS 变量主题）
├── app.js                   # 前端逻辑（拉取/渲染/提交/XSS 转义）
├── functions/
│   └── api/favorites.js     # Pages Functions：GET 列表 + POST 新增
├── migrations/
│   ├── 0001_init.sql        # 建表 SQL
│   └── seed.sql             # 历史 data.js 数据（由生成器产出，勿手改）
├── scripts/
│   └── generate-seed.mjs    # data.js → seed.sql 迁移工具
├── wrangler.toml            # Pages + D1 绑定配置
└── SETUP.md                 # 从零部署到 Cloudflare 的步骤
```

## 📄 许可证

MIT License
