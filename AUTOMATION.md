# 新增收藏自动化功能说明

## 概述

本次更新实现了新增收藏的自动化处理流程，用户可以通过提交 GitHub Issue 来添加新的收藏，系统会自动处理并直接提交到仓库。

## 功能特性

### 1. 标准化的 Issue 格式

- **网站生成格式**：使用 YAML 代码块格式，便于自动化解析
- **GitHub 表单格式**：使用 GitHub Issue 表单模板，提供友好的用户界面

### 2. 自动化工作流

- **触发条件**：
  - 当 Issue 被添加 `add-favorite` 标签时（推荐）
  - 或 Issue 标题以 "Add Favorite:" 开头时（备用方案）
- **处理流程**：
  1. 解析 Issue 内容
  2. 验证数据格式
  3. 提取收藏信息（标题、图标、描述、标签、内容）
  4. 自动生成唯一 ID
  5. 将数据添加到 data.js
  6. 直接提交到仓库（无需审核）
  7. 自动关闭 Issue 并添加确认评论

**注意**：
- 工作流支持标签事件和 Issue 创建事件双重触发，确保不会因标签添加失败而导致处理失败
- 如果 Issue 模板未能自动添加标签，工作流会通过标题识别（标题以 "Add Favorite:" 开头）
- 网站提交时会自动在 URL 中包含 `add-favorite` 标签参数

### 3. 双路径支持

#### 路径 A：通过网站提交（推荐）

```
用户访问网站
  ↓
点击"新增收藏"按钮
  ↓
填写表单并预览
  ↓
提交到 GitHub（自动跳转，自动添加标签）
  ↓
GitHub Actions 自动处理
  ↓
直接提交到仓库
  ↓
自动部署上线
```

#### 路径 B：直接在 GitHub 提交

```
用户访问 GitHub Issues
  ↓
选择"新增收藏"模板（自动添加标签）
  ↓
填写表单
  ↓
提交 Issue
  ↓
GitHub Actions 自动处理
  ↓
直接提交到仓库
  ↓
自动部署上线
```

## 技术实现

### 修改的文件

1. **app.js**
   - 更新 Issue 内容生成逻辑
   - 使用 YAML 格式替代纯文本格式
   - 简化 Issue 内容，移除手动代码块

2. **.github/ISSUE_TEMPLATE/add-collection.yml** (新增)
   - GitHub Issue 表单模板
   - 包含所有必填字段
   - 字段验证和占位符

3. **.github/workflows/process-collection-issue.yml** (新增)
   - 自动化处理工作流
   - 双格式解析支持（YAML + 表单）
   - 自动生成 ID 和代码
   - 直接提交到仓库（不创建 PR）
   - 双重触发机制（标签 + 标题检测）

4. **README.md & GUIDE.md**
   - 更新使用说明
   - 添加自动化流程文档
   - 提供两种提交方式的说明

### Issue 格式示例

#### 从网站生成的格式：

```markdown
<!-- 此 Issue 由网站前端自动生成，请勿修改格式 -->

\`\`\`yaml
title: Test Collection
icon: 🎯
description: This is a test collection
tags: test, demo, sample
\`\`\`

## 详细内容

\`\`\`markdown
# Test Collection

This is the detailed content...
\`\`\`

---
*此 Issue 将被自动处理并添加到收藏列表中*
```

#### GitHub 表单生成的格式：

```markdown
### 标题

Test Collection

### 图标

🎯

### 描述

This is a test collection

### 标签

test, demo, sample

### 详细内容

# Test Collection

This is the detailed content...
```

## 测试验证

已完成以下测试：

1. ✅ YAML 格式解析
2. ✅ GitHub 表单格式解析
3. ✅ data.js 插入逻辑
4. ✅ ID 自动生成
5. ✅ JavaScript 语法验证

## 使用方法

### 作为贡献者

1. 访问网站或 GitHub Issues 页面
2. 填写新增收藏信息
3. 提交后等待自动处理（通常几秒钟内完成）
4. 检查 Issue 中的确认评论

### 作为维护者

1. 收到 Issue 通知
2. GitHub Actions 自动处理并提交
3. 新收藏自动部署上线
4. Issue 自动关闭

**注意**：现在无需手动审核 PR，系统会直接提交。如果需要审核机制，可以通过分支保护规则设置。

## 注意事项

1. **Issue 标签**：推荐使用 `add-favorite` 标签（Issue 模板会自动添加），如果标签未能添加，工作流会通过标题检测（标题以 "Add Favorite:" 开头）
2. **格式规范**：建议使用提供的模板或网站表单，避免格式错误
3. **ID 冲突**：系统会自动生成唯一 ID，无需手动指定
4. **直接提交**：系统现在直接提交到主分支，不再创建 PR。如果需要审核机制，请设置分支保护规则
5. **错误处理**：如果解析失败，会在 Issue 中评论错误信息
6. **触发方式**：工作流支持标签添加和 Issue 创建事件，确保不会漏掉任何提交

## 未来改进

可能的增强功能：

- [ ] 添加内容预览功能
- [ ] 支持图片上传
- [ ] 自动标签建议
- [ ] 重复检测
- [ ] 可选的 PR 审核模式（通过配置开关）

## 相关链接

- [Issue 模板](.github/ISSUE_TEMPLATE/add-collection.yml)
- [自动化工作流](.github/workflows/process-collection-issue.yml)
- [使用指南](GUIDE.md)
- [项目 README](README.md)
