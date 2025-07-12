import configManager from './config.js'
import { generateId } from './snowflake.js'
import indexedDBService from './indexeddb.js'

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

      // 检查响应内容类型
      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        return await response.json()
      } else {
        // 如果不是JSON，可能是HTML错误页面
        const text = await response.text()
        throw new Error(`服务器返回非JSON数据: ${text.substring(0, 100)}...`)
      }
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
    // 无论是否配置服务器，都先保存到本地
    const localResult = await this.saveLocalDiary(diary)
    
    // 如果配置了服务器，再同步到服务器
    if (this.isServerMode()) {
      try {
        // 确保发送给服务器的数据包含前端生成的ID
        const serverData = {
          ...diary,
          id: localResult.id // 使用本地保存后返回的ID
        }
        
        const serverResult = await this.request('/diaries', {
          method: 'POST',
          body: JSON.stringify(serverData)
        })
        // 返回服务器结果，但本地已经保存了
        return serverResult
      } catch (error) {
        console.error('同步到服务器失败:', error)
        // 即使服务器同步失败，本地保存成功，返回本地结果
        return localResult
      }
    }
    
    return localResult
  }

  // 更新日记
  async updateDiary(id, data) {
    // 无论是否配置服务器，都先更新本地
    const localResult = await this.updateLocalDiary(id, data)
    
    // 如果配置了服务器，再同步到服务器
    if (this.isServerMode()) {
      try {
        const serverResult = await this.request(`/diaries/${id}`, {
          method: 'PUT',
          body: JSON.stringify(data)
        })
        // 返回服务器结果，但本地已经更新了
        return serverResult
      } catch (error) {
        console.error('同步到服务器失败:', error)
        // 即使服务器同步失败，本地更新成功，返回本地结果
        return localResult
      }
    }
    
    return localResult
  }

  // 删除日记
  async deleteDiary(id) {
    // 无论是否配置服务器，都先删除本地
    const localResult = await this.deleteLocalDiary(id)
    
    // 如果配置了服务器，再同步到服务器
    if (this.isServerMode()) {
      try {
        const serverResult = await this.request(`/diaries/${id}`, {
          method: 'DELETE'
        })
        // 返回服务器结果，但本地已经删除了
        return serverResult
      } catch (error) {
        console.error('同步到服务器失败:', error)
        // 即使服务器同步失败，本地删除成功，返回本地结果
        return localResult
      }
    }
    
    return localResult
  }

  // 测试服务器连接
  async testConnection() {
    if (!this.isServerMode()) {
      throw new Error('未配置服务器地址')
    }
    return await this.request('/health')
  }

  // 本地存储相关方法
  async getLocalDiaries(date) {
    try {
      return await indexedDBService.getDiaries(date)
    } catch (error) {
      console.error('获取本地日记失败:', error)
      throw error
    }
  }

  async saveLocalDiary(diary) {
    try {
      return await indexedDBService.saveDiary(diary)
    } catch (error) {
      console.error('保存本地日记失败:', error)
      throw error
    }
  }

  async updateLocalDiary(id, data) {
    try {
      return await indexedDBService.updateDiary(id, data)
    } catch (error) {
      console.error('更新本地日记失败:', error)
      throw error
    }
  }

  async deleteLocalDiary(id) {
    try {
      return await indexedDBService.deleteDiary(id)
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
      const allDiaries = await indexedDBService.getAllDiaries()
      const results = []

      // 先获取服务器上已有的数据，用于去重
      let serverDiaries = []
      try {
        const serverData = await this.request('/diaries')
        if (Array.isArray(serverData)) {
          serverDiaries = serverData
        } else {
          console.warn('服务器返回的数据格式不正确:', serverData)
        }
      } catch (error) {
        console.warn('获取服务器数据失败，将上传所有本地数据:', error)
      }

      // 创建服务器数据的ID集合，用于快速查找
      const serverIds = new Set()
      serverDiaries.forEach(day => {
        if (day.entries && Array.isArray(day.entries)) {
          day.entries.forEach(entry => {
            if (entry.id) {
              serverIds.add(entry.id.toString())
            }
          })
        }
      })

      for (const entry of allDiaries) {
        // 检查是否已经存在于服务器
        if (serverIds.has(entry.id.toString())) {
          results.push({ 
            success: true, 
            entry, 
            result: null, 
            skipped: true,
            reason: '已存在于服务器'
          })
          continue
        }

        try {
          // 确保发送给服务器的数据包含正确的ID
          const serverData = {
            ...entry,
            id: entry.id // 确保ID字段存在
          }
          
          const result = await this.request('/diaries', {
            method: 'POST',
            body: JSON.stringify(serverData)
          })
          results.push({ success: true, entry, result, skipped: false })
        } catch (error) {
          results.push({ 
            success: false, 
            entry, 
            error: error.message, 
            skipped: false 
          })
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
      
      // 清空现有数据
      await indexedDBService.clearAll()
      
      // 导入服务器数据
      for (const dayDiary of allDiaries) {
        for (const entry of dayDiary.entries) {
          await indexedDBService.saveDiary(entry)
        }
      }
      
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