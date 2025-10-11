/**
 * 网站配置示例
 * 
 * 如需自定义配置，可以：
 * 1. 复制此文件为 config.js
 * 2. 在 index.html 中的 data.js 之前引入 config.js
 * 3. 修改 app.js 以使用配置
 */

const CONFIG = {
    // 网站标题
    siteTitle: "📚 我的收藏",
    
    // 搜索框占位符
    searchPlaceholder: "搜索收藏...",
    
    // 标签筛选按钮文本
    tagFilterButtonText: "🏷️ 标签筛选",
    
    // 未找到结果提示
    noResultsText: "😕 未找到匹配的收藏",
    
    // 默认主题 ('light' 或 'dark')
    defaultTheme: 'light',
    
    // 每页显示数量（设置为 0 表示不分页）
    itemsPerPage: 0,
    
    // 是否启用动画
    enableAnimations: true,
    
    // 动画持续时间（毫秒）
    animationDuration: 300,
    
    // 是否记住展开状态
    rememberExpandedState: false,
    
    // 卡片网格配置
    grid: {
        minCardWidth: '300px',  // 最小卡片宽度
        gap: '1.5rem'           // 卡片间距
    }
};
