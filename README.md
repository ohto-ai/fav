# 收藏集网站

一个简洁美观的静态收藏展示网站，支持搜索、标签筛选和亮暗色主题切换。

## ✨ 功能特性

- 📱 **响应式设计** - 完美适配桌面和移动设备
- 🔍 **实时搜索** - 快速查找收藏内容
- 🏷️ **标签筛选** - 支持多标签过滤
- 🌓 **主题切换** - 亮色/暗色模式支持
- 📝 **Markdown 支持** - 详细内容使用 Markdown 编写
- ✨ **展开动画** - 流畅的详情展开/折叠动画
- 🚀 **纯静态** - 无需后端，易于部署

## 🎯 数据结构

每个收藏包含以下属性：

```javascript
{
    id: 1,                    // 唯一标识符
    title: "标题",            // 收藏标题
    icon: "🎨",              // 图标（emoji 或图片 URL）
    description: "简介",      // 简短描述
    tags: ["标签1", "标签2"], // 标签数组
    content: `详细内容...`    // Markdown 格式的详细内容
}
```

## 📝 如何添加收藏

### 方法一：通过 GitHub Issue（推荐）

1. 访问网站，点击 **"➕ 新增收藏"** 按钮
2. 填写收藏信息并预览
3. 点击提交，会自动跳转到 GitHub 创建 Issue
4. 提交 Issue 后，GitHub Actions 会自动处理并创建 Pull Request
5. 等待审核和合并

**或者直接在 GitHub 上创建 Issue：**

1. 前往 [Issues 页面](https://github.com/ohto-ai/fav/issues/new/choose)
2. 选择 **"新增收藏"** 模板
3. 填写所有必填字段
4. 提交后自动处理

### 方法二：直接编辑 data.js

编辑 `data.js` 文件，在 `collectionsData` 数组中添加新的收藏对象：

```javascript
const collectionsData = [
    {
        id: 1,
        title: "你的收藏标题",
        icon: "🎯", // 可以使用 emoji 或图片 URL
        description: "这是一段简短的描述文字",
        tags: ["标签1", "标签2"],
        content: `
# 详细内容标题

这里可以使用 Markdown 语法编写详细内容。

## 支持的 Markdown 语法

- **粗体文本**
- *斜体文本*
- [链接](https://example.com)
- \`代码\`
- 列表等...
        `
    },
    // 添加更多收藏...
];
```

## 🚀 本地预览

1. 克隆仓库：
```bash
git clone https://github.com/ohto-ai/fav.git
cd fav
```

2. 使用任意 HTTP 服务器启动：
```bash
# 使用 Python
python -m http.server 8000

# 或使用 Node.js
npx serve

# 或使用 PHP
php -S localhost:8000
```

3. 在浏览器中访问 `http://localhost:8000`

## 🌐 GitHub Pages 部署

本项目已配置 GitHub Actions 自动部署：

1. 在 GitHub 仓库设置中，进入 **Settings** > **Pages**
2. 在 **Source** 部分，选择 **GitHub Actions**
3. 推送代码到 `main` 分支，自动触发部署
4. 部署完成后，访问 `https://ohto-ai.github.io/fav/`

## 🤖 自动化工作流

### 新增收藏自动处理

本项目配置了自动化工作流来处理新增收藏的 Issue：

1. **触发条件**：当 Issue 被添加 `add-favorite` 标签时
2. **处理流程**：
   - 自动解析 Issue 内容（支持网站生成的 YAML 格式和 GitHub Issue 表单格式）
   - 提取收藏信息（标题、图标、描述、标签、详细内容）
   - 自动生成新的 ID
   - 将新收藏添加到 `data.js` 文件
   - 创建 Pull Request 供审核
   - 在 Issue 中评论 PR 链接
3. **审核合并**：审核 PR 内容后合并，新收藏即添加到网站

**注意**：Issue 模板会自动添加 `add-favorite` 标签，因此通常不需要手动添加。

### 工作流文件

- `.github/workflows/deploy.yml` - 部署工作流
- `.github/workflows/process-collection-issue.yml` - 新增收藏自动处理工作流
- `.github/ISSUE_TEMPLATE/add-collection.yml` - 新增收藏 Issue 模板

## 📁 项目结构

```
.
├── index.html          # 主页面
├── styles.css          # 样式文件
├── app.js             # 应用逻辑
├── data.js            # 收藏数据
├── .github/
│   ├── ISSUE_TEMPLATE/
│   │   └── add-collection.yml  # 新增收藏 Issue 模板
│   └── workflows/
│       ├── deploy.yml                       # GitHub Pages 部署配置
│       └── process-collection-issue.yml     # 新增收藏自动处理
└── README.md          # 项目说明
```

## 🎨 自定义样式

所有样式定义在 `styles.css` 中，使用 CSS 变量便于自定义：

```css
:root {
    --bg-primary: #ffffff;
    --bg-secondary: #f5f7fa;
    --text-primary: #2c3e50;
    --accent: #3498db;
    /* ... 更多变量 */
}
```

修改这些变量即可快速调整网站配色方案。

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License
