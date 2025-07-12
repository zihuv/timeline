// 配置管理工具类
class ConfigManager {
  constructor() {
    this.config = this.loadConfig()
    this.listeners = []
  }

  // 加载配置
  loadConfig() {
    try {
      const savedConfig = localStorage.getItem('appConfig')
      if (savedConfig) {
        return JSON.parse(savedConfig)
      }
    } catch (error) {
      console.error('加载配置失败:', error)
    }
    return {
      serverUrl: '',
      updatedAt: null
    }
  }

  // 获取服务器地址
  getServerUrl() {
    return this.config.serverUrl || ''
  }

  // 检查是否配置了服务器
  hasServerConfig() {
    return !!this.config.serverUrl
  }

  // 获取完整的API基础URL
  getApiBaseUrl() {
    const serverUrl = this.getServerUrl()
    if (serverUrl) {
      // 如果配置了服务器地址，使用配置的地址
      return serverUrl.endsWith('/') ? `${serverUrl}api` : `${serverUrl}/api`
    } else {
      // 如果没有配置，使用相对路径（本地开发模式）
      return '/api'
    }
  }

  // 更新配置
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig }
    this.saveConfig()
    this.notifyListeners()
  }

  // 保存配置到本地存储
  saveConfig() {
    try {
      localStorage.setItem('appConfig', JSON.stringify(this.config))
    } catch (error) {
      console.error('保存配置失败:', error)
    }
  }

  // 添加配置变化监听器
  addListener(listener) {
    this.listeners.push(listener)
  }

  // 移除配置变化监听器
  removeListener(listener) {
    const index = this.listeners.indexOf(listener)
    if (index > -1) {
      this.listeners.splice(index, 1)
    }
  }

  // 通知所有监听器
  notifyListeners() {
    this.listeners.forEach(listener => {
      try {
        listener(this.config)
      } catch (error) {
        console.error('配置监听器执行失败:', error)
      }
    })
  }

  // 测试服务器连接
  async testConnection() {
    const serverUrl = this.getServerUrl()
    if (!serverUrl) {
      throw new Error('未配置服务器地址')
    }

    try {
      const response = await fetch(`${this.getApiBaseUrl()}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      throw new Error(`连接失败: ${error.message}`)
    }
  }

  // 保存配置到服务器
  async saveConfigToServer() {
    const serverUrl = this.getServerUrl()
    if (!serverUrl) {
      throw new Error('未配置服务器地址')
    }

    try {
      const response = await fetch(`${this.getApiBaseUrl()}/config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(this.config)
      })

      if (!response.ok) {
        throw new Error(`保存失败: HTTP ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      throw new Error(`保存到服务器失败: ${error.message}`)
    }
  }

  // 从服务器加载配置
  async loadConfigFromServer() {
    const serverUrl = this.getServerUrl()
    if (!serverUrl) {
      throw new Error('未配置服务器地址')
    }

    try {
      const response = await fetch(`${this.getApiBaseUrl()}/config`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`加载失败: HTTP ${response.status}`)
      }

      const serverConfig = await response.json()
      this.updateConfig(serverConfig)
      return serverConfig
    } catch (error) {
      throw new Error(`从服务器加载配置失败: ${error.message}`)
    }
  }
}

// 创建全局配置管理器实例
const configManager = new ConfigManager()

export default configManager 