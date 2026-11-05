-- 收藏表 · 建表语句
--
-- 执行方式（二选一）：
--   1. 命令行：npm run db:init:local（本地）/ npm run db:init:remote（线上）
--   2. Cloudflare Dashboard → Storage & Databases → D1 → fav → Console，
--      把本文件内容整段粘贴执行
--
-- 设计说明：
--   单表 + tags 存 JSON 字符串，读列表只需一条查询（SETUP.md 有完整流程）；
--   url 上建部分唯一索引（url = '' 的旧数据不参与去重，但新提交必填 url）。

CREATE TABLE IF NOT EXISTS favorites (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    title       TEXT NOT NULL,                 -- 收藏标题
    url         TEXT NOT NULL DEFAULT '',      -- 收藏链接（新提交必填）
    icon        TEXT NOT NULL DEFAULT '🎯',    -- emoji 或图片 URL
    description TEXT NOT NULL DEFAULT '',      -- 一句话描述/备注
    tags        TEXT NOT NULL DEFAULT '[]',    -- JSON 数组字符串，如 ["工具","开发"]
    content     TEXT NOT NULL DEFAULT '',      -- Markdown 详细内容
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 同一条链接不允许收藏两次（部分索引：空 url 不占用唯一性）
CREATE UNIQUE INDEX IF NOT EXISTS idx_favorites_url
    ON favorites (url) WHERE url != '';

-- 列表按创建时间倒序取，给排序字段建索引
CREATE INDEX IF NOT EXISTS idx_favorites_created_at
    ON favorites (created_at DESC);
