/**
 * 一次性迁移工具：读取旧的 data.js，生成 migrations/seed.sql
 *
 * 用途：把 GitHub Issue 流程时代积攒在 data.js 里的收藏，导入到 D1。
 * 运行：npm run seed:generate （需要 Node 18+）
 * 导入：npm run seed:local（本地）/ npm run seed:remote（线上）
 *
 * 老数据没有独立的 url 字段（链接藏在 content 的 Markdown 里），
 * 这里取 content 中第一个 http(s) 链接作为 url；一条都没有就留空。
 * 生成的 INSERT 用 INSERT OR IGNORE + UNIQUE(url)，重复执行不会插重。
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const dataPath = fileURLToPath(new URL('../data.js', import.meta.url));
const outPath = fileURLToPath(new URL('../migrations/seed.sql', import.meta.url));

// data.js 是「const collectionsData = [...]」的普通脚本，包一层取出数组
const source = readFileSync(dataPath, 'utf8');
const collectionsData = new Function(`${source}\n; return collectionsData;`)();

if (!Array.isArray(collectionsData)) {
  console.error('data.js 里没找到 collectionsData 数组');
  process.exit(1);
}

/** SQL 字符串字面量：单引号翻倍转义，其余内容（含换行）在引号内都是安全的 */
const sqlString = (value) => `'${String(value).replace(/'/g, "''")}'`;

/** 从 Markdown 内容里抓第一个 http(s) 链接，遇到空白或右括号即停 */
function extractUrl(content) {
  const match = String(content || '').match(/https?:\/\/[^\s)\]"'<>]+/);
  return match ? match[0] : '';
}

const rows = collectionsData.map((item) => {
  const title = String(item.title || '').trim();
  const icon = String(item.icon || '🎯').trim();
  const description = String(item.description || '').trim();
  const tags = JSON.stringify(
    Array.isArray(item.tags) ? item.tags.map((t) => String(t).trim()).filter(Boolean) : []
  );
  const content = String(item.content || '').trim();
  const url = String(item.url || '').trim() || extractUrl(content);
  return { title, url, icon, description, tags, content };
});

const header = `-- 收藏历史数据 · 由 scripts/generate-seed.mjs 从旧 data.js 生成，不要手改
-- 导入方式：npm run seed:local（本地）/ npm run seed:remote（线上）
-- 只需在空库上导入一次；重复执行安全（INSERT OR IGNORE + url 唯一索引）
`;

const statements = rows.map(
  (row) =>
    `INSERT OR IGNORE INTO favorites (title, url, icon, description, tags, content) VALUES (\n` +
    `    ${sqlString(row.title)},\n` +
    `    ${sqlString(row.url)},\n` +
    `    ${sqlString(row.icon)},\n` +
    `    ${sqlString(row.description)},\n` +
    `    ${sqlString(row.tags)},\n` +
    `    ${sqlString(row.content)}\n` +
    `);`
);

writeFileSync(outPath, `${header}\n${statements.join('\n\n')}\n`, 'utf8');

const withUrl = rows.filter((row) => row.url).length;
console.log(`已生成 migrations/seed.sql：共 ${rows.length} 条，其中 ${withUrl} 条从 content 提取到了链接`);
