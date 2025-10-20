// 收藏数据
const collectionsData = [
    {
        id: 1,
        title: "食用手册",
        icon: "🍳",
        description: "美食烹饪指南，分享各种料理配方和烹饪技巧",
        tags: ["美食", "料理", "生活"],
        content: `
# 食用手册

食用手册是一个记录和分享美食烹饪的网站，提供各种料理的配方和制作方法。

## 特点

- **详细配方**：提供详细的食材清单和制作步骤
- **图文并茂**：配有精美的图片展示
- **分类清晰**：按菜系、食材等多种方式分类
- **易于上手**：适合烹饪初学者和爱好者

## 内容涵盖

1. 中餐料理
2. 西式料理
3. 日式料理
4. 甜点烘焙
5. 饮品制作

访问 [食用手册](https://cook.yunyoujun.cn/) 探索更多美食。
        `
    },
    {
        id: 2,
        title: "Mereith 的工具集",
        icon: "🛠️",
        description: "实用的在线工具集合，提供各种开发和日常使用工具",
        tags: ["工具", "在线工具", "开发"],
        content: `
# Mereith 的工具集

一个集成了多种实用工具的在线平台，为开发者和普通用户提供便捷的在线工具服务。

## 工具类型

- **文本处理**：文本对比、格式化、编码转换等
- **图片处理**：图片压缩、格式转换、裁剪等
- **开发工具**：JSON 格式化、正则测试、Base64 编码等
- **实用工具**：时间戳转换、二维码生成等

## 特色

1. 界面简洁美观
2. 无需注册登录
3. 完全免费使用
4. 响应式设计，支持移动端

访问 [Mereith 的工具集](https://demo-tools.mereith.com/) 使用各种工具。
        `
    },
    {
        id: 3,
        title: "Linux 工具快速教程",
        icon: "🐧",
        description: "Linux 命令行工具的中文教程文档，适合入门和进阶学习",
        tags: ["Linux", "教程", "开发工具", "文档"],
        content: `
# Linux 工具快速教程

全面的 Linux 命令行工具中文教程，涵盖常用命令和工具的使用方法。

## 内容特点

- **系统全面**：涵盖从基础到进阶的各类工具
- **中文文档**：易于理解的中文说明
- **实例丰富**：提供大量实用示例
- **持续更新**：定期更新和补充内容

## 主要内容

### 基础工具
- 文件操作：ls、cp、mv、rm 等
- 文本处理：grep、sed、awk 等
- 系统管理：ps、top、systemctl 等

### 进阶工具
- 网络工具：curl、wget、netstat 等
- 包管理：apt、yum、dnf 等
- 版本控制：git 命令详解

### 实用技巧
- Shell 脚本编写
- 管道和重定向
- 正则表达式应用

访问 [Linux 工具快速教程](https://linuxtools-rst.readthedocs.io/zh_CN/latest/index.html) 学习更多 Linux 知识。
        `
    },
    {
        id: 4,
        title: "崩坏:星穹铁道 - 流光忆庭",
        icon: "✨",
        description: "《崩坏：星穹铁道》光锥模拟器",
        tags: ["游戏", "工具", "崩坏星穹铁道"],
        content: `
# 崩坏:星穹铁道 - 流光忆庭
访问 [崩坏:星穹铁道 - 流光忆庭](https://light.shenmedouyou.top/) 模拟光锥。
        `
    },
    {
        id: 5,
        title: "崩坏:星穹铁道 - 短信",
        icon: "🚂",
        description: "《崩坏：星穹铁道》短信模拟器",
        tags: ["游戏", "工具", "崩坏星穹铁道"],
        content: `
# 崩坏:星穹铁道 - 短信
访问 [崩坏:星穹铁道 - 短信](https://sr.shenmedouyou.top/) 模拟短信。
        `
    },
    {
        id: 6,
        title: "cpp-peglib",
        icon: "📚",
        description: "C++ 的 PEG（解析表达式文法）解析库，用于构建解析器",
        tags: ["C++", "解析器", "编程库", "开发工具"],
        content: `
# cpp-peglib

cpp-peglib 是一个仅包含头文件的 C++ 库，用于实现 PEG（Parsing Expression Grammar）解析器。

## 主要特性

- **Header-only**：只需包含头文件即可使用
- **简单易用**：直观的 API 设计
- **高性能**：优化的解析性能
- **可扩展**：支持自定义语义动作

## 使用场景

### 编译器开发
- 词法分析
- 语法分析
- AST 构建

### 配置文件解析
- 自定义配置语言
- DSL 设计
- 数据格式解析

## 快速示例

\`\`\`cpp
#include <peglib.h>

using namespace peg;

int main() {
    // 定义语法规则
    parser parser(R"(
        ROOT  <- EXPR
        EXPR  <- NUMBER ('+' NUMBER)*
        NUMBER <- [0-9]+
    )");
    
    // 解析输入
    parser.parse("1+2+3");
    
    return 0;
}
\`\`\`

## 优势

1. **易于集成**：单头文件，无需编译
2. **功能完整**：支持完整的 PEG 语法
3. **文档完善**：提供详细的使用文档
4. **活跃维护**：持续更新和改进

访问 [cpp-peglib 文档](https://yhirose.github.io/cpp-peglib/) 了解更多。
        `
    },
    {
        id: 7,
        title: "二丫讲梵学习周刊",
        icon: "📰",
        description: "技术学习周刊，分享优质技术文章、工具和资源",
        tags: ["技术周刊", "学习", "资源分享", "博客"],
        content: `
# 二丫讲梵学习周刊

一个专注于分享技术学习内容的周刊，定期推荐优质技术文章、工具和学习资源。

## 周刊特点

- **定期更新**：每周更新一期
- **内容精选**：精心筛选的优质内容
- **分类清晰**：技术文章、工具推荐、开源项目等
- **持续积累**：历史期刊可随时查阅

## 主要内容

### 技术文章
- 前端开发
- 后端技术
- DevOps 实践
- 架构设计
- 性能优化

### 工具推荐
- 开发工具
- 效率工具
- 在线服务
- 实用插件

### 开源项目
- 热门项目介绍
- 实用库推荐
- 学习资源

### 行业动态
- 技术趋势
- 大会资讯
- 社区动态

## 适合人群

1. 技术开发者
2. 技术学习者
3. 技术管理者
4. 对技术感兴趣的所有人

访问 [二丫讲梵学习周刊](https://wiki.eryajf.net/learning-weekly/) 获取最新内容。
        `
    },
    {
        id: 8,
        title: "Geometrize Web",
        icon: "🎨",
        description: "将图片转换为几何图形的在线工具，创造独特的艺术效果",
        tags: ["图片处理", "艺术", "在线工具", "创意"],
        content: `
# Geometrize Web

一个有趣的在线图片处理工具，可以将普通图片转换成由几何图形组成的艺术作品。

## 核心功能

- **几何化转换**：将图片分解为基本几何图形
- **多种形状**：支持圆形、三角形、矩形、椭圆等
- **实时预览**：即时查看转换效果
- **参数调整**：自定义图形数量、大小和透明度

## 使用方法

### 基本步骤
1. 上传图片
2. 选择几何形状类型
3. 调整参数设置
4. 预览和导出结果

### 参数说明
- **形状数量**：使用的几何图形数量
- **形状类型**：选择使用的几何形状
- **透明度**：图形的透明程度
- **迭代次数**：优化迭代的次数

## 应用场景

1. **艺术创作**：制作独特的几何艺术作品
2. **头像设计**：创建个性化的几何头像
3. **封面制作**：设计独特的封面图片
4. **教学演示**：展示图像处理算法

## 技术特点

- 基于 Haxe 开发
- 纯前端实现
- 开源项目
- 算法优化

访问 [Geometrize Web](https://www.samcodes.co.uk/project/geometrize-haxe-web/) 体验几何艺术。
        `
    },
    {
        id: 9,
        title: "C++ Insights",
        icon: "🔍",
        description: "C++ 代码转换工具，展示编译器如何解析和转换 C++ 代码",
        tags: ["C++", "编译器", "开发工具", "学习"],
        content: `
# C++ Insights

C++ Insights 是一个强大的在线工具，可以展示 C++ 编译器如何理解和转换你的代码。

## 主要功能

- **代码转换**：显示编译器对代码的转换结果
- **模板展开**：查看模板实例化的结果
- **自动推导**：展示 auto 关键字的推导类型
- **Lambda 展开**：显示 lambda 表达式的完整形式

## 学习价值

### 理解编译器行为
- 查看编译器如何处理代码
- 理解模板元编程
- 掌握类型推导机制
- 学习编译器优化

### 常用场景
1. **调试模板代码**：查看模板实例化结果
2. **理解 auto**：查看类型推导
3. **学习 C++**：理解语法糖背后的实现
4. **代码审查**：检查代码的实际含义

## 使用示例

### 输入代码
\`\`\`cpp
auto add(auto a, auto b) {
    return a + b;
}

int main() {
    auto result = add(1, 2);
}
\`\`\`

### 输出结果
显示完整的模板实例化、类型推导和函数签名。

## 支持的 C++ 特性

- C++11/14/17/20 标准
- 模板和泛型编程
- Lambda 表达式
- 范围 for 循环
- 结构化绑定
- 概念（Concepts）

访问 [C++ Insights](https://cppinsights.io/) 深入理解 C++ 代码。
        `
    },
    {
        id: 10,
        title: "疯狂星期四文案生成器",
        icon: "😂",
        description: "生成随机疯狂星期四文案",
        tags: ["文案", "趣味", "娱乐", "疯狂星期四"],
        content: `
# 疯狂星期四文案生成器

访问 [疯狂星期四文案生成器](https://kfc.shadiao.pro/) 获取随机内容。
        `
    },
    {
        id: 11,
        title: "SauceNAO",
        icon: "🔎",
        description: "反向图片搜索引擎，快速找到图片来源和相关信息",
        tags: ["图片搜索", "反向搜索", "工具", "动漫"],
        content: `
# SauceNAO

SauceNAO 是一个专业的反向图片搜索引擎，特别擅长搜索动漫、插画和艺术作品。

## 主要功能

- **图片反向搜索**：上传图片查找原始来源
- **多数据库支持**：搜索多个图片数据库
- **相似度匹配**：显示匹配度百分比
- **详细信息**：提供图片作者、来源网站等信息

## 支持的数据库

### 主要来源
- **Pixiv**：日本插画社区
- **Twitter**：社交媒体图片
- **Danbooru**：动漫图片库
- **AniDB**：动画数据库
- **DeviantArt**：艺术作品社区

### 其他来源
- H-Magazines
- Manga
- Anime
- 2D Market

## 使用方法

### 网页版
1. 访问 SauceNAO 网站
2. 上传图片或输入图片 URL
3. 查看搜索结果和相似度
4. 点击结果查看详细信息

### API 使用
\`\`\`javascript
// 支持 API 调用
const apiKey = 'your_api_key';
const imageUrl = 'https://example.com/image.jpg';

fetch(\`https://saucenao.com/search.php?api_key=\${apiKey}&url=\${imageUrl}\`)
    .then(response => response.json())
    .then(data => console.log(data));
\`\`\`

## 应用场景

1. **找图溯源**：查找图片的原始出处
2. **版权确认**：确认图片作者和版权信息
3. **艺术鉴赏**：发现更多相似作品
4. **反盗图**：检测自己作品是否被盗用

## 特点优势

- 搜索速度快
- 数据库丰富
- 准确度高
- 支持 API
- 免费使用（有次数限制）

访问 [SauceNAO](https://saucenao.com/) 开始反向搜索图片。
        `
    },
    {
        id: 12,
        title: "Google 开源项目风格指南",
        icon: "https://zh-google-styleguide.readthedocs.io/favicon.ico",
        description: "每个较大的开源项目都有自己的风格指南：关于如何为该项目编写代码的一系列约定（有时候会比较武断）。当所有代码均保持一致的风格，在理解大型代码库时更为轻松。",
        tags: ["C++", "风格指南", "谷歌"],
        content: `
\`\`\`markdown
# Google 开源项目风格指南——中文版¶

[地址](https://zh-google-styleguide.readthedocs.io/)

每个较大的开源项目都有自己的风格指南：关于如何为该项目编写代码的一系列约定（有时候会比较武断）。当所有代码均保持一致的风格，在理解大型代码库时更为轻松。

“风格”的含义涵盖范围广，从“变量使用驼峰格式（camelCase）”到“决不使用全局变量”再到“决不使用异常”，等等诸如此类。

英文版项目维护的是在 Google 使用的编程风格指南。如果你正在修改的项目源自 Google，你可能会被引导至英文版项目页面，以了解项目所使用的风格。
\`\`\`
        `
    },
    {
        id: 13,
        title: "ACG盒子",
        icon: "https://www.acgbox.link/favicon.ico",
        description: "专注ACG的导航盒子",
        tags: ["ACG", "动漫", "导航"],
        content: `
[acgbox.link](https://www.acgbox.link/)
        `
    },
    {
        id: 14,
        title: "游戏下载网站",
        icon: "https://gamingbeasts.com/favicon.ico",
        description: "game download",
        tags: ["在线工具"],
        content: `
[gamingbeasts.com](https://gamingbeasts.com)
        `
    },
    {
        id: 15,
        title: "DeepWiki",
        icon: "https://deepwiki.com/favicon.ico",
        description: "GitHub repo wiki, generated by AI",
        tags: ["AI", "wiki", "工具", "GitHub"],
        content: `
[deepwiki.com/](https://deepwiki.com/)
        `
    }
];
