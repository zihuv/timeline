# 时间轴日记应用

一个基于Vue 3和Go的时间轴日记应用，支持本地存储和远程服务器两种模式。

## 功能特性

- 📝 时间轴日记记录
- 🖼️ 图片上传和预览
- ⚙️ 可配置后端服务器地址
- 💾 本地存储模式（无需服务器）
- 🌐 远程服务器模式（数据持久化）
- 📊 数据导入导出功能
- 🔄 本地与服务器数据同步
- 🤖 智能数据同步（自动分析推荐策略）
- 🗑️ 数据清理功能（安全确认机制）
- 📱 响应式设计，支持移动端

## 配置功能说明

### 配置选项

应用支持两种运行模式：

1. **本地存储模式**（默认）
   - 数据存储在浏览器本地
   - 无需配置服务器地址
   - 适合个人使用

2. **远程服务器模式**
   - 数据存储在后端服务器
   - 需要配置服务器地址
   - 支持多设备同步

### 配置方法

1. 点击应用右上角的"配置"按钮
2. 在配置对话框中输入后端服务器地址
   - 示例：`http://localhost:8080`
   - 示例：`https://your-server.com`
3. 点击"测试连接"验证服务器是否可用
4. 点击"保存配置"完成配置

### 配置存储

- **本地存储**：配置始终保存在浏览器本地
- **服务器存储**：如果配置了服务器地址，配置也会保存到服务器

## 开发环境

### 前端开发

```bash
cd frontend
npm install
npm run dev
```

### 后端开发

```bash
cd backend
go mod tidy
go run main.go
```

### 构建部署

```bash
# 构建前端
cd frontend
npm run build

# 运行后端（会自动服务前端静态文件）
cd backend
go run main.go
```

## API接口

### 配置相关

- `GET /api/health` - 健康检查
- `GET /api/config` - 获取配置
- `POST /api/config` - 保存配置

### 日记相关

- `GET /api/diaries` - 获取所有日记
- `GET /api/diaries/date?date=YYYY-MM-DD` - 获取指定日期的日记
- `POST /api/diaries` - 创建新日记
- `PUT /api/diaries/:id` - 更新日记
- `DELETE /api/diaries/:id` - 删除日记

## 技术栈

### 前端
- Vue 3 (Composition API)
- Element Plus
- Vite

### 后端
- Go
- Gin框架
- GORM
- SQLite

## 使用说明

1. **首次使用**：应用默认使用本地存储模式，无需配置即可开始使用
2. **配置服务器**：如需数据同步或多设备使用，可配置后端服务器地址
3. **切换模式**：配置变化后，应用会自动切换存储模式
4. **数据迁移**：支持本地数据与服务器数据的双向同步
5. **智能同步**：根据数据状态自动推荐最佳同步策略

## 智能同步功能

### 自动分析场景
- **本地无数据，云端有数据** → 自动推荐从云端下载
- **本地有数据，云端无数据** → 自动推荐上传到云端
- **本地和云端都有数据** → 自动推荐智能合并

### 智能合并算法
- 按时间戳自动合并数据
- 保留最新的数据版本
- 避免数据冲突和重复
- 支持手动选择合并策略

### 用户提示
- 实时显示数据状态分析
- 详细的操作说明和建议
- 同步进度和结果反馈
- 安全确认机制

## 数据管理功能

### 数据导出
- **本地数据导出**：将浏览器本地存储的日记导出为JSON文件
- **服务器数据导出**：将服务器上的日记导出为JSON文件
- **全部数据导出**：合并本地和服务器数据后导出

### 数据导入
- **合并模式**：将导入的数据与现有数据合并，保留现有数据
- **覆盖模式**：用导入的数据完全替换现有数据
- **支持格式**：JSON格式的日记数据文件

### 数据同步
- **同步到服务器**：将本地数据上传到服务器
- **从服务器同步**：将服务器数据下载到本地
- **数据统计**：显示本地和服务器数据的统计信息

### 数据清理
- **本地数据清理**：删除浏览器本地存储的所有日记数据
- **服务器数据清理**：删除服务器数据库中的所有日记数据
- **全部数据清理**：同时清理本地和服务器数据
- **安全确认**：详细的确认对话框，防止误操作

### 使用步骤
1. 点击右上角"数据管理"按钮
2. 选择相应的功能（导出/导入/同步/清理）
3. 按照提示完成操作
4. 查看操作结果和统计信息

## 注意事项

- 本地存储模式的数据仅保存在当前浏览器中
- 清除浏览器数据会导致本地数据丢失
- 服务器模式需要确保后端服务正常运行
- 建议定期备份重要数据 