// 示例数据 - 请根据实际需求修改
const collectionsData = [
    {
        id: 1,
        title: "GitHub Copilot",
        icon: "🤖",
        description: "AI 驱动的代码助手，帮助开发者更快地编写更好的代码",
        tags: ["AI", "开发工具", "编程"],
        content: `
# GitHub Copilot

GitHub Copilot 是一个由 AI 驱动的代码助手，它可以帮助你更快地编写代码。

## 主要特性

- **智能代码补全**：根据上下文提供代码建议
- **自动生成代码**：从注释生成完整的函数
- **多语言支持**：支持 Python、JavaScript、TypeScript、Go 等多种语言
- **学习能力**：从公开代码库中学习最佳实践

## 使用场景

1. 快速原型开发
2. 学习新的编程语言和框架
3. 提高代码质量和一致性
4. 减少重复性工作

## 示例

\`\`\`javascript
// 输入注释，Copilot 会生成代码
// 创建一个函数，计算数组的平均值
function average(arr) {
    return arr.reduce((a, b) => a + b, 0) / arr.length;
}
\`\`\`

访问 [GitHub Copilot 官网](https://github.com/features/copilot) 了解更多信息。
        `
    },
    {
        id: 2,
        title: "Visual Studio Code",
        icon: "📝",
        description: "轻量级但功能强大的源代码编辑器，支持多种编程语言",
        tags: ["开发工具", "编辑器", "IDE"],
        content: `
# Visual Studio Code

Visual Studio Code 是微软开发的免费开源代码编辑器，拥有丰富的扩展生态系统。

## 核心功能

- **语法高亮**：支持数百种编程语言
- **智能感知**：代码补全和参数提示
- **调试功能**：内置调试器，支持断点和变量查看
- **Git 集成**：内置版本控制功能
- **扩展市场**：海量扩展可选

## 推荐扩展

1. **Prettier** - 代码格式化工具
2. **ESLint** - JavaScript 代码检查
3. **GitLens** - Git 增强工具
4. **Live Server** - 本地开发服务器

访问 [VS Code 官网](https://code.visualstudio.com/) 下载使用。
        `
    },
    {
        id: 3,
        title: "Markdown",
        icon: "📄",
        description: "轻量级标记语言，易于阅读和编写的纯文本格式",
        tags: ["文档", "格式", "写作"],
        content: `
# Markdown

Markdown 是一种轻量级标记语言，它允许人们使用易读易写的纯文本格式编写文档。

## 基本语法

### 标题
\`\`\`
# 一级标题
## 二级标题
### 三级标题
\`\`\`

### 列表
- 无序列表项 1
- 无序列表项 2

1. 有序列表项 1
2. 有序列表项 2

### 强调
- **粗体文本**
- *斜体文本*
- ~~删除线~~

### 链接和图片
- [链接文本](https://example.com)
- ![图片描述](image.jpg)

### 代码
\`行内代码\`

\`\`\`
代码块
\`\`\`

## 应用场景

1. 技术文档编写
2. 博客文章
3. README 文件
4. 笔记和知识管理

Markdown 被广泛应用于 GitHub、Stack Overflow、Reddit 等平台。
        `
    },
    {
        id: 4,
        title: "Docker",
        icon: "🐳",
        description: "容器化平台，简化应用程序的开发、部署和运行",
        tags: ["DevOps", "容器", "开发工具"],
        content: `
# Docker

Docker 是一个开源的容器化平台，可以将应用程序及其依赖打包到一个可移植的容器中。

## 核心概念

### 镜像 (Image)
只读的模板，用于创建容器。

### 容器 (Container)
镜像的运行实例，包含应用程序及其所有依赖。

### Dockerfile
用于构建 Docker 镜像的文本文件。

## 常用命令

\`\`\`bash
# 拉取镜像
docker pull nginx

# 运行容器
docker run -d -p 80:80 nginx

# 查看运行中的容器
docker ps

# 停止容器
docker stop <container_id>
\`\`\`

## 优势

1. **环境一致性**：开发、测试、生产环境完全一致
2. **快速部署**：秒级启动，快速扩展
3. **资源隔离**：每个容器独立运行
4. **轻量级**：比虚拟机更节省资源

访问 [Docker 官网](https://www.docker.com/) 开始使用。
        `
    },
    {
        id: 5,
        title: "React",
        icon: "⚛️",
        description: "用于构建用户界面的 JavaScript 库，由 Facebook 开发",
        tags: ["前端", "JavaScript", "框架"],
        content: `
# React

React 是一个用于构建用户界面的 JavaScript 库，它采用组件化的开发方式。

## 核心特性

### 组件化
将 UI 拆分为独立、可复用的组件。

\`\`\`jsx
function Welcome(props) {
    return <h1>Hello, {props.name}</h1>;
}
\`\`\`

### 虚拟 DOM
React 使用虚拟 DOM 来优化渲染性能。

### 单向数据流
数据从父组件流向子组件，使应用更可预测。

### JSX 语法
在 JavaScript 中编写类似 HTML 的语法。

## React Hooks

- **useState** - 状态管理
- **useEffect** - 副作用处理
- **useContext** - 上下文共享
- **useReducer** - 复杂状态管理

\`\`\`jsx
import { useState } from 'react';

function Counter() {
    const [count, setCount] = useState(0);
    
    return (
        <button onClick={() => setCount(count + 1)}>
            Count: {count}
        </button>
    );
}
\`\`\`

## 生态系统

- **React Router** - 路由管理
- **Redux** - 状态管理
- **Next.js** - 服务端渲染框架
- **React Native** - 移动应用开发

访问 [React 官网](https://react.dev/) 学习更多。
        `
    },
    {
        id: 6,
        title: "Tailwind CSS",
        icon: "🎨",
        description: "实用优先的 CSS 框架，快速构建现代网站",
        tags: ["前端", "CSS", "框架"],
        content: `
# Tailwind CSS

Tailwind CSS 是一个实用优先的 CSS 框架，它提供了大量的工具类来构建自定义设计。

## 核心理念

### 实用优先
直接在 HTML 中使用工具类，而不是编写自定义 CSS。

\`\`\`html
<button class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
    按钮
</button>
\`\`\`

### 响应式设计
使用前缀轻松实现响应式布局。

\`\`\`html
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    <!-- 内容 -->
</div>
\`\`\`

## 主要优势

1. **快速开发**：不需要命名 CSS 类
2. **高度可定制**：通过配置文件定制设计系统
3. **性能优化**：自动删除未使用的 CSS
4. **一致性**：设计约束保证 UI 一致性

## 常用工具类

- **布局**：flex, grid, container
- **间距**：m-*, p-*, space-*
- **颜色**：bg-*, text-*, border-*
- **排版**：text-*, font-*, leading-*
- **效果**：shadow-*, rounded-*, opacity-*

访问 [Tailwind CSS 官网](https://tailwindcss.com/) 了解更多。
        `
    }
];
