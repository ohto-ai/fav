/**
 * /api/* 共享工具库。
 *
 * 文件名以 _ 开头：Cloudflare Pages Functions 的路由会忽略下划线前缀的文件，
 * 所以这个模块只被 import，不会被暴露成 /api/_lib 之类的接口。
 *
 * 鉴权模式与 picbed 一致（fail closed）：
 *   - 服务端没设 FAV_PASSWORD（Cloudflare Secret）时写接口一律 503；
 *   - 密码只存在 Cloudflare Secret 和用户浏览器 localStorage 里，前端代码不含密码。
 * 所有 SQL 都是参数化查询（prepare + bind），用户输入永不进 SQL 文本。
 */

const JSON_HEADERS = { 'Content-Type': 'application/json; charset=utf-8' };

const DEFAULT_ICON = '🎯';
const LIMITS = {
  title: 120,
  url: 2048,
  icon: 64,
  iconUrl: 512,
  description: 300,
  tagCount: 20,
  tagLength: 30,
  content: 20000,
};

function json(status, body) {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

function ok(data, status = 200) {
  return json(status, { success: true, data });
}

function fail(status, error) {
  return json(status, { success: false, error });
}

/** 恒定时间比较，避免通过耗时差异逐位猜密码 */
function timingSafeEqual(a, b) {
  const ea = new TextEncoder().encode(String(a));
  const eb = new TextEncoder().encode(String(b));
  let diff = ea.length ^ eb.length;
  const n = Math.max(ea.length, eb.length);
  for (let i = 0; i < n; i++) {
    diff |= (ea[i] || 0) ^ (eb[i] || 0);
  }
  return diff === 0;
}

/** 写接口鉴权。返回 Response 表示鉴权失败，返回 null 表示通过 */
function requireWriteAuth(request, env) {
  if (!env.FAV_PASSWORD) {
    return fail(503, '服务端未设置 FAV_PASSWORD，写接口已停用（fail closed）');
  }
  const key = request.headers.get('x-fav-key') || '';
  if (!key || !timingSafeEqual(key, env.FAV_PASSWORD)) {
    return fail(403, '管理密码错误或缺失');
  }
  return null;
}

/** 解析请求体 JSON，坏 JSON / 非对象返回 null */
async function readJsonBody(request) {
  try {
    const body = await request.json();
    return body && typeof body === 'object' ? body : null;
  } catch {
    return null;
  }
}

/** 链接：必填，可被 URL 解析且仅 http/https */
function validateUrl(raw) {
  const value = String(raw || '').trim();
  if (!value) return { error: '链接不能为空' };
  if (value.length > LIMITS.url) return { error: `链接过长（最多 ${LIMITS.url} 字符）` };
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    return { error: '链接格式不正确，需要完整的 URL（如 https://example.com）' };
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { error: '链接只支持 http:// 或 https://' };
  }
  return { value: parsed.href };
}

/** 图标：emoji/短文本，或 http(s) 图片地址；为空时用默认图标 */
function validateIcon(raw) {
  const icon = String(raw || '').trim();
  if (!icon) return { value: DEFAULT_ICON };
  if (/^https?:\/\//i.test(icon)) {
    if (icon.length > LIMITS.iconUrl) return { error: `图标 URL 过长（最多 ${LIMITS.iconUrl} 字符）` };
    return { value: icon };
  }
  if (icon.length > LIMITS.icon) return { error: `图标过长（应为 emoji，或不超过 ${LIMITS.icon} 字符的图片 URL）` };
  return { value: icon };
}

/** 标签：数组或逗号分隔字符串 → 去空、去重后的字符串数组 */
function validateTags(raw) {
  let list = [];
  if (Array.isArray(raw)) {
    list = raw.map(String);
  } else if (typeof raw === 'string') {
    list = raw.split(',');
  } else if (raw != null) {
    return { error: '标签格式不正确' };
  }
  const tags = [...new Set(list.map((t) => t.trim()).filter(Boolean))];
  if (tags.length > LIMITS.tagCount) return { error: `标签最多 ${LIMITS.tagCount} 个` };
  for (const tag of tags) {
    if (tag.length > LIMITS.tagLength) return { error: `单个标签过长（最多 ${LIMITS.tagLength} 字符）：${tag}` };
  }
  return { value: tags };
}

/** 完整校验提交体（POST/PUT 共用）。返回 {fields} 或 {error} */
function validateFields(body) {
  const title = String(body.title || '').trim();
  if (!title) return { error: '标题不能为空' };
  if (title.length > LIMITS.title) return { error: `标题过长（最多 ${LIMITS.title} 字符）` };

  const urlResult = validateUrl(body.url);
  if (urlResult.error) return { error: urlResult.error };

  const iconResult = validateIcon(body.icon);
  if (iconResult.error) return { error: iconResult.error };

  const description = String(body.description || '').trim();
  if (description.length > LIMITS.description) {
    return { error: `描述过长（最多 ${LIMITS.description} 字符）` };
  }

  const tagsResult = validateTags(body.tags);
  if (tagsResult.error) return { error: tagsResult.error };

  const content = String(body.content || '').trim();
  if (content.length > LIMITS.content) {
    return { error: `详细内容过长（最多 ${LIMITS.content} 字符）` };
  }

  return {
    fields: {
      title,
      url: urlResult.value,
      icon: iconResult.value,
      description,
      tags: JSON.stringify(tagsResult.value),
      rawTags: tagsResult.value,
      content,
    },
  };
}

/** 数据库行 → 对外 JSON（tags 解析回数组，时间字段统一 camelCase） */
function toPublic(row) {
  let tags = [];
  try {
    const parsed = JSON.parse(row.tags);
    if (Array.isArray(parsed)) tags = parsed.map(String);
  } catch {
    // 个别脏数据不挂掉整个列表
  }
  return {
    id: row.id,
    title: row.title,
    url: row.url,
    icon: row.icon,
    description: row.description,
    tags,
    content: row.content,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** 与 D1 datetime('now') 一致的 UTC 时间串：YYYY-MM-DD HH:MM:SS */
function nowUtcString() {
  return new Date().toISOString().slice(0, 19).replace('T', ' ');
}

/** UNIQUE(url) 冲突（新增/编辑成已存在的链接）→ 409 */
function isUniqueUrlError(err) {
  return String(err && err.message).includes('UNIQUE constraint failed: favorites.url');
}

export {
  DEFAULT_ICON,
  LIMITS,
  json,
  ok,
  fail,
  timingSafeEqual,
  requireWriteAuth,
  readJsonBody,
  validateUrl,
  validateIcon,
  validateTags,
  validateFields,
  toPublic,
  nowUtcString,
  isUniqueUrlError,
};
