// ============================================================
// 收藏集前端逻辑
// 数据来自 /api/favorites（Cloudflare Pages Functions + D1），不再打包在仓库里。
// 收藏数据来自公开写入接口，渲染前所有插值都必须经过 escapeHtml，防 XSS。
// ============================================================

const API_URL = '/api/favorites';
const PASSWORD_KEY = 'favPassword';
const VIEW_KEY = 'favView';

const state = {
    items: [],
    filtered: [],
    selectedTags: new Set(),
    search: '',
    view: localStorage.getItem(VIEW_KEY) === 'list' ? 'list' : 'grid',
    drawerId: null,
};

// ---------- 基础工具 ----------

function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (c) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[c]);
}

/** 只放行 http(s) 链接（服务端已校验，前端再挡一道 javascript: 之类） */
function isSafeUrl(url) {
    return /^https?:\/\//i.test(String(url || ''));
}

function iconHtml(icon, title) {
    const safe = escapeHtml(icon);
    if (isSafeUrl(icon)) {
        return `<img src="${safe}" alt="${escapeHtml(title)}" loading="lazy" referrerpolicy="no-referrer">`;
    }
    return safe;
}

function domainOf(url) {
    if (!isSafeUrl(url)) return '';
    try {
        return new URL(url).hostname;
    } catch {
        return '';
    }
}

/** D1 的 datetime('now') 是 UTC「YYYY-MM-DD HH:MM:SS」，转本地时间显示 */
function formatCreatedAt(value) {
    if (!value) return '';
    const date = new Date(String(value).replace(' ', 'T') + 'Z');
    if (Number.isNaN(date.getTime())) return escapeHtml(value);
    const pad = (n) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
        `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function debounce(fn, ms) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), ms);
    };
}

// ---------- Markdown 渲染（先整体转义再转换，杜绝注入） ----------

function parseMarkdown(text) {
    if (!text) return '';

    // 第一步：整体 HTML 转义。之后所有标签都是我们自己生成的，内容永远是文本。
    let src = escapeHtml(text.trim());

    // 代码块先摘出来存占位符，避免块内的 *、# 等被后续规则误伤
    const codeBlocks = [];
    src = src.replace(/```(\w*)\n?([\s\S]*?)```/g, (_, __, code) => {
        codeBlocks.push(`<pre><code>${code}</code></pre>`);
        return `\uE000CODE${codeBlocks.length - 1}\uE001`;
    });

    src = src.replace(/`([^`]+)`/g, '<code>$1</code>');
    src = src.replace(/^### (.*$)/gm, '<h3>$1</h3>');
    src = src.replace(/^## (.*$)/gm, '<h2>$1</h2>');
    src = src.replace(/^# (.*$)/gm, '<h1>$1</h1>');
    src = src.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    src = src.replace(/\*(.+?)\*/g, '<em>$1</em>');
    src = src.replace(/~~(.+?)~~/g, '<del>$1</del>');

    // 图片与链接：只接受 http(s) 地址
    const cleanUrl = (url) => url.replace(/&quot;|&#39;/g, '');
    src = src.replace(/!\[([^\]]*)\]\((https?:\/\/[^)\s]+)\)/g,
        (_, alt, url) => `<img src="${cleanUrl(url)}" alt="${alt}" loading="lazy" referrerpolicy="no-referrer">`);
    src = src.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g,
        (_, label, url) => `<a href="${cleanUrl(url)}" target="_blank" rel="noopener noreferrer">${label}</a>`);

    src = src.replace(/^\- (.+)$/gm, '<li>$1</li>');
    src = src.replace(/(<li>[\s\S]*<\/li>)/, '<ul>$1</ul>');
    src = src.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');
    src = src.replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>');

    src = src.replace(/\n\n/g, '</p><p>');
    src = '<p>' + src + '</p>';

    src = src.replace(/<p><\/p>/g, '');
    src = src.replace(/<p>(<h[1-6]>)/g, '$1');
    src = src.replace(/(<\/h[1-6]>)<\/p>/g, '$1');
    src = src.replace(/<p>(<ul>|<blockquote>)/g, '$1');
    src = src.replace(/(<\/ul>|<\/blockquote>)<\/p>/g, '$1');
    src = src.replace(/\uE000CODE(\d+)\uE001/g, (_, i) => codeBlocks[Number(i)]);

    return src;
}

// ---------- API ----------

async function fetchFavorites() {
    const response = await fetch(API_URL, { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error(`接口返回 ${response.status}`);
    const payload = await response.json();
    if (!payload || payload.success !== true || !Array.isArray(payload.data)) {
        throw new Error('接口返回格式异常');
    }
    return payload.data;
}

async function createFavorite(payload, password) {
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-fav-key': password },
        body: JSON.stringify(payload)
    });
    const body = await response.json().catch(() => null);
    return { status: response.status, body };
}

// ---------- 数据加载 ----------

const $ = (id) => document.getElementById(id);

async function loadFavorites() {
    hideStates();
    showSkeleton(true);

    try {
        state.items = await fetchFavorites();
        state.drawerId = null;
        showSkeleton(false);
        renderSidebar();
        applyFilters();
    } catch (err) {
        showSkeleton(false);
        hideStates();
        $('errorState').hidden = false;
        $('errorHint').textContent =
            `${err && err.message ? err.message : '网络异常'}。请确认 Cloudflare Pages Functions 与 D1 绑定已配置（见 SETUP.md）`;
        $('resultInfo').textContent = '加载失败';
    }
}

function hideStates() {
    ['errorState', 'emptyState', 'noResults'].forEach((id) => { $(id).hidden = true; });
}

function showSkeleton(show) {
    let skeleton = $('skeletonGrid');
    if (show) {
        if (!skeleton) {
            skeleton = document.createElement('div');
            skeleton.className = 'skeleton-grid';
            skeleton.id = 'skeletonGrid';
            skeleton.innerHTML = Array.from({ length: 8 }, () => `
                <div class="sk-card">
                    <div class="sk-row">
                        <div class="sk-icon"></div>
                        <div class="sk-line"></div>
                    </div>
                    <div class="sk-block w70"></div>
                    <div class="sk-block w45"></div>
                </div>`).join('');
            $('cardGrid').before(skeleton);
        }
        skeleton.hidden = false;
    } else if (skeleton) {
        skeleton.hidden = true;
    }
}

// ---------- 过滤 ----------

function applyFilters() {
    const search = state.search.trim().toLowerCase();

    state.filtered = state.items.filter((item) => {
        const haystacks = [
            item.title || '',
            item.description || '',
            item.url || '',
            ...(item.tags || [])
        ];
        const matchesSearch = haystacks.some((s) => String(s).toLowerCase().includes(search));
        const matchesTags = state.selectedTags.size === 0 ||
            Array.from(state.selectedTags).every((tag) => (item.tags || []).includes(tag));
        return matchesSearch && matchesTags;
    });

    renderToolbar();
    renderItems();
}

// ---------- 渲染 ----------

function renderSidebar() {
    const counts = new Map();
    state.items.forEach((item) => {
        (item.tags || []).forEach((tag) => counts.set(tag, (counts.get(tag) || 0) + 1));
    });

    const nav = $('tagNav');
    const tags = Array.from(counts.keys()).sort((a, b) => a.localeCompare(b, 'zh'));

    const hasFilter = state.selectedTags.size > 0 || state.search.trim() !== '';
    $('tagClearBtn').hidden = !hasFilter;

    nav.innerHTML = `
        <button class="tag-item${state.selectedTags.size === 0 ? ' selected' : ''}" data-tag="">
            <span class="tag-name">全部</span>
            <span class="tag-count">${state.items.length}</span>
        </button>
        ${tags.map((tag) => `
            <button class="tag-item${state.selectedTags.has(tag) ? ' selected' : ''}" data-tag="${escapeHtml(tag)}">
                <span class="tag-name">${escapeHtml(tag)}</span>
                <span class="tag-count">${counts.get(tag)}</span>
            </button>`).join('')}
    `;
}

function renderToolbar() {
    const total = state.items.length;
    const matched = state.filtered.length;
    const hasFilter = state.selectedTags.size > 0 || state.search.trim() !== '';
    $('resultInfo').textContent = hasFilter ? `匹配 ${matched} / ${total} 条` : `共 ${total} 条收藏`;

    // 激活中的筛选条件 chips
    const chips = [];
    if (state.search.trim()) {
        chips.push(`<span class="filter-chip">搜索：${escapeHtml(state.search.trim())}
            <button data-clear-search aria-label="清除搜索">✕</button></span>`);
    }
    state.selectedTags.forEach((tag) => {
        chips.push(`<span class="filter-chip">${escapeHtml(tag)}
            <button data-remove-tag="${escapeHtml(tag)}" aria-label="移除标签">✕</button></span>`);
    });
    $('activeFilters').innerHTML = chips.join('');

    $('viewGridBtn').classList.toggle('active', state.view === 'grid');
    $('viewListBtn').classList.toggle('active', state.view === 'list');
    $('cardGrid').hidden = state.view !== 'grid';
    $('rowList').hidden = state.view !== 'list';
}

function tagChipsHtml(item, limit) {
    const tags = (item.tags || []).slice(0, limit).map((tag) =>
        `<span class="mini-tag">${escapeHtml(tag)}</span>`).join('');
    return tags;
}

function cardHtml(item) {
    const domain = domainOf(item.url);
    const actions = `
        <div class="card-actions">
            ${item.url && isSafeUrl(item.url)
                ? `<a class="icon-btn" data-action="visit" href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer" aria-label="访问链接" title="访问链接">↗</a>`
                : ''}
            <button class="icon-btn" data-action="copy" aria-label="复制链接" title="复制链接">⧉</button>
        </div>`;

    return `
        <article class="card" data-id="${item.id}" tabindex="0">
            <div class="card-head">
                <span class="card-icon">${iconHtml(item.icon, item.title)}</span>
                <h3 class="card-title">${escapeHtml(item.title)}</h3>
            </div>
            ${item.description ? `<p class="card-desc">${escapeHtml(item.description)}</p>` : ''}
            <div class="card-foot">
                <div class="card-tags">
                    ${tagChipsHtml(item, 3)}
                    ${domain ? `<span class="card-domain">${escapeHtml(domain)}</span>` : ''}
                </div>
                ${actions}
            </div>
        </article>`;
}

function rowHtml(item) {
    const domain = domainOf(item.url);
    return `
        <div class="row" data-id="${item.id}" tabindex="0">
            <span class="row-icon">${iconHtml(item.icon, item.title)}</span>
            <div class="row-main">
                <span class="row-title">${escapeHtml(item.title)}</span>
                ${item.description ? `<span class="row-desc">${escapeHtml(item.description)}</span>` : ''}
            </div>
            <div class="row-tags">${tagChipsHtml(item, 2)}</div>
            ${domain ? `<span class="row-domain">${escapeHtml(domain)}</span>` : ''}
            <div class="row-actions">
                ${item.url && isSafeUrl(item.url)
                    ? `<a class="icon-btn" data-action="visit" href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer" aria-label="访问链接" title="访问链接">↗</a>`
                    : ''}
                <button class="icon-btn" data-action="copy" aria-label="复制链接" title="复制链接">⧉</button>
            </div>
        </div>`;
}

function renderItems() {
    hideStates();
    const grid = $('cardGrid');
    const list = $('rowList');

    if (state.items.length === 0) {
        grid.innerHTML = '';
        list.innerHTML = '';
        $('emptyState').hidden = false;
        return;
    }

    if (state.filtered.length === 0) {
        grid.innerHTML = '';
        list.innerHTML = '';
        $('noResults').hidden = false;
        return;
    }

    const html = state.filtered
        .map(state.view === 'grid' ? cardHtml : rowHtml)
        .join('');
    grid.innerHTML = state.view === 'grid' ? html : '';
    list.innerHTML = state.view === 'list' ? html : '';
}

// ---------- 详情抽屉 ----------

function findItem(id) {
    return state.items.find((item) => item.id === id);
}

function drawerHtml(item) {
    const domain = domainOf(item.url);
    const tags = (item.tags || []).map((tag) =>
        `<span class="mini-tag">${escapeHtml(tag)}</span>`).join('');

    return `
        <header class="drawer-head">
            <span class="drawer-icon">${iconHtml(item.icon, item.title)}</span>
            <div class="drawer-title-wrap">
                <h2 class="drawer-title">${escapeHtml(item.title)}</h2>
                ${domain && isSafeUrl(item.url)
                    ? `<a class="drawer-domain" href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer">🔗 ${escapeHtml(domain)}</a>`
                    : ''}
            </div>
            <button class="icon-btn" id="drawerCloseBtn" aria-label="关闭详情">✕</button>
        </header>
        <div class="drawer-body">
            ${item.description ? `<p class="drawer-desc">${escapeHtml(item.description)}</p>` : ''}
            ${tags ? `<div class="drawer-tags">${tags}</div>` : ''}
            <div class="drawer-meta">收藏于 ${formatCreatedAt(item.createdAt)}</div>
            ${item.content ? `<div class="md">${parseMarkdown(item.content)}</div>` : ''}
        </div>
        <footer class="drawer-foot">
            <button class="btn btn-secondary" id="drawerCopyBtn">⧉ 复制链接</button>
            ${item.url && isSafeUrl(item.url)
                ? `<a class="btn btn-primary" href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer">访问 ↗</a>`
                : ''}
        </footer>`;
}

function openDrawer(id) {
    const item = findItem(id);
    if (!item) return;
    state.drawerId = id;
    $('drawer').innerHTML = drawerHtml(item);
    $('drawer').setAttribute('aria-hidden', 'false');
    const backdrop = $('drawerBackdrop');
    backdrop.hidden = false;
    requestAnimationFrame(() => document.body.classList.add('drawer-open'));
}

function closeDrawer() {
    if (state.drawerId === null) return;
    state.drawerId = null;
    document.body.classList.remove('drawer-open');
    $('drawer').setAttribute('aria-hidden', 'true');
    setTimeout(() => { $('drawerBackdrop').hidden = true; }, 260);
}

// ---------- 复制链接 ----------

async function copyText(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch {
        // 兼容不支持 Clipboard API 的环境
        const input = document.createElement('textarea');
        input.value = text;
        input.style.position = 'fixed';
        input.style.opacity = '0';
        document.body.appendChild(input);
        input.select();
        const ok = document.execCommand && document.execCommand('copy');
        document.body.removeChild(input);
        return ok;
    }
}

function toast(message) {
    const el = $('toast');
    el.textContent = message;
    el.hidden = false;
    requestAnimationFrame(() => document.body.classList.add('toast-open'));
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => {
        document.body.classList.remove('toast-open');
        setTimeout(() => { el.hidden = true; }, 220);
    }, 2200);
}

// ---------- 新增收藏模态框 ----------

function openModal() {
    // 上次提交成功过的密码留在 sessionStorage（关标签页即清除），免去重复输入
    const saved = sessionStorage.getItem(PASSWORD_KEY);
    if (saved) $('itemPassword').value = saved;
    setFormStatus('');
    showFormPanel();
    const backdrop = $('modalBackdrop');
    backdrop.hidden = false;
    requestAnimationFrame(() => document.body.classList.add('modal-open'));
    setTimeout(() => $('itemTitle').focus(), 220);
}

function closeModal() {
    document.body.classList.remove('modal-open');
    setTimeout(() => { $('modalBackdrop').hidden = true; }, 220);
}

function showFormPanel() {
    $('previewPanel').hidden = true;
    $('addItemForm').hidden = false;
}

function setFormStatus(kind, message) {
    const status = $('formStatus');
    status.className = `form-status${kind ? ` ${kind}` : ''}${message ? ' show' : ''}`;
    status.textContent = message || '';
}

function previewItem() {
    const title = $('itemTitle').value.trim();
    if (!title) {
        setFormStatus('error', '请先填写标题再预览');
        return;
    }

    const icon = $('itemIcon').value.trim() || '🎯';
    const description = $('itemDescription').value.trim();
    const tags = $('itemTags').value.split(',').map((t) => t.trim()).filter(Boolean);
    const content = $('itemContent').value.trim();

    $('previewBody').innerHTML = `
        <div class="preview-card">
            <article class="card">
                <div class="card-head">
                    <span class="card-icon">${iconHtml(icon, title)}</span>
                    <h3 class="card-title">${escapeHtml(title)}</h3>
                </div>
                ${description ? `<p class="card-desc">${escapeHtml(description)}</p>` : ''}
                <div class="card-foot">
                    <div class="card-tags">${tags.map((t) => `<span class="mini-tag">${escapeHtml(t)}</span>`).join('')}</div>
                </div>
            </article>
            <div class="md" style="margin-top: 12px;">
                ${content ? parseMarkdown(content) : '<p><em>（未填写详细内容）</em></p>'}
            </div>
        </div>`;

    $('addItemForm').hidden = true;
    $('previewPanel').hidden = false;
}

async function handleFormSubmit(e) {
    e.preventDefault();

    const title = $('itemTitle').value.trim();
    const url = $('itemUrl').value.trim();
    const icon = $('itemIcon').value.trim();
    const description = $('itemDescription').value.trim();
    const tags = $('itemTags').value.trim();
    const content = $('itemContent').value.trim();
    const password = $('itemPassword').value;

    if (!title || !url || !password) {
        setFormStatus('error', '请填写标题、链接和管理密码');
        return;
    }

    const submitBtn = $('submitBtn');
    submitBtn.disabled = true;
    setFormStatus('info', '保存中…');

    try {
        const { status, body } = await createFavorite({
            title,
            url,
            icon: icon || undefined,
            description: description || undefined,
            tags: tags || undefined,
            content: content || undefined
        }, password);

        if (status === 201 && body && body.success) {
            // 密码正确，记住它；新收藏插到最前面，不整页刷新
            sessionStorage.setItem(PASSWORD_KEY, password);
            state.items.unshift(body.data);
            state.selectedTags.clear();
            renderSidebar();
            applyFilters();
            closeModal();
            toast('✅ 已添加收藏');
            return;
        }

        switch (status) {
            case 400:
                setFormStatus('error', (body && body.error) || '提交内容未通过校验');
                break;
            case 403:
                sessionStorage.removeItem(PASSWORD_KEY);
                setFormStatus('error', '管理密码错误，请检查后重试');
                break;
            case 409:
                setFormStatus('error', '这条链接已经收藏过了');
                break;
            case 503:
                setFormStatus('error', '服务端还没设置 FAV_PASSWORD，写入已停用（见 SETUP.md 第 5 步）');
                break;
            default:
                setFormStatus('error', (body && body.error) || `提交失败（${status}）`);
        }
    } catch (err) {
        setFormStatus('error', `网络错误：${err && err.message ? err.message : '请稍后再试'}`);
    } finally {
        submitBtn.disabled = false;
    }
}

// ---------- 事件绑定 ----------

/** 卡片 / 列表行的点击委托：动作按钮、复制、整卡打开详情 */
function handleEntryClick(e) {
    const actionEl = e.target.closest('[data-action]');
    if (actionEl) {
        e.stopPropagation();
        const id = Number(actionEl.closest('[data-id]').dataset.id);
        if (actionEl.dataset.action === 'copy') {
            const item = findItem(id);
            if (item && item.url) {
                copyText(item.url).then((ok) => toast(ok ? '🔗 链接已复制' : '复制失败'));
            }
        }
        // visit 是真实链接，浏览器自行打开新标签页
        return;
    }
    const entry = e.target.closest('[data-id]');
    if (entry) {
        openDrawer(Number(entry.dataset.id));
    }
}

function handleEntryKeydown(e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const entry = e.target.closest('[data-id]');
    if (entry && e.target === entry) {
        e.preventDefault();
        openDrawer(Number(entry.dataset.id));
    }
}

function bindEvents() {
    // 主题
    $('themeToggle').addEventListener('click', () => {
        const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('theme', next);
        $('themeToggle').textContent = next === 'dark' ? '☀️' : '🌙';
    });

    // 搜索
    const searchInput = $('searchInput');
    searchInput.addEventListener('input', debounce(() => {
        state.search = searchInput.value;
        $('searchClear').hidden = searchInput.value === '';
        applyFilters();
    }, 150));
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && searchInput.value) {
            searchInput.value = '';
            state.search = '';
            $('searchClear').hidden = true;
            applyFilters();
        }
    });
    $('searchClear').addEventListener('click', () => {
        searchInput.value = '';
        state.search = '';
        $('searchClear').hidden = true;
        applyFilters();
        searchInput.focus();
    });

    // 视图切换
    document.querySelectorAll('.view-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
            state.view = btn.dataset.view;
            localStorage.setItem(VIEW_KEY, state.view);
            renderToolbar();
            renderItems();
        });
    });

    // 标签导航（委托）：选择标签 + 移动端选完自动收起侧栏
    $('tagNav').addEventListener('click', (e) => {
        const btn = e.target.closest('.tag-item');
        if (!btn) return;
        const tag = btn.dataset.tag;
        if (!tag) {
            state.selectedTags.clear();
        } else if (state.selectedTags.has(tag)) {
            state.selectedTags.delete(tag);
        } else {
            state.selectedTags.add(tag);
        }
        renderSidebar();
        applyFilters();
        if (window.innerWidth <= 900) closeSidebar();
    });

    $('tagClearBtn').addEventListener('click', clearFilters);
    $('activeFilters').addEventListener('click', (e) => {
        if (e.target.closest('[data-clear-search]')) {
            $('searchInput').value = '';
            state.search = '';
            $('searchClear').hidden = true;
            applyFilters();
        }
        const removeTag = e.target.closest('[data-remove-tag]');
        if (removeTag) {
            state.selectedTags.delete(removeTag.dataset.removeTag);
            renderSidebar();
            applyFilters();
        }
    });

    // 卡片 / 列表（委托）
    $('cardGrid').addEventListener('click', handleEntryClick);
    $('rowList').addEventListener('click', handleEntryClick);
    $('cardGrid').addEventListener('keydown', handleEntryKeydown);
    $('rowList').addEventListener('keydown', handleEntryKeydown);

    // 抽屉
    $('drawerBackdrop').addEventListener('click', closeDrawer);
    $('drawer').addEventListener('click', (e) => {
        if (e.target.closest('#drawerCloseBtn')) { closeDrawer(); return; }
        if (e.target.closest('#drawerCopyBtn')) {
            const item = findItem(state.drawerId);
            if (item && item.url) {
                copyText(item.url).then((ok) => toast(ok ? '🔗 链接已复制' : '复制失败'));
            }
        }
    });

    // 移动端侧边栏
    $('sidebarToggle').addEventListener('click', () => {
        const backdrop = $('sidebarBackdrop');
        backdrop.hidden = false;
        requestAnimationFrame(() => document.body.classList.add('sidebar-open'));
    });
    $('sidebarBackdrop').addEventListener('click', closeSidebar);

    // 新增收藏
    $('addItemBtn').addEventListener('click', openModal);
    $('modalCloseBtn').addEventListener('click', closeModal);
    $('cancelBtn').addEventListener('click', closeModal);
    $('modalBackdrop').addEventListener('click', (e) => {
        if (e.target === $('modalBackdrop')) closeModal();
    });
    $('previewBtn').addEventListener('click', previewItem);
    $('previewBackBtn').addEventListener('click', showFormPanel);
    $('addItemForm').addEventListener('submit', handleFormSubmit);

    // 重试
    $('retryBtn').addEventListener('click', loadFavorites);

    // Escape 逐层关闭
    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;
        if (document.body.classList.contains('modal-open')) {
            closeModal();
        } else if (document.body.classList.contains('drawer-open')) {
            closeDrawer();
        } else if (document.body.classList.contains('sidebar-open')) {
            closeSidebar();
        }
    });
}

function closeSidebar() {
    document.body.classList.remove('sidebar-open');
    setTimeout(() => { $('sidebarBackdrop').hidden = true; }, 240);
}

/** 清除全部筛选条件（搜索 + 标签） */
function clearFilters() {
    state.selectedTags.clear();
    state.search = '';
    $('searchInput').value = '';
    $('searchClear').hidden = true;
    renderSidebar();
    applyFilters();
}

// ---------- 启动 ----------

function init() {
    // 主题
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    $('themeToggle').textContent = savedTheme === 'dark' ? '☀️' : '🌙';

    bindEvents();
    loadFavorites();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
