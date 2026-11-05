/**
 * /api/favorites/:id —— 单条收藏的编辑与删除（都要求管理密码）
 *
 * PUT    全量更新（与 POST 相同的字段校验），一条 UPDATE ... RETURNING 完成，
 *        同时拿回更新后的完整行：行不存在返回 404，链接撞唯一索引返回 409。
 * DELETE 删除单条；meta.changes === 0 视为 404。
 */

import {
  fail,
  isUniqueUrlError,
  ok,
  readJsonBody,
  requireWriteAuth,
  toPublic,
  validateFields,
} from '../../_lib.js';

export async function onRequestPut(context) {
  const { request, env, params } = context;
  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) return fail(400, '无效的收藏 ID');

  const authFailure = requireWriteAuth(request, env);
  if (authFailure) return authFailure;

  const body = await readJsonBody(request);
  if (!body) return fail(400, '请求体不是合法的 JSON');

  const check = validateFields(body);
  if (check.error) return fail(400, check.error);
  const { fields } = check;

  try {
    const updated = await env.DB
      .prepare(
        `UPDATE favorites
         SET title = ?, url = ?, icon = ?, description = ?, tags = ?, content = ?,
             updated_at = datetime('now')
         WHERE id = ?
         RETURNING *`
      )
      .bind(fields.title, fields.url, fields.icon, fields.description, fields.tags, fields.content, id)
      .first();

    if (!updated) return fail(404, '收藏不存在（可能已被删除）');
    return ok(toPublic(updated));
  } catch (err) {
    if (isUniqueUrlError(err)) {
      return fail(409, '该链接已经收藏过了（被另一条记录占用）');
    }
    console.error('favorites update failed:', err);
    return fail(500, '数据库更新失败，请稍后再试');
  }
}

export async function onRequestDelete(context) {
  const { env, params } = context;
  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) return fail(400, '无效的收藏 ID');

  const authFailure = requireWriteAuth(context.request, env);
  if (authFailure) return authFailure;

  try {
    const { meta } = await env.DB
      .prepare('DELETE FROM favorites WHERE id = ?')
      .bind(id)
      .run();

    if (!meta.changes) return fail(404, '收藏不存在（可能已被删除）');
    return ok({ id });
  } catch (err) {
    console.error('favorites delete failed:', err);
    return fail(500, '数据库删除失败，请稍后再试');
  }
}
