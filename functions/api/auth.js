/**
 * /api/auth —— 管理密码校验（轻量端点）
 *
 * GET 带 x-fav-key 请求头：密码正确返回 200，错误/缺失返回 403，
 * 服务端未设置 FAV_PASSWORD 返回 503（fail closed）。
 * 前端「解锁管理」对话框用它验证密码，验证通过才把密码写进 localStorage。
 */

import { ok, requireWriteAuth } from '../_lib.js';

export async function onRequestGet(context) {
  const authFailure = requireWriteAuth(context.request, context.env);
  if (authFailure) return authFailure;
  return ok({ unlocked: true });
}
