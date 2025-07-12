import configManager from './config.js'
import { generateId } from './snowflake.js'

// API服务类
class ApiService {
  constructor() {
    this.configManager = configManager
  }

  // 获取API基础URL
  getApiBaseUrl() {
    return this.configManager.getApiBaseUrl()
  }

  // 检查是否使用服务器模式
  isServerMode() {
    return this.configManager.hasServerConfig()
  }

  // 通用请求方法
  async request(url, options = {}) {
    const apiUrl = `${this.getApiBaseUrl()}${url}`
    
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    }

    const finalOptions = { ...defaultOptions, ...options }

    try {
      const response = await fetch(apiUrl, finalOptions)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error(`API请求失败: ${apiUrl}`, error)
      throw error
    }
  }

  // 获取日记列表
  async getDiaries(date) {
    if (this.isServerMode()) {
      // 服务器模式：从后端获取数据
      return await this.request(`/diaries/date?date=${date}`)
    } else {
      // 本地模式：从localStorage获取数据
      return this.getLocalDiaries(date)
    }
  }

  // 保存日记
  async saveDiary(diary) {
    if (this.isServerMode()) {
      // 服务器模式：保存到后端
      return await this.request('/diaries', {
        method: 'POST',
        body: JSON.stringify(diary)
      })
    } else {
      // 本地模式：保存到localStorage
      return this.saveLocalDiary(diary)
    }
  }

  // 更新日记
  async updateDiary(id, data) {
    if (this.isServerMode()) {
      // 服务器模式：更新到后端
      return await this.request(`/diaries/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      })
    } else {
      // 本地模式：更新到localStorage
      return this.updateLocalDiary(id, data)
    }
  }

  // 删除日记
  async deleteDiary(id) {
    if (this.isServerMode()) {
      // 服务器模式：从后端删除
      return await this.request(`/diaries/${id}`, {
        method: 'DELETE'
      })
    } else {
      // 本地模式：从localStorage删除
      return this.deleteLocalDiary(id)
    }
  }

  // 测试服务器连接
  async testConnection() {
    if (!this.isServerMode()) {
      throw new Error('未配置服务器地址')
    }
    return await this.request('/health')
  }

  // 本地存储相关方法
  getLocalDiaries(date) {
    try {
      const allDiaries = JSON.parse(localStorage.getItem('diaries') || '[]')
      const dayDiary = allDiaries.find(d => d.date === date)
      return dayDiary ? dayDiary.entries : []
    } catch (error) {
      console.error('获取本地日记失败:', error)
      return []
    }
  }

  saveLocalDiary(diary) {
    try {
      const allDiaries = JSON.parse(localStorage.getItem('diaries') || '[]')
      const dateStr = diary.date
      const dayIndex = allDiaries.findIndex(d => d.date === dateStr)
      
      // 生成雪花ID
      const newDiary = {
        ...diary,
        id: generateId(),
        createdAt: new Date().toISOString()
      }

      if (dayIndex >= 0) {
        allDiaries[dayIndex].entries.push(newDiary)
      } else {
        allDiaries.push({
          date: dateStr,
          entries: [newDiary]
        })
      }

      localStorage.setItem('diaries', JSON.stringify(allDiaries))
      return newDiary
    } catch (error) {
      console.error('保存本地日记失败:', error)
      throw error
    }
  }

  updateLocalDiary(id, data) {
    try {
      const allDiaries = JSON.parse(localStorage.getItem('diaries') || '[]')
      
      for (const dayDiary of allDiaries) {
        const entryIndex = dayDiary.entries.findIndex(entry => entry.id === id)
        if (entryIndex >= 0) {
          dayDiary.entries[entryIndex] = {
            ...dayDiary.entries[entryIndex],
            ...data,
            updatedAt: new Date().toISOString()
          }
          localStorage.setItem('diaries', JSON.stringify(allDiaries))
          return dayDiary.entries[entryIndex]
        }
      }
      
      throw new Error('未找到要更新的日记')
    } catch (error) {
      console.error('更新本地日记失败:', error)
      throw error
    }
  }

  deleteLocalDiary(id) {
    try {
      const allDiaries = JSON.parse(localStorage.getItem('diaries') || '[]')
      
      for (const dayDiary of allDiaries) {
        const entryIndex = dayDiary.entries.findIndex(entry => entry.id === id)
        if (entryIndex >= 0) {
          dayDiary.entries.splice(entryIndex, 1)
          localStorage.setItem('diaries', JSON.stringify(allDiaries))
          return true
        }
      }
      
      throw new Error('未找到要删除的日记')
    } catch (error) {
      console.error('删除本地日记失败:', error)
      throw error
    }
  }

  // 同步本地数据到服务器
  async syncToServer() {
    if (!this.isServerMode()) {
      throw new Error('未配置服务器地址')
    }

    try {
      const allDiaries = JSON.parse(localStorage.getItem('diaries') || '[]')
      const results = []

      for (const dayDiary of allDiaries) {
        for (const entry of dayDiary.entries) {
          try {
            const result = await this.request('/diaries', {
              method: 'POST',
              body: JSON.stringify(entry)
            })
            results.push({ success: true, entry, result })
          } catch (error) {
            results.push({ success: false, entry, error: error.message })
          }
        }
      }

      return results
    } catch (error) {
      console.error('同步到服务器失败:', error)
      throw error
    }
  }

  // 从服务器同步数据到本地
  async syncFromServer() {
    if (!this.isServerMode()) {
      throw new Error('未配置服务器地址')
    }

    try {
      const allDiaries = await this.request('/diaries')
      localStorage.setItem('diaries', JSON.stringify(allDiaries))
      return allDiaries
    } catch (error) {
      console.error('从服务器同步失败:', error)
      throw error
    }
  }
}

// 创建全局API服务实例
const apiService = new ApiService()

export default apiService 