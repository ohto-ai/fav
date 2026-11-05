/**
 * /api/favorites/preview?url=… —— 抓取目标站点的元信息（标题 / 描述 / 图标）
 *
 * 供表单在输入链接后自动填充。需要管理密码：这本质是一个服务端代理，
 * 开放给任何人就等于给了别人一个借我们出口抓站点的通道。
 *
 * 只读取 <head> 附近的少量字节（提前断流），只返回元信息，不转发页面内容；
 * 拒绝内网地址；8 秒超时。
 */

import { fail, ok, requireWriteAuth } from '../_lib.js';

const FETCH_TIMEOUT_MS = 8000;
const MAX_BYTES = 262144; // 元信息都在 <head> 里，读 256KB 足够

const REQUEST_HEADERS = {
  // 部分站点会拒绝无 UA / 陌生 UA 的请求；带上浏览器样式 UA + Referer 提高命中率
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.5',
};

export async function onRequestGet(context) {
  const { request, env } = context;

  const authFailure = requireWriteAuth(request, env);
  if (authFailure) return authFailure;

  const requestUrl = new URL(request.url);
  const rawUrl = (requestUrl.searchParams.get('url') || '').trim();
  if (!rawUrl) return fail(400, '缺少 url 参数');

  let target;
  try {
    target = new URL(rawUrl);
  } catch {
    return fail(400, '链接格式不正确');
  }
  if (target.protocol !== 'http:' && target.protocol !== 'https:') {
    return fail(400, '只支持 http/https 链接');
  }
  if (isPrivateHost(target.hostname)) {
    return fail(400, '不抓取内网地址');
  }

  let response;
  try {
    response = await fetch(target.href, {
      method: 'GET',
      headers: REQUEST_HEADERS,
      redirect: 'follow',
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
  } catch (err) {
    const timedOut = err && (err.name === 'TimeoutError' || String(err.message).includes('abort'));
    return fail(timedOut ? 504 : 502, timedOut ? '获取站点信息超时' : '无法访问该站点');
  }

  if (!response.ok && !response.body) {
    return fail(502, `目标站点返回 ${response.status}`);
  }

  const bytes = await readHead(response);
  const html = decodeBody(bytes, response.headers.get('content-type') || '');
  const meta = extractMeta(html, response.url || target.href);

  return ok(meta);
}

/** 内网 / 环回地址不抓取 */
function isPrivateHost(hostname) {
  const host = String(hostname || '').toLowerCase().replace(/^\[|\]$/g, '');
  return (
    host === 'localhost' ||
    host === '::1' ||
    host.endsWith('.local') ||
    host.endsWith('.internal') ||
    /^127\./.test(host) ||
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^169\.254\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host) ||
    /^0\./.test(host) ||
    /^(fc|fd)[0-9a-f]{2}:/.test(host) ||
    /^fe[89ab][0-9a-f]:/.test(host)
  );
}

/** 读取响应的前 MAX_BYTES 字节；一旦见到 </head> 或 <body> 提前收工并断流 */
async function readHead(response) {
  if (!response.body) return new Uint8Array();
  const reader = response.body.getReader();
  const chunks = [];
  let received = 0;
  try {
    while (received < MAX_BYTES) {
      const { done, value } = await reader.read();
      if (done || !value) break;
      chunks.push(value);
      received += value.length;
      const probe = new TextDecoder('utf-8', { fatal: false }).decode(
        concatChunks(chunks, received)
      );
      if (/<\/head\s*>|<body[\s>]/i.test(probe)) break;
    }
  } catch {
    // 读不动就用手上已有的部分，元信息通常在前几 KB
  } finally {
    try {
      await reader.cancel();
    } catch {
      // 连接可能已经自行结束
    }
  }
  return concatChunks(chunks, received);
}

function concatChunks(chunks, total) {
  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  return out;
}

/** 按 Content-Type / <meta charset> 解码；中文站常见的 gbk/gb2312 走 gb18030 */
function decodeBody(bytes, contentType) {
  if (!bytes.length) return '';
  let charset = '';
  const headerMatch = String(contentType).match(/charset=([\w-]+)/i);
  if (headerMatch) charset = headerMatch[1].toLowerCase();
  if (!charset) {
    const head = new TextDecoder('utf-8', { fatal: false }).decode(bytes.slice(0, 2048));
    const metaMatch =
      head.match(/charset\s*=\s*["']?([\w-]+)/i) || head.match(/<\?xml[^>]+encoding=["']([\w-]+)["']/i);
    if (metaMatch) charset = metaMatch[1].toLowerCase();
  }
  if (!charset || /^utf-?8$/.test(charset)) {
    return new TextDecoder('utf-8', { fatal: false }).decode(bytes);
  }
  try {
    return new TextDecoder(charset, { fatal: false }).decode(bytes);
  } catch {
    return new TextDecoder('utf-8', { fatal: false }).decode(bytes);
  }
}

/** 从 HTML 提取标题 / 描述 / 图标 */
function extractMeta(html, pageUrl) {
  const metas = html.match(/<meta\s+[^>]*>/gi) || [];
  const links = html.match(/<link\s+[^>]*>/gi) || [];

  const metaContent = (key) => {
    const keyPattern = new RegExp(`(?:property|name)=["']${key}["']`, 'i');
    for (const tag of metas) {
      if (!keyPattern.test(tag)) continue;
      const m = tag.match(/content=["']([^"']*)["']/i);
      if (m && m[1]) return clean(m[1]);
    }
    return '';
  };

  const clean = (value) =>
    decodeEntities(String(value)).replace(/\s+/g, ' ').trim();

  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title =
    metaContent('og:title') ||
    metaContent('twitter:title') ||
    (titleMatch ? clean(titleMatch[1]) : '');

  const description =
    metaContent('og:description') ||
    metaContent('twitter:description') ||
    metaContent('description');

  const icon = pickIcon(links, pageUrl);

  return {
    title: title.slice(0, 120),
    description: description.slice(0, 300),
    icon: icon.slice(0, 512),
  };
}

/** favicon 优先级：apple-touch-icon（大而清晰）> shortcut icon > icon > 默认 /favicon.ico */
function pickIcon(links, pageUrl) {
  const candidates = [];
  for (const tag of links) {
    const relMatch = tag.match(/rel=["']([^"']*)["']/i);
    const hrefMatch = tag.match(/href=["']([^"']*)["']/i);
    if (!relMatch || !hrefMatch || !hrefMatch[1]) continue;
    const rel = relMatch[1].toLowerCase();
    if (!/icon/.test(rel) || /mask-icon/.test(rel)) continue;
    candidates.push({
      rel,
      href: hrefMatch[1],
      sizes: (tag.match(/sizes=["']([^"']*)["']/i) || ['', ''])[1],
    });
  }
  const pick = (filter) => {
    const found = candidates.find(filter);
    if (!found) return '';
    try {
      return new URL(found.href, pageUrl).href;
    } catch {
      return '';
    }
  };
  return (
    pick((c) => /apple-touch-icon/.test(c.rel)) ||
    pick((c) => /shortcut\s+icon/.test(c.rel)) ||
    pick((c) => /(^|\s)icon(\s|$)/.test(c.rel)) ||
    (() => {
      try {
        return new URL('/favicon.ico', pageUrl).href;
      } catch {
        return '';
      }
    })()
  );
}

/** 最小 HTML 实体解码（&amp; &#39; &#x27; &nbsp; 等常见形式） */
function decodeEntities(value) {
  return value.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z][a-zA-Z0-9]*);/g, (whole, code) => {
    if (code[0] === '#') {
      const num = /^#x/i.test(code)
        ? parseInt(code.slice(2), 16)
        : parseInt(code.slice(1), 10);
      if (Number.isFinite(num) && num > 0 && num <= 0x10ffff) {
        try {
          return String.fromCodePoint(num);
        } catch {
          return whole;
        }
      }
      return whole;
    }
    const named = {
      amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
      mdash: '—', ndash: '–', hellip: '…', ldquo: '“', rdquo: '”',
      lsquo: '‘', rsquo: '’', middot: '·', copy: '©', reg: '®', trade: '™',
    };
    return named[code.toLowerCase()] || whole;
  });
}
