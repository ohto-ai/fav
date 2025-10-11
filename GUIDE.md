# 使用指南

## 快速开始

### 1. 添加新的收藏

#### 方法一：通过网站和 GitHub Issue（推荐）

1. **在网站上提交**：
   - 访问网站，点击 **"➕ 新增收藏"** 按钮
   - 填写所有必填字段（标题、图标、描述、标签、详细内容）
   - 点击 **"预览"** 查看效果
   - 确认无误后点击 **"提交到 GitHub"**
   - 自动跳转到 GitHub Issue 页面，确认并提交

2. **直接在 GitHub 创建 Issue**：
   - 访问 [Issues 页面](https://github.com/ohto-ai/fav/issues/new/choose)
   - 选择 **"新增收藏"** 模板
   - 填写表单中的所有字段
   - 提交 Issue

3. **自动处理**：
   - GitHub Actions 会自动检测带有 `新增收藏` 标签的 Issue
   - 自动解析 Issue 内容并提取数据
   - 自动创建包含新收藏的 Pull Request
   - 在原 Issue 中评论 PR 链接

4. **审核与合并**：
   - 等待仓库维护者审核 PR
   - 合并后新收藏自动添加到网站

#### 方法二：直接编辑 data.js

编辑 `data.js` 文件，在 `collectionsData` 数组中添加新的收藏对象：

```javascript
{
    id: 7,  // 确保 ID 唯一
    title: "你的收藏标题",
    icon: "🎯",  // 使用 emoji 或图片 URL (如 "https://example.com/icon.png")
    description: "简短的描述文字，会显示在卡片上",
    tags: ["标签1", "标签2", "标签3"],  // 可以添加多个标签
    content: `
# 主标题

这里可以使用 Markdown 语法编写详细内容。

## 二级标题

- 列表项 1
- 列表项 2

**粗体文本** 和 *斜体文本*

[链接文本](https://example.com)

\`\`\`javascript
// 代码块
console.log("Hello, World!");
\`\`\`
    `
}
```

### 2. 自定义样式

#### 修改颜色主题

编辑 `styles.css` 文件中的 CSS 变量：

```css
:root {
    --bg-primary: #ffffff;      /* 主背景色 */
    --bg-secondary: #f5f7fa;    /* 次要背景色 */
    --bg-card: #ffffff;         /* 卡片背景色 */
    --text-primary: #2c3e50;    /* 主文本颜色 */
    --text-secondary: #546e7a;  /* 次要文本颜色 */
    --border-color: #e0e6ed;    /* 边框颜色 */
    --accent: #3498db;          /* 强调色 */
    --accent-hover: #2980b9;    /* 强调色悬停 */
    --tag-bg: #e3f2fd;         /* 标签背景色 */
    --tag-text: #1565c0;       /* 标签文本颜色 */
}

/* 暗色模式的颜色 */
[data-theme="dark"] {
    --bg-primary: #1a1a1a;
    --bg-secondary: #0f0f0f;
    /* ... 更多配置 */
}
```

#### 修改网站标题

编辑 `index.html` 中的以下部分：

```html
<title>收藏集</title>  <!-- 浏览器标签标题 -->
<h1 class="logo">📚 我的收藏</h1>  <!-- 页面标题 -->
```

### 3. 部署到 GitHub Pages

#### 方法一：自动部署（推荐）

1. **启用 GitHub Pages**
   - 进入仓库的 Settings > Pages
   - 在 "Source" 下选择 "GitHub Actions"

2. **推送代码到 main 分支**
   ```bash
   git add .
   git commit -m "Update collections"
   git push origin main
   ```

3. **等待部署完成**
   - 在 Actions 标签页查看部署进度
   - 部署成功后，访问 `https://你的用户名.github.io/fav/`

#### 方法二：手动部署

如果你想部署到其他静态托管服务（如 Netlify、Vercel、Cloudflare Pages）：

1. 将整个项目目录上传
2. 设置根目录为项目目录
3. 无需构建命令，直接发布即可

### 4. 本地开发和测试

#### 使用 Python（推荐）

```bash
cd fav
python3 -m http.server 8000
# 访问 http://localhost:8000
```

#### 使用 Node.js

```bash
npx serve
# 或者安装后使用
npm install -g serve
serve
```

#### 使用 PHP

```bash
php -S localhost:8000
```

#### 使用 VS Code

安装 "Live Server" 扩展，右键点击 `index.html` 选择 "Open with Live Server"。

## 功能说明

### 搜索功能

- 在搜索框中输入关键词
- 实时搜索标题、描述和标签
- 支持中文和英文

### 标签筛选

- 点击"标签筛选"按钮打开筛选器
- 选择一个或多个标签进行过滤
- 只显示包含选中标签的收藏
- 点击"清除"按钮重置筛选

### 主题切换

- 点击右上角的太阳/月亮图标
- 在亮色和暗色主题之间切换
- 主题选择会自动保存到浏览器

### 展开详情

- 点击任意收藏卡片展开详细内容
- 详细内容会以动画形式展开
- 再次点击或点击关闭按钮收起详情

## Markdown 语法支持

本网站支持以下 Markdown 语法：

| 语法 | 效果 |
|------|------|
| `# 标题` | 一级标题 |
| `## 标题` | 二级标题 |
| `### 标题` | 三级标题 |
| `**粗体**` | **粗体** |
| `*斜体*` | *斜体* |
| `~~删除线~~` | ~~删除线~~ |
| `` `代码` `` | `代码` |
| ` ```代码块``` ` | 代码块 |
| `[链接](url)` | 超链接 |
| `![图片](url)` | 图片 |
| `- 列表` | 无序列表 |
| `1. 列表` | 有序列表 |
| `> 引用` | 引用块 |

## 常见问题

### 1. 图标不显示？

- 确保使用的是有效的 emoji 或可访问的图片 URL
- 如果使用图片 URL，确保服务器支持跨域访问

### 2. 修改后页面没有变化？

- 清除浏览器缓存（Ctrl+F5 或 Cmd+Shift+R）
- 检查浏览器控制台是否有 JavaScript 错误

### 3. GitHub Actions 部署失败？

- 检查仓库的 Pages 设置是否正确
- 确保 `.github/workflows/deploy.yml` 文件存在
- 查看 Actions 标签页的错误日志

### 4. 移动端显示不正常？

- 本网站已经过响应式设计测试
- 如有问题，请检查浏览器版本是否过旧

### 5. 如何备份数据？

- 定期提交代码到 Git 仓库
- 导出 `data.js` 文件作为备份
- 使用 Git 的版本控制功能管理历史

## 性能优化建议

### 1. 优化图片

- 使用压缩后的图片
- 推荐使用 WebP 格式
- 控制图片大小在 100KB 以内

### 2. 减少收藏数量

- 如果收藏很多（超过 100 个），考虑分页
- 或者将收藏分类到不同的页面

### 3. 使用 CDN

- 将图片托管到图床或 CDN
- 使用 CDN 加速静态资源加载

## 扩展功能建议

如果你想添加更多功能，可以考虑：

1. **分页**：当收藏数量很多时添加分页功能
2. **排序**：按标题、日期、标签等排序
3. **导出**：导出收藏为 JSON 或 Markdown
4. **统计**：显示收藏数量、标签统计等
5. **动画**：添加更多的动画效果
6. **PWA**：将网站转换为 PWA 应用

## 技术栈

- **HTML5** - 结构
- **CSS3** - 样式（CSS 变量、Grid、Flexbox、动画）
- **JavaScript (ES6+)** - 交互逻辑
- **GitHub Actions** - 自动部署

无需任何构建工具或框架，纯静态实现！

## 浏览器支持

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- 移动端浏览器

## 贡献

欢迎提交问题和改进建议！

## 许可证

MIT License - 自由使用和修改
