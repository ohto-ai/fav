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
    
    // 新增按钮
    document.getElementById('addItemBtn').addEventListener('click', openAddItemModal);
    
    // 关闭模态框
    document.getElementById('modalCloseBtn').addEventListener('click', closeAddItemModal);
    
    // 预览按钮
    document.getElementById('previewBtn').addEventListener('click', previewItem);
    
    // 表单提交
    document.getElementById('addItemForm').addEventListener('submit', handleFormSubmit);
    
    // 点击模态框外部关闭
    document.getElementById('addItemModal').addEventListener('click', (e) => {
        if (e.target.id === 'addItemModal') {
            closeAddItemModal();
        }
    });
    
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

// 新增收藏相关函数

// 打开新增模态框
function openAddItemModal() {
    document.getElementById('addItemModal').classList.add('active');
    document.body.style.overflow = 'hidden'; // 防止背景滚动
}

// 关闭新增模态框
function closeAddItemModal() {
    document.getElementById('addItemModal').classList.remove('active');
    document.body.style.overflow = 'auto';
    // 清空表单
    document.getElementById('addItemForm').reset();
    document.getElementById('previewSection').style.display = 'none';
}

// 预览功能
function previewItem() {
    const title = document.getElementById('itemTitle').value.trim();
    const icon = document.getElementById('itemIcon').value.trim();
    const description = document.getElementById('itemDescription').value.trim();
    const tags = document.getElementById('itemTags').value.trim();
    const content = document.getElementById('itemContent').value.trim();
    
    if (!title || !icon || !description || !tags || !content) {
        alert('请填写所有必填字段！');
        return;
    }
    
    const tagsArray = tags.split(',').map(t => t.trim()).filter(t => t);
    
    const previewCard = document.getElementById('previewCard');
    const iconHtml = icon.startsWith('http') 
        ? `<img src="${icon}" alt="${title}" style="width: 48px; height: 48px;">` 
        : icon;
    
    const tagsHtml = tagsArray
        .map(tag => `<span class="tag">${tag}</span>`)
        .join('');
    
    const contentHtml = parseMarkdown(content);
    
    previewCard.innerHTML = `
        <div class="card-header">
            <div class="card-icon">${iconHtml}</div>
            <div class="card-title-wrapper">
                <h3 class="card-title">${title}</h3>
            </div>
        </div>
        <p class="card-description">${description}</p>
        <div class="card-tags">${tagsHtml}</div>
        <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border-color);">
            <h4 style="margin-bottom: 0.5rem;">详细内容预览：</h4>
            <div style="max-height: 300px; overflow-y: auto;">
                ${contentHtml}
            </div>
        </div>
    `;
    
    document.getElementById('previewSection').style.display = 'block';
    
    // 滚动到预览区域
    setTimeout(() => {
        document.getElementById('previewSection').scrollIntoView({ 
            behavior: 'smooth', 
            block: 'nearest' 
        });
    }, 100);
}

// 处理表单提交
function handleFormSubmit(e) {
    e.preventDefault();
    
    const title = document.getElementById('itemTitle').value.trim();
    const icon = document.getElementById('itemIcon').value.trim();
    const description = document.getElementById('itemDescription').value.trim();
    const tags = document.getElementById('itemTags').value.trim();
    const content = document.getElementById('itemContent').value.trim();
    
    if (!title || !icon || !description || !tags || !content) {
        alert('请填写所有必填字段！');
        return;
    }
    
    const tagsArray = tags.split(',').map(t => t.trim()).filter(t => t);
    
    // 获取当前最大的 ID
    const maxId = Math.max(...collectionsData.map(item => item.id), 0);
    const newId = maxId + 1;
    
    // 生成新的收藏对象代码
    const newItemCode = `{
    id: ${newId},
    title: "${title.replace(/"/g, '\\"')}",
    icon: "${icon.replace(/"/g, '\\"')}",
    description: "${description.replace(/"/g, '\\"')}",
    tags: [${tagsArray.map(t => `"${t.replace(/"/g, '\\"')}"`).join(', ')}],
    content: \`
${content}
    \`
}`;
    
    // 生成 GitHub Issue 的内容
    const issueTitle = `新增收藏：${title}`;
    const issueBody = `## 新增收藏信息

**标题：** ${title}
**图标：** ${icon}
**描述：** ${description}
**标签：** ${tagsArray.join(', ')}

## 详细内容

\`\`\`
${content}
\`\`\`

## 代码

请将以下代码添加到 \`data.js\` 文件的 \`collectionsData\` 数组中：

\`\`\`javascript
${newItemCode}
\`\`\`

---
*此 Issue 由网站前端自动生成*`;
    
    // 获取当前仓库信息
    const repoOwner = 'ohto-ai';  // 可以从 location.hostname 或配置中获取
    const repoName = 'fav';
    
    // 构建 GitHub Issue 创建 URL
    const githubUrl = `https://github.com/${repoOwner}/${repoName}/issues/new?title=${encodeURIComponent(issueTitle)}&body=${encodeURIComponent(issueBody)}`;
    
    // 确认后跳转
    const confirmMessage = `即将跳转到 GitHub 创建 Issue，请确认信息：

标题：${title}
描述：${description}
标签：${tagsArray.join(', ')}

点击确定将打开 GitHub 页面`;
    
    if (confirm(confirmMessage)) {
        window.open(githubUrl, '_blank');
        closeAddItemModal();
    }
}
