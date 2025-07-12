# GitHub Pages 自动部署说明

## 概述

本项目已配置 GitHub Actions 来自动部署前端页面到 GitHub Pages。当代码推送到 `main` 或 `master` 分支时，会自动触发构建和部署流程。

## 部署地址

- 生产环境：https://zihuv.github.io/timeline/

## 配置说明

### 1. GitHub Actions 工作流

工作流文件位置：`.github/workflows/deploy.yml`

该工作流包含以下步骤：
- 检出代码
- 设置 Node.js 环境
- 安装依赖
- 构建前端项目
- 部署到 GitHub Pages

### 2. Vite 配置

在 `frontend/vite.config.js` 中已配置：
- `base: '/timeline/'` - 设置正确的 base 路径以匹配 GitHub Pages 的 URL 结构

### 3. 触发条件

- 推送到 `main` 或 `master` 分支时自动触发
- 创建 Pull Request 时也会触发构建（但不部署）

## 手动部署

如果需要手动触发部署，可以：

1. 在 GitHub 仓库页面点击 "Actions" 标签
2. 选择 "Deploy to GitHub Pages" 工作流
3. 点击 "Run workflow" 按钮

## 注意事项

1. 确保 GitHub 仓库已启用 GitHub Pages 功能
2. 在仓库设置中，GitHub Pages 源应设置为 "GitHub Actions"
3. 首次部署可能需要几分钟时间
4. 部署成功后，页面会在 https://zihuv.github.io/timeline/ 可用

## 故障排除

如果部署失败，请检查：

1. GitHub Actions 日志中的错误信息
2. 确保 `frontend/package.json` 中的构建脚本正确
3. 确保所有依赖都已正确安装
4. 检查 GitHub Pages 设置是否正确配置

## 本地测试

在推送代码前，可以在本地测试构建：

```bash
cd frontend
npm install
npm run build
```

构建成功后，`dist` 目录中的文件就是将要部署的内容。 