# 修复重复提交问题总结

## 问题描述

新增收藏时会触发两次工作流执行，导致 `data.js` 中出现重复的条目（如 id: 12 和 13 的 TEST 条目）。

## 根本原因

工作流文件 `.github/workflows/process-collection-issue.yml` 配置了双重触发机制：

1. **`issues.opened` 事件** - 当 Issue 标题以 "Add Favorite:" 开头时触发
2. **`issues.labeled` 事件** - 当添加 `add-favorite` 标签时触发

当使用 Issue 模板（`.github/ISSUE_TEMPLATE/add-collection.yml`）创建 Issue 时：
- Issue 模板自动设置标题为 "Add Favorite: [标题]"
- Issue 模板自动添加 `add-favorite` 标签

这导致两个事件都被触发，工作流运行两次，添加了两次相同的收藏。

## 解决方案

### 1. 移除 `opened` 事件触发器

**修改前：**
```yaml
on:
  issues:
    types: [opened, labeled]
```

**修改后：**
```yaml
on:
  issues:
    types: [labeled]
```

### 2. 简化条件判断

**修改前：**
```yaml
if: |
  (github.event.action == 'labeled' && github.event.label.name == 'add-favorite') ||
  (github.event.action == 'opened' && startsWith(github.event.issue.title, 'Add Favorite:'))
```

**修改后：**
```yaml
if: github.event.label.name == 'add-favorite'
```

### 3. 添加重复检测机制

在解析 Issue 内容后添加检查逻辑：

```javascript
// 检查是否已存在相同标题的收藏 (防止重复添加)
const escapedTitle = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const duplicateCheck = new RegExp(`title:\\s*"${escapedTitle}"`, 'i');
if (duplicateCheck.test(dataContent)) {
  console.log('Duplicate entry detected, skipping...');
  core.setOutput('skipped', 'true');
  return;
}
```

### 4. 跳过重复条目的提交

为提交步骤添加条件：

```yaml
- name: Commit and push changes
  if: steps.parse.outputs.skipped != 'true'
  run: |
    # 提交代码...
```

### 5. 提供适当的用户反馈

更新关闭 Issue 步骤，根据是否跳过提供不同的消息：

```javascript
let body;
if (skipped === 'true') {
  body = `ℹ️ This favorite already exists in the collection.`;
} else {
  body = `✅ Your favorite has been automatically added!`;
}
```

## 其他改进

### 清理重复数据

移除了 `data.js` 中的重复测试条目（id: 12 和 13）：
- 修改前：13 个条目
- 修改后：11 个条目

### 更新文档

更新了以下文档以反映修复：
- `AUTOMATION.md` - 移除双重触发机制的描述，添加重复检测说明
- `README.md` - 更新触发条件和处理流程说明
- `GUIDE.md` - 简化自动处理步骤描述

## 验证

已验证：
- ✅ 工作流 YAML 语法正确
- ✅ 只在 `labeled` 事件触发
- ✅ 包含重复检测逻辑
- ✅ 提交步骤在重复时跳过
- ✅ data.js 语法正确，包含 11 个有效条目

## 效果

1. **防止重复提交** - 即使工作流被意外触发多次，也只会添加一次
2. **提高效率** - 每次提交只运行一次工作流，节省 Actions 使用时间
3. **更好的用户体验** - 提供清晰的反馈信息，告知用户是否添加成功或检测到重复
4. **数据质量** - 清理了已有的重复条目，保持数据整洁

## 技术细节

### 为什么只保留 `labeled` 事件？

1. **Issue 模板自动添加标签** - 所有通过模板创建的 Issue 都会自动获得 `add-favorite` 标签
2. **网站提交也包含标签** - 网站生成的 Issue URL 包含 `labels=add-favorite` 参数
3. **单一触发点** - 只依赖标签事件可以避免双重触发

### 重复检测的实现

- 使用正则表达式匹配标题
- 转义特殊字符以支持各种标题格式
- 不区分大小写匹配
- 早期返回避免不必要的处理

### 向后兼容性

修复后的工作流仍然支持：
- ✅ 通过网站表单提交
- ✅ 直接使用 GitHub Issue 模板
- ✅ 手动添加 `add-favorite` 标签到现有 Issue

## 相关文件

- `.github/workflows/process-collection-issue.yml` - 主要修复
- `.github/ISSUE_TEMPLATE/add-collection.yml` - Issue 模板（无需修改）
- `data.js` - 清理重复条目
- `AUTOMATION.md`, `README.md`, `GUIDE.md` - 文档更新
