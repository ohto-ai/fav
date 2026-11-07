/**
 * /api/preview?url=… —— 抓取目标站点的元信息（标题 / 描述 / 图标）
 *
 * 供表单在输入链接后自动填充。需要管理密码：这本质是一个服务端代理，
 * 开放给任何人就等于给了别人一个借我们出口抓站点的通道。
 *
 * 只读取 <head> 附近的少量字节（提前断流），只返回元信息，不转发页面内容；
 * 拒绝内网地址；8 秒超时。图标候选会逐个真实请求验证后才返回。
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
  const { title, description, iconCandidates, ogImage } = extractMeta(html, response.url || target.href);
  const icon = await resolveIcon(iconCandidates, response.url || target.href, ogImage);

  return ok({
    title: title.slice(0, 120),
    description: description.slice(0, 300),
    icon: icon.slice(0, 512),
  });
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

/** 从 HTML 提取标题 / 描述 / 图标候选列表 */
function extractMeta(html, pageUrl) {
  const metas = html.match(/<meta\s+[^>]*>/gi) || [];
  const links = html.match(/<link\s+[^>]*>/gi) || [];

  const metaContent = (key) => {
    const wanted = key.toLowerCase();
    for (const tag of metas) {
      const keys = getAttrValues(tag, 'property').concat(getAttrValues(tag, 'name'))
        .map((v) => v.toLowerCase());
      if (!keys.includes(wanted)) continue;
      const content = getAttrValues(tag, 'content')[0];
      if (content) return clean(content);
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

  return { title, description, iconCandidates: collectIconCandidates(links, pageUrl), ogImage: metaContent('og:image') || metaContent('twitter:image') };
}

/**
 * 读标签属性值，兼容三种写法：双引号 / 单引号 / 无引号（不少站点是
 * <link rel=icon href=/logo.ico> 这种裸写法）。同名属性出现多次时
 * 全部收集（steampy 这类站会把 rel=icon 和 rel=apple-touch-icon
 * 写在同一个 <link> 里）。
 */
function getAttrValues(tag, name) {
  const values = [];
  const re = new RegExp(
    `\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'>]+))`,
    'gi'
  );
  let m;
  while ((m = re.exec(tag))) {
    values.push(decodeEntities(m[1] ?? m[2] ?? m[3] ?? ''));
  }
  return values;
}

/**
 * 收集 HTML 里声明的图标候选，按质量打分排序（不在这里做最终决定）。
 * 打分依据：rel 类型 + sizes 声明的尺寸。apple-touch-icon 通常 180×180，
 * 在卡片的小图标框里观感最好；普通 icon 多为 16×16，往后排。
 */
function collectIconCandidates(links, pageUrl) {
  const candidates = [];
  for (const tag of links) {
    const rels = getAttrValues(tag, 'rel').map((v) => v.toLowerCase());
    if (!rels.length) continue;
    const hrefs = getAttrValues(tag, 'href');
    if (!hrefs.length || !hrefs[0]) continue;

    let score = -1; // -1 = 与图标无关的 link（stylesheet 等）
    for (const rel of rels) {
      if (/mask-icon/.test(rel)) continue;
      if (/apple-touch-icon/.test(rel)) score = Math.max(score, 300);
      else if (/(^|\s)icon(\s|$)/.test(rel)) score = Math.max(score, 100);
      else if (/shortcut/.test(rel)) score = Math.max(score, 50);
    }
    if (score < 0) continue;

    let href;
    try {
      href = new URL(hrefs[0], pageUrl).href;
    } catch {
      continue;
    }
    candidates.push({ href, score: score + parseIconSize(tag) });
  }
  return candidates.sort((a, b) => b.score - a.score).map((c) => c.href);
}

function parseIconSize(tag) {
  const m = tag.match(/sizes=["']([^"']*)["']/i);
  if (!m) return 0;
  if (/any/i.test(m[1])) return 400; // SVG 等任意尺寸，矢量放大不糊
  const size = m[1].match(/(\d+)x(\d+)/i);
  return size ? parseInt(size[1], 10) : 0;
}

/**
 * 图标最终裁决：逐个真实请求验证候选（200 且内容确实是图片才算数），
 * 全部失效再验证站点根部的 /favicon.ico，最后才考虑 og:image（分享图，
 * 裁切后当图标用是下策，但比空着强）。绝不返回没验证过的 URL——
 * 声明了但 404 的图标在卡片上就是一张裂图。
 */
async function resolveIcon(candidates, pageUrl, ogImage) {
  const tried = [];
  for (const href of candidates.slice(0, 3)) {
    if (await urlLooksLikeImage(href)) return href;
    tried.push(href);
  }
  try {
    const fallback = new URL('/favicon.ico', pageUrl).href;
    if (!tried.includes(fallback) && (await urlLooksLikeImage(fallback))) {
      return fallback;
    }
    if (ogImage) {
      const og = new URL(ogImage, pageUrl).href;
      if (!tried.includes(og) && og !== fallback && (await urlLooksLikeImage(og))) {
        return og;
      }
    }
  } catch {
    // pageUrl 异常时直接放弃图标
  }
  return '';
}

/** GET 目标图标，读到第一个数据块就断流；按 content-type / 魔数判断是否图片 */
async function urlLooksLikeImage(url) {
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: REQUEST_HEADERS,
      redirect: 'follow',
      signal: AbortSignal.timeout(3000),
    });
    if (!response.ok) return false;
    const type = (response.headers.get('content-type') || '').toLowerCase();
    if (type.startsWith('image/')) return true;
    if (!response.body) return false;
    // 个别站点用 application/octet-stream 提供图标：看魔数
    const reader = response.body.getReader();
    const { value } = await reader.read();
    try {
      await reader.cancel();
    } catch {
      // 流可能已自行结束
    }
    if (!value || value.length < 4) return false;
    const b = value;
    return (
      (b[0] === 0x00 && b[1] === 0x00 && b[2] === 0x01 && b[3] === 0x00) || // ICO
      (b[0] === 0x89 && b[1] === 0x50) || // PNG
      (b[0] === 0x47 && b[1] === 0x49) || // GIF
      (b[0] === 0xff && b[1] === 0xd8) || // JPEG
      (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46) // RIFF/WEBP
    );
  } catch {
    return false;
  }
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
