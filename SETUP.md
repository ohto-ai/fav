# 从零部署到 Cloudflare（首次迁移指南）

本仓库原来是 GitHub Pages + GitHub Issue 自动化，现在改为 **Cloudflare Pages + Functions + D1**。本文写的是第一次搭建的完整流程，照着做大约需要 15 分钟。

> 迁移期间的顺序建议：先把下面 1–5 步做完（网站在 `<项目名>.pages.dev` 上可用），再切域名（第 6 步）。域名没切走之前，GitHub Pages 上的旧站继续显示最后一次部署的静态内容，不受影响。

## 0. 前置条件

- Cloudflare 账号（免费版即可，D1 / Pages / Functions 都在免费额度内）
- 本仓库已推送到 GitHub
- 本机装 Node.js 18+，然后 `npm install`（装 wrangler）并 `npx wrangler login` 登录一次

## 1. 创建 D1 数据库

```bash
npx wrangler d1 create fav
```

输出里有一行 `database_id = "xxxx-…"`，把它填进 `wrangler.toml`，替换掉 `00000000-…` 占位值。

## 2. 建表 + 导入历史数据

```bash
npm run db:init:remote   # 执行 migrations/0001_init.sql，创建 favorites 表
npm run seed:remote      # 可选：把旧 data.js 里的 17 条收藏导进去（migrations/seed.sql）
```

两条命令都可重复执行，不会插重（建表 `IF NOT EXISTS`，种子数据 `INSERT OR IGNORE` + url 唯一索引）。

> 不想用命令行也可以：Cloudflare Dashboard → Storage & Databases → D1 → `fav` → Console，把 `migrations/0001_init.sql` 的内容整段粘贴执行；`seed.sql` 同理。

## 3. 创建 Pages 项目

Dashboard → Workers & Pages → Create → Pages → **Connect to Git**：

1. 选择本仓库（`ohto-ai/fav`）
2. **项目名设为 `fav`** —— 必须与 `wrangler.toml` 里的 `name` 一致，构建时 D1 绑定才会自动生效
3. Production branch：`master`
4. Build command：**留空**；Build output directory：**`/`**（仓库根目录就是产物，没有构建步骤）
5. Save and Deploy

第一次部署后 Functions 就已在运行，但此时还没有 D1 绑定和密码，所以页面会显示「加载失败」、接口返回 503 —— 正常，继续下面两步。

> 如果部署日志提示 wrangler.toml 被忽略（项目名不一致），去 Pages 项目 → Settings → Functions → **D1 database bindings** 手动添加：变量名 `DB`，选择 `fav` 数据库。改完在 Deployments 里 Retry deployment。

## 4. 绑定 D1（wrangler.toml 已自动，可跳过）

项目名与 `wrangler.toml` 的 `name` 一致时，这一步是自动的，无需任何操作。代码里通过 `env.DB` 访问（见 `functions/api/favorites.js`）。

确认方法：Settings → Bindings 里能看到 `DB → D1 → fav`。

## 5. 设置管理密码（FAV_PASSWORD）

```bash
npx wrangler pages secret put FAV_PASSWORD --project-name fav
```

按提示输入你的密码（会写进 Cloudflare Secret，不进代码、不进仓库）。

设完密码，写入接口从 503 变为可用 —— 这是**故意的 fail closed**：没设密码时任何人（包括你自己）都写不进，避免「忘了配密码 = 谁都能写」。

> 密码的使用方式与 picbed 相同：网页表单里填一次，浏览器会话内记住（关标签页清除），通过 `x-fav-key` 请求头随每次提交发送。前端代码里不存在密码。

## 6. 自定义域名

Pages 项目 → **Custom domains** → Set up a custom domain → 填 `fav.ohtoai.top`：

- `ohtoai.top` 的 DNS 已在 Cloudflare 的话，按提示让 Pages 自动添加/改写 CNAME 记录即可（会自动替换掉原来指向 `ohto-ai.github.io` 的那条）；
- 证书签发需要几分钟。之后 `https://fav.ohtoai.top` 就由 Cloudflare Pages 提供服务了。

GitHub Pages 这边不需要再做任何操作：仓库里的 `deploy.yml` 和 `CNAME` 已在本次改造中删除，gh-pages 分支只是历史遗留。

## 7. 验证清单

| 检查项 | 期望结果 |
|---|---|
| 打开 `https://fav.ohtoai.top`（或 `<项目名>.pages.dev`） | 列表正常渲染（如果导入了种子数据应有 17 条） |
| 浏览器直接访问 `/api/favorites` | 返回 `{"success":true,"data":[…]}` |
| 表单提交：正确密码 | 提示成功，新条目出现在列表最前面 |
| 表单提交：错误密码 | 红色提示「管理密码错误」 |
| 重复提交同一条 URL | 提示「这条链接已经收藏过了」 |
| 标题填 `<img src=x onerror=alert(1)>` | 卡片上显示为纯文本，无弹窗（XSS 转义生效） |

命令行验证（替换密码）：

```bash
# 列表（公开）
curl -s https://fav.ohtoai.top/api/favorites | head -c 300

# 新增（需要密码）
curl -s -X POST https://fav.ohtoai.top/api/favorites \
  -H "Content-Type: application/json" \
  -H "x-fav-key: 你的密码" \
  -d '{"title":"测试","url":"https://example.com"}'

# 错误密码 → 403
curl -s -o /dev/null -w "%{http_code}\n" -X POST https://fav.ohtoai.top/api/favorites \
  -H "x-fav-key: wrong" -H "Content-Type: application/json" \
  -d '{"title":"x","url":"https://example.com"}'
```

## 常见问题

| 现象 | 原因与处理 |
|---|---|
| 页面显示「收藏列表加载失败」 | Functions 没跑起来或没绑定 D1：检查项目名是否为 `fav`、Bindings 里有没有 `DB`；没有就按第 3 步的提示手动加 |
| 提交返回 503 | 没设 `FAV_PASSWORD`，回到第 5 步 |
| 提交一直 403 | 密码不对；或你在 dashboard 改过密码而浏览器还存着旧密码（关掉标签页重开即可） |
| `npm run db:init:remote` 报找不到数据库 | `wrangler.toml` 里的 `database_id` 还没替换成第 1 步的真实值 |
| 本地 `npm run dev` 正常、线上 503 | Secret 只配在本地 `.dev.vars` 了；线上要单独执行第 5 步 |

## 日常使用

- **新增**：网站右上角「➕ 新增收藏」→ 填表 → 提交，即时生效
- **改/删**：暂无界面。D1 控制台（Dashboard → D1 → fav → Console）执行 SQL，例如：
  ```sql
  DELETE FROM favorites WHERE id = 42;
  ```
  刷新页面即生效（列表每次加载都拉最新数据，无缓存层）
- **备份**：`npx wrangler d1 export fav --remote --output=backup.sql`
