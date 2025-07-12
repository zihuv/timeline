# IndexedDB 升级说明

## 概述

本项目已成功将前端数据存储从 localStorage 升级到 IndexedDB，并使用 Dexie.js 库简化了数据库操作。

## 主要改进

### 1. 使用 Dexie.js
- 替换了原生 IndexedDB API，大幅简化了数据库操作
- 提供了更友好的 Promise 接口
- 支持事务和批量操作
- 自动处理数据库版本升级

### 2. 数据库结构
```javascript
// 数据库名称: TimelineDiaryDB
// 版本: 1
// 对象存储: diaries
// 索引: id, date, createdAt, updatedAt
```

### 3. 新增功能
- **搜索功能**: 支持按标题、内容、标签搜索日记
- **日期范围查询**: 支持按日期范围获取日记
- **最近日记**: 获取最近更新的日记
- **心情统计**: 统计不同心情的日记数量
- **标签统计**: 统计标签使用频率
- **健康检查**: 数据库状态监控
- **批量导入**: 使用事务进行批量数据导入

### 4. 性能优化
- 使用索引提高查询性能
- 支持事务操作，提高批量操作效率
- 移除了 localStorage 的大小限制
- 更好的数据持久化

## 文件变更

### 新增文件
- `frontend/src/utils/indexeddb.js` - IndexedDB 服务类
- `frontend/test-indexeddb.html` - 功能测试页面

### 修改文件
- `frontend/src/utils/api.js` - 更新本地存储方法
- `frontend/src/components/DataManager.vue` - 更新数据管理界面
- `frontend/src/main.js` - 简化应用初始化
- `frontend/package.json` - 添加 Dexie.js 依赖

## API 接口

### 基础操作
```javascript
// 获取指定日期的日记
await indexedDBService.getDiaries(date)

// 保存日记
await indexedDBService.saveDiary(diary)

// 更新日记
await indexedDBService.updateDiary(id, data)

// 删除日记
await indexedDBService.deleteDiary(id)

// 获取所有日记
await indexedDBService.getAllDiaries()

// 清空所有数据
await indexedDBService.clearAll()
```

### 高级功能
```javascript
// 搜索日记
await indexedDBService.searchDiaries(query)

// 按日期范围获取日记
await indexedDBService.getDiariesByDateRange(startDate, endDate)

// 获取最近的日记
await indexedDBService.getRecentDiaries(limit)

// 获取心情统计
await indexedDBService.getMoodStats()

// 获取标签统计
await indexedDBService.getTagStats()

// 数据库健康检查
await indexedDBService.healthCheck()
```

### 数据管理
```javascript
// 导出数据
const jsonData = await indexedDBService.exportData()

// 导入数据
const result = await indexedDBService.importData(jsonData)

// 获取统计信息
const stats = await indexedDBService.getStats()
```

## 数据格式

日记数据结构：
```javascript
{
  id: "雪花ID",
  date: "2024-01-01",
  title: "日记标题",
  content: "日记内容",
  mood: "happy",
  tags: ["标签1", "标签2"],
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z"
}
```

## 兼容性

- 完全移除了 localStorage 依赖
- 不再需要数据迁移功能
- 支持现代浏览器的 IndexedDB API
- 使用 Dexie.js 提供更好的兼容性

## 测试

可以使用 `frontend/test-indexeddb.html` 页面测试所有功能：
1. 数据库状态检查
2. 数据增删改查
3. 搜索和统计功能
4. 数据导入导出
5. 健康检查

## 注意事项

1. IndexedDB 是异步操作，所有方法都返回 Promise
2. 数据库操作失败时会抛出异常，需要适当的错误处理
3. 浏览器隐私模式下 IndexedDB 可能不可用
4. 建议定期备份重要数据

## 未来扩展

- 支持数据加密
- 添加数据压缩
- 实现增量同步
- 支持离线模式
- 添加数据版本控制 