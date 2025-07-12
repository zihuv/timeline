// 前端雪花ID生成器
class Snowflake {
  constructor(machineId = 1) {
    this.machineId = machineId
    this.sequence = 0
    this.lastTime = 0
    
    // 常量定义
    this.TIMESTAMP_BITS = 41
    this.MACHINE_ID_BITS = 10
    this.SEQUENCE_BITS = 12
    
    this.MAX_MACHINE_ID = (1 << this.MACHINE_ID_BITS) - 1
    this.MAX_SEQUENCE = (1 << this.SEQUENCE_BITS) - 1
    
    this.MACHINE_ID_SHIFT = this.SEQUENCE_BITS
    this.TIMESTAMP_SHIFT = this.SEQUENCE_BITS + this.MACHINE_ID_BITS
    
    // 起始时间戳 (2024-01-01 00:00:00 UTC)
    this.EPOCH = 1704067200000
  }
  
  // 生成下一个ID
  nextId() {
    const now = Date.now()
    
    // 如果当前时间小于上次生成时间，说明系统时钟回退了
    if (now < this.lastTime) {
      throw new Error('Clock moved backwards')
    }
    
    // 如果是同一毫秒内，序列号递增
    if (now === this.lastTime) {
      this.sequence = (this.sequence + 1) & this.MAX_SEQUENCE
      // 如果序列号溢出，等待下一毫秒
      if (this.sequence === 0) {
        this.waitNextMillis(this.lastTime)
      }
    } else {
      // 不同毫秒，序列号重置
      this.sequence = 0
    }
    
    this.lastTime = now
    
    // 生成ID
    const id = ((now - this.EPOCH) << this.TIMESTAMP_SHIFT) |
               (this.machineId << this.MACHINE_ID_SHIFT) |
               this.sequence
    
    return id.toString()
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

// 全局雪花ID生成器实例
let globalSnowflake = null

// 初始化雪花ID生成器
function initSnowflake(machineId = 1) {
  globalSnowflake = new Snowflake(machineId)
}

// 生成全局唯一ID
function generateId() {
  if (!globalSnowflake) {
    initSnowflake(1)
  }
  return globalSnowflake.nextId()
}

// 初始化默认实例
initSnowflake(1)

export { Snowflake, initSnowflake, generateId } 