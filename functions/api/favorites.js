/**
 * /api/favorites —— 列表读 + 新增写
 *
 * GET  公开：返回收藏列表，按创建时间倒序。单条查询，无 N+1。
 * POST 密码保护：新增收藏，管理密码通过请求头 x-fav-key 携带。
 *
 * 单条收藏的编辑 / 删除见 [id].js，站点信息抓取见 ../preview.js（/api/preview）。
 * 共享的鉴权 / 校验 / 行转换逻辑在 functions/_lib.js。
 */

import {
  fail,
  ok,
  isUniqueUrlError,
  nowUtcString,
  readJsonBody,
  requireWriteAuth,
  toPublic,
  validateFields,
} from '../_lib.js';

export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const rawLimit = parseInt(url.searchParams.get('limit'), 10);
  const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 1000) : 500;

  const { results } = await context.env.DB
    .prepare('SELECT * FROM favorites ORDER BY created_at DESC, id DESC LIMIT ?')
    .bind(limit)
    .all();

  return ok(results.map(toPublic));
}

export async function onRequestPost(context) {
  const { request, env } = context;

  const authFailure = requireWriteAuth(request, env);
  if (authFailure) return authFailure;

  const body = await readJsonBody(request);
  if (!body) return fail(400, '请求体不是合法的 JSON');

  const check = validateFields(body);
  if (check.error) return fail(400, check.error);
  const { fields } = check;

  try {
    const { meta } = await env.DB
      .prepare(
        'INSERT INTO favorites (title, url, icon, description, tags, content) VALUES (?, ?, ?, ?, ?, ?)'
      )
      .bind(fields.title, fields.url, fields.icon, fields.description, fields.tags, fields.content)
      .run();

    return ok(
      {
        id: meta.last_row_id,
        title: fields.title,
        url: fields.url,
        icon: fields.icon,
        description: fields.description,
        tags: fields.rawTags,
        content: fields.content,
        createdAt: nowUtcString(),
        updatedAt: nowUtcString(),
      },
      201
    );
  } catch (err) {
    if (isUniqueUrlError(err)) {
      return fail(409, '该链接已经收藏过了');
    }
    console.error('favorites insert failed:', err);
    return fail(500, '数据库写入失败，请稍后再试');
  }
}
