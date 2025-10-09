// 应用状态
let allCollections = [];
let filteredCollections = [];
let selectedTags = new Set();
let expandedId = null;
let currentTheme = 'light';

// Markdown 简单解析器
function parseMarkdown(text) {
    if (!text) return '';
    
    // 移除开头和结尾的空白
    text = text.trim();
    
    // 代码块
    text = text.replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>');
    
    // 行内代码
    text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // 标题
    text = text.replace(/^### (.*$)/gm, '<h3>$1</h3>');
    text = text.replace(/^## (.*$)/gm, '<h2>$1</h2>');
    text = text.replace(/^# (.*$)/gm, '<h1>$1</h1>');
    
    // 粗体
    text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    
    // 斜体
    text = text.replace(/\*(.+?)\*/g, '<em>$1</em>');
    
    // 删除线
    text = text.replace(/~~(.+?)~~/g, '<del>$1</del>');
    
    // 链接
    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
    
    // 图片
    text = text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">');
    
    // 无序列表
    text = text.replace(/^\- (.+)$/gm, '<li>$1</li>');
    text = text.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
    
    // 有序列表
    text = text.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');
    
    // 引用
    text = text.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');
    
    // 段落
    text = text.replace(/\n\n/g, '</p><p>');
    text = '<p>' + text + '</p>';
    
    // 清理空段落
    text = text.replace(/<p><\/p>/g, '');
    text = text.replace(/<p>(<h[1-6]>)/g, '$1');
    text = text.replace(/(<\/h[1-6]>)<\/p>/g, '$1');
    text = text.replace(/<p>(<pre>)/g, '$1');
    text = text.replace(/(<\/pre>)<\/p>/g, '$1');
    text = text.replace(/<p>(<ul>)/g, '$1');
    text = text.replace(/(<\/ul>)<\/p>/g, '$1');
    text = text.replace(/<p>(<blockquote>)/g, '$1');
    text = text.replace(/(<\/blockquote>)<\/p>/g, '$1');
    
    return text;
}

// 初始化
function init() {
    allCollections = collectionsData;
    filteredCollections = [...allCollections];
    
    // 加载主题
    loadTheme();
    
    // 绑定事件
    bindEvents();
    
    // 初始化标签过滤器
    initTagFilter();
    
    // 渲染集合
    renderCollections();
}

// 加载主题
function loadTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    currentTheme = savedTheme;
    document.documentElement.setAttribute('data-theme', currentTheme);
}

// 切换主题
function toggleTheme() {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', currentTheme);
    localStorage.setItem('theme', currentTheme);
}

// 绑定事件
function bindEvents() {
    // 主题切换
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
    
    // 搜索
    document.getElementById('searchInput').addEventListener('input', handleSearch);
    
    // 标签过滤器切换
    document.getElementById('tagFilterToggle').addEventListener('click', toggleTagFilter);
    
    // 清除标签
    document.getElementById('tagClearBtn').addEventListener('click', clearTags);
    
    // 点击外部关闭标签过滤器
    document.addEventListener('click', (e) => {
        const tagFilter = document.querySelector('.tag-filter');
        const dropdown = document.getElementById('tagFilterDropdown');
        
        if (!tagFilter.contains(e.target)) {
            dropdown.classList.remove('active');
        }
    });
}

// 初始化标签过滤器
function initTagFilter() {
    const allTags = new Set();
    
    allCollections.forEach(collection => {
        collection.tags.forEach(tag => allTags.add(tag));
    });
    
    const tagList = document.getElementById('tagList');
    tagList.innerHTML = '';
    
    Array.from(allTags).sort().forEach(tag => {
        const div = document.createElement('div');
        div.className = 'tag-checkbox';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `tag-${tag}`;
        checkbox.value = tag;
        checkbox.addEventListener('change', handleTagChange);
        
        const label = document.createElement('label');
        label.htmlFor = `tag-${tag}`;
        label.textContent = tag;
        
        div.appendChild(checkbox);
        div.appendChild(label);
        tagList.appendChild(div);
    });
}

// 切换标签过滤器
function toggleTagFilter() {
    const dropdown = document.getElementById('tagFilterDropdown');
    dropdown.classList.toggle('active');
}

// 清除标签
function clearTags() {
    selectedTags.clear();
    document.querySelectorAll('.tag-checkbox input').forEach(checkbox => {
        checkbox.checked = false;
    });
    updateTagCount();
    filterCollections();
}

// 处理标签变化
function handleTagChange(e) {
    const tag = e.target.value;
    
    if (e.target.checked) {
        selectedTags.add(tag);
    } else {
        selectedTags.delete(tag);
    }
    
    updateTagCount();
    filterCollections();
}

// 更新标签计数
function updateTagCount() {
    const tagCount = document.querySelector('.tag-count');
    
    if (selectedTags.size > 0) {
        tagCount.textContent = selectedTags.size;
        tagCount.style.display = 'inline-block';
    } else {
        tagCount.style.display = 'none';
    }
}

// 处理搜索
function handleSearch(e) {
    filterCollections();
}

// 过滤集合
function filterCollections() {
    const searchText = document.getElementById('searchInput').value.toLowerCase();
    
    filteredCollections = allCollections.filter(collection => {
        // 搜索过滤
        const matchesSearch = 
            collection.title.toLowerCase().includes(searchText) ||
            collection.description.toLowerCase().includes(searchText) ||
            collection.tags.some(tag => tag.toLowerCase().includes(searchText));
        
        // 标签过滤
        const matchesTags = selectedTags.size === 0 || 
            Array.from(selectedTags).some(tag => collection.tags.includes(tag));
        
        return matchesSearch && matchesTags;
    });
    
    renderCollections();
}

// 渲染集合
function renderCollections() {
    const grid = document.getElementById('collectionsGrid');
    const noResults = document.getElementById('noResults');
    
    if (filteredCollections.length === 0) {
        grid.innerHTML = '';
        noResults.style.display = 'block';
        return;
    }
    
    noResults.style.display = 'none';
    grid.innerHTML = '';
    
    filteredCollections.forEach((collection, index) => {
        // 创建卡片
        const card = createCard(collection);
        grid.appendChild(card);
        
        // 如果这个集合被展开，在它后面插入详情
        if (expandedId === collection.id) {
            const detail = createDetail(collection);
            grid.appendChild(detail);
        }
    });
}

// 创建卡片
function createCard(collection) {
    const card = document.createElement('div');
    card.className = 'collection-card';
    card.onclick = () => toggleExpand(collection.id);
    
    const icon = collection.icon.startsWith('http') 
        ? `<img src="${collection.icon}" alt="${collection.title}">` 
        : collection.icon;
    
    const tagsHtml = collection.tags
        .map(tag => `<span class="tag">${tag}</span>`)
        .join('');
    
    card.innerHTML = `
        <div class="card-header">
            <div class="card-icon">${icon}</div>
            <div class="card-title-wrapper">
                <h3 class="card-title">${collection.title}</h3>
            </div>
        </div>
        <p class="card-description">${collection.description}</p>
        <div class="card-tags">${tagsHtml}</div>
    `;
    
    return card;
}

// 创建详情
function createDetail(collection) {
    const detail = document.createElement('div');
    detail.className = 'collection-detail';
    
    const icon = collection.icon.startsWith('http') 
        ? `<img src="${collection.icon}" alt="${collection.title}">` 
        : collection.icon;
    
    const tagsHtml = collection.tags
        .map(tag => `<span class="tag">${tag}</span>`)
        .join('');
    
    const contentHtml = parseMarkdown(collection.content);
    
    detail.innerHTML = `
        <div class="detail-header">
            <div class="detail-icon">${icon}</div>
            <div class="detail-info">
                <h2 class="detail-title">${collection.title}</h2>
                <p class="detail-description">${collection.description}</p>
                <div class="detail-tags">${tagsHtml}</div>
            </div>
            <button class="detail-close" onclick="toggleExpand(${collection.id}); event.stopPropagation();">✕</button>
        </div>
        <div class="detail-content">
            ${contentHtml}
        </div>
    `;
    
    return detail;
}

// 切换展开/折叠
function toggleExpand(id) {
    if (expandedId === id) {
        expandedId = null;
    } else {
        expandedId = id;
        
        // 滚动到卡片位置
        setTimeout(() => {
            const detail = document.querySelector('.collection-detail');
            if (detail) {
                detail.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }, 100);
    }
    
    renderCollections();
}

// 页面加载完成后初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
