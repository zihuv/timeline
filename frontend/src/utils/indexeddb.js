import Dexie from 'dexie'
import { generateId } from './snowflake.js'

// 使用 Dexie.js 的数据库类
class TimelineDiaryDB extends Dexie {
  constructor() {
    super('TimelineDiaryDB')
    
    // 定义数据库结构
    this.version(1).stores({
      diaries: 'id, date, timestamp, createdAt, updatedAt'
    })
  }
}

// 创建数据库实例
const db = new TimelineDiaryDB()

// IndexedDB 服务类
class IndexedDBService {
  constructor() {
    this.db = db
  }

  // 获取指定日期的日记
  async getDiaries(date) {
    try {
      return await this.db.diaries
        .where('date')
        .equals(date)
        .toArray()
    } catch (error) {
      console.error('获取日记失败:', error)
      return []
    }
  }

  // 保存日记
  async saveDiary(diary) {
    try {
      const newDiary = {
        ...diary,
        id: diary.id || generateId(), // 保留原有ID，如果没有则生成新ID
        createdAt: diary.createdAt || new Date().toISOString(),
        updatedAt: diary.updatedAt || new Date().toISOString()
      }

      // 确保有 timestamp 字段
      if (!newDiary.timestamp) {
        newDiary.timestamp = new Date().toLocaleTimeString('zh-CN', { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
      }

      await this.db.diaries.add(newDiary)
      console.log('日记保存成功:', newDiary.id)
      return newDiary
    } catch (error) {
      console.error('保存日记失败:', error)
      throw error
    }
  }

  // 更新日记
  async updateDiary(id, data) {
    try {
      const existingDiary = await this.db.diaries.get(id)
      if (!existingDiary) {
        throw new Error('未找到要更新的日记')
      }

      const updatedDiary = {
        ...existingDiary,
        ...data,
        updatedAt: new Date().toISOString()
      }

      await this.db.diaries.put(updatedDiary)
      console.log('日记更新成功:', id)
      return updatedDiary
    } catch (error) {
      console.error('更新日记失败:', error)
      throw error
    }
  }

  // 删除日记
  async deleteDiary(id) {
    try {
      await this.db.diaries.delete(id)
      console.log('日记删除成功:', id)
      return true
    } catch (error) {
      console.error('删除日记失败:', error)
      throw error
    }
  }

  // 获取所有日记
  async getAllDiaries() {
    try {
      return await this.db.diaries.toArray()
    } catch (error) {
      console.error('获取所有日记失败:', error)
      return []
    }
  }

  // 清空所有数据
  async clearAll() {
    try {
      await this.db.diaries.clear()
      console.log('IndexedDB 数据已清空')
      return true
    } catch (error) {
      console.error('清空数据失败:', error)
      throw error
    }
  }

  // 彻底清理数据库（包括删除数据库）
  async clearAllCompletely() {
    try {
      // 先清空数据
      await this.db.diaries.clear()
      
      // 关闭数据库连接
      this.db.close()
      
      // 删除数据库
      await Dexie.delete(this.dbName)
      
      // 重新创建数据库
      this.db = new TimelineDiaryDB()
      
      console.log('数据库已彻底清理并重新创建')
      return true
    } catch (error) {
      console.error('彻底清理数据库失败:', error)
      throw error
    }
  }

  // 导出数据为 JSON
  async exportData() {
    try {
      const diaries = await this.getAllDiaries()
      return JSON.stringify(diaries, null, 2)
    } catch (error) {
      console.error('导出数据失败:', error)
      throw error
    }
  }

  // 导入数据
  async importData(jsonData) {
    try {
      const diaries = JSON.parse(jsonData)
      let importedCount = 0

      // 使用事务批量导入
      await this.db.transaction('rw', this.db.diaries, async () => {
        for (const diary of diaries) {
          try {
            // 确保有ID和时间戳
            const diaryWithId = {
              ...diary,
              id: diary.id || generateId(),
              createdAt: diary.createdAt || new Date().toISOString(),
              updatedAt: diary.updatedAt || new Date().toISOString()
            }
            await this.db.diaries.put(diaryWithId)
            importedCount++
          } catch (error) {
            console.error('导入日记失败:', diary.id, error)
          }
        }
      })

      console.log(`成功导入 ${importedCount} 条日记`)
      return { success: true, imported: importedCount }
    } catch (error) {
      console.error('导入数据失败:', error)
      return { success: false, error: error.message }
    }
  }

  // 获取数据库统计信息
  async getStats() {
    try {
      const diaries = await this.getAllDiaries()
      const dateCounts = {}
      
      diaries.forEach(diary => {
        const date = diary.date
        dateCounts[date] = (dateCounts[date] || 0) + 1
      })

      return {
        totalDiaries: diaries.length,
        dateCounts,
        uniqueDates: Object.keys(dateCounts).length
      }
    } catch (error) {
      console.error('获取统计信息失败:', error)
      return {
        totalDiaries: 0,
        dateCounts: {},
        uniqueDates: 0
      }
    }
  }

  // 搜索日记
  async searchDiaries(query) {
    try {
      const diaries = await this.getAllDiaries()
      const lowerQuery = query.toLowerCase()
      
      return diaries.filter(diary => 
        diary.title?.toLowerCase().includes(lowerQuery) ||
        diary.content?.toLowerCase().includes(lowerQuery) ||
        diary.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
      )
    } catch (error) {
      console.error('搜索日记失败:', error)
      return []
    }
  }

  // 按日期范围获取日记
  async getDiariesByDateRange(startDate, endDate) {
    try {
      return await this.db.diaries
        .where('date')
        .between(startDate, endDate, true, true)
        .toArray()
    } catch (error) {
      console.error('按日期范围获取日记失败:', error)
      return []
    }
  }

  // 获取最近的日记
  async getRecentDiaries(limit = 10) {
    try {
      return await this.db.diaries
        .orderBy('updatedAt')
        .reverse()
        .limit(limit)
        .toArray()
    } catch (error) {
      console.error('获取最近日记失败:', error)
      return []
    }
  }

  // 按心情统计
  async getMoodStats() {
    try {
      const diaries = await this.getAllDiaries()
      const moodCounts = {}
      
      diaries.forEach(diary => {
        const mood = diary.mood || 'unknown'
        moodCounts[mood] = (moodCounts[mood] || 0) + 1
      })

      return moodCounts
    } catch (error) {
      console.error('获取心情统计失败:', error)
      return {}
    }
  }

  // 获取标签统计
  async getTagStats() {
    try {
      const diaries = await this.getAllDiaries()
      const tagCounts = {}
      
      diaries.forEach(diary => {
        if (diary.tags && Array.isArray(diary.tags)) {
          diary.tags.forEach(tag => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1
          })
        }
      })

      return tagCounts
    } catch (error) {
      console.error('获取标签统计失败:', error)
      return {}
    }
  }

  // 数据库健康检查
  async healthCheck() {
    try {
      const stats = await this.getStats()
      return {
        status: 'healthy',
        totalDiaries: stats.totalDiaries,
        uniqueDates: stats.uniqueDates,
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      }
    }
  }
}

// 创建全局 IndexedDB 服务实例
const indexedDBService = new IndexedDBService()

export default indexedDBService 