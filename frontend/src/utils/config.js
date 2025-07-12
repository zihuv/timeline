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
      // 处理服务器地址格式
      let fullUrl = serverUrl
      
      // 如果地址以 http: 或 https: 开头但没有双斜杠，添加双斜杠
      if (fullUrl.startsWith('http:') && !fullUrl.startsWith('http://')) {
        fullUrl = fullUrl.replace('http:', 'http://')
        console.log('修复了协议格式:', serverUrl, '->', fullUrl)
      } else if (fullUrl.startsWith('https:') && !fullUrl.startsWith('https://')) {
        fullUrl = fullUrl.replace('https:', 'https://')
        console.log('修复了协议格式:', serverUrl, '->', fullUrl)
      }
      
      // 如果地址没有协议，添加 http://
      if (!fullUrl.startsWith('http://') && !fullUrl.startsWith('https://')) {
        fullUrl = `http://${fullUrl}`
        console.log('添加了协议:', serverUrl, '->', fullUrl)
      }
      
      // 如果配置了服务器地址，使用配置的地址
      const apiUrl = fullUrl.endsWith('/') ? `${fullUrl}api` : `${fullUrl}/api`
      console.log('API基础URL:', apiUrl, '(原始配置:', serverUrl, ')')
      return apiUrl
    } else {
      // 如果没有配置，使用相对路径（本地开发模式）
      console.log('使用本地模式，API基础URL: /api')
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

  // 检查和修复配置
  checkAndFixConfig() {
    const serverUrl = this.getServerUrl()
    console.log('=== 配置检查 ===')
    console.log('当前配置:', this.config)
    console.log('服务器地址:', serverUrl)
    
    if (serverUrl) {
      // 检查URL格式
      let issues = []
      
      if (serverUrl.startsWith('http:') && !serverUrl.startsWith('http://')) {
        issues.push('协议格式错误: 缺少双斜杠')
      }
      
      if (serverUrl.startsWith('https:') && !serverUrl.startsWith('https://')) {
        issues.push('协议格式错误: 缺少双斜杠')
      }
      
      if (!serverUrl.startsWith('http://') && !serverUrl.startsWith('https://') && !serverUrl.startsWith('http:') && !serverUrl.startsWith('https:')) {
        issues.push('缺少协议')
      }
      
      if (issues.length > 0) {
        console.warn('发现配置问题:', issues)
        
        // 自动修复
        let fixedUrl = serverUrl
        if (fixedUrl.startsWith('http:') && !fixedUrl.startsWith('http://')) {
          fixedUrl = fixedUrl.replace('http:', 'http://')
        } else if (fixedUrl.startsWith('https:') && !fixedUrl.startsWith('https://')) {
          fixedUrl = fixedUrl.replace('https:', 'https://')
        } else if (!fixedUrl.startsWith('http://') && !fixedUrl.startsWith('https://')) {
          fixedUrl = `http://${fixedUrl}`
        }
        
        if (fixedUrl !== serverUrl) {
          console.log('自动修复配置:', serverUrl, '->', fixedUrl)
          this.updateConfig({ serverUrl: fixedUrl })
          return { fixed: true, oldUrl: serverUrl, newUrl: fixedUrl }
        }
      } else {
        console.log('配置格式正确')
      }
    } else {
      console.log('未配置服务器地址，使用本地模式')
    }
    
    console.log('API基础URL:', this.getApiBaseUrl())
    console.log('=== 配置检查完成 ===')
    
    return { fixed: false }
  }
}

// 创建全局配置管理器实例
const configManager = new ConfigManager()

// 启动时自动检查和修复配置
configManager.checkAndFixConfig()

export default configManager 