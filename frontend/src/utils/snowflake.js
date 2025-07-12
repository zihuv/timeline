// 前端时间戳ID生成器
class TimestampIdGenerator {
  constructor() {
    this.lastTimestamp = 0
    this.sequence = 0
  }
  
  // 生成下一个ID
  nextId() {
    const now = Date.now()
    
    // 如果当前时间小于上次生成时间，说明系统时钟回退了
    if (now < this.lastTimestamp) {
      throw new Error('Clock moved backwards')
    }
    
    // 如果是同一毫秒内，序列号递增
    if (now === this.lastTimestamp) {
      this.sequence = (this.sequence + 1) % 1000 // 限制在3位数内
      // 如果序列号溢出，等待下一毫秒
      if (this.sequence === 0) {
        this.waitNextMillis(this.lastTimestamp)
      }
    } else {
      // 不同毫秒，序列号重置
      this.sequence = 0
    }
    
    this.lastTimestamp = now
    
    // 生成时间戳格式的ID: YYYYMMDDHHMMSSmmm + 序列号
    const date = new Date(now)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const seconds = String(date.getSeconds()).padStart(2, '0')
    const milliseconds = String(date.getMilliseconds()).padStart(3, '0')
    const sequence = String(this.sequence).padStart(3, '0')
    
    // 格式: YYYYMMDDHHMMSSmmm + 序列号
    const id = `${year}${month}${day}${hours}${minutes}${seconds}${milliseconds}${sequence}`
    
    return id
  }
  
  // 等待下一毫秒
  waitNextMillis(lastTimestamp) {
    let timestamp = Date.now()
    while (timestamp <= lastTimestamp) {
      timestamp = Date.now()
    }
    return timestamp
  }
}

// 全局时间戳ID生成器实例
let globalTimestampGenerator = null

// 初始化时间戳ID生成器
function initTimestampGenerator() {
  globalTimestampGenerator = new TimestampIdGenerator()
}

// 生成全局唯一ID
function generateId() {
  if (!globalTimestampGenerator) {
    initTimestampGenerator()
  }
  return globalTimestampGenerator.nextId()
}

// 初始化默认实例
initTimestampGenerator()

export { TimestampIdGenerator, initTimestampGenerator, generateId } 