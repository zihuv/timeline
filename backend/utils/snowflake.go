package utils

import (
	"fmt"
	"sync"
	"time"
)

const (
	// 时间戳位数
	timestampBits = 41
	// 机器ID位数
	machineIDBits = 10
	// 序列号位数
	sequenceBits = 12

	// 最大值
	maxMachineID = (1 << machineIDBits) - 1
	maxSequence  = (1 << sequenceBits) - 1

	// 偏移量
	machineIDShift = sequenceBits
	timestampShift = sequenceBits + machineIDBits

	// 起始时间戳 (2024-01-01 00:00:00 UTC)
	epoch = 1704067200000
)

// Snowflake 雪花ID生成器
type Snowflake struct {
	mutex     sync.Mutex
	machineID int64
	sequence  int64
	lastTime  int64
}

// NewSnowflake 创建新的雪花ID生成器
func NewSnowflake(machineID int64) *Snowflake {
	if machineID < 0 || machineID > maxMachineID {
		panic("machine ID out of range")
	}
	return &Snowflake{
		machineID: machineID,
		sequence:  0,
		lastTime:  0,
	}
}

// NextID 生成下一个ID
func (s *Snowflake) NextID() int64 {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	now := time.Now().UnixMilli()

	// 如果当前时间小于上次生成时间，说明系统时钟回退了
	if now < s.lastTime {
		panic("clock moved backwards")
	}

	// 如果是同一毫秒内，序列号递增
	if now == s.lastTime {
		s.sequence = (s.sequence + 1) & maxSequence
		// 如果序列号溢出，等待下一毫秒
		if s.sequence == 0 {
			now = s.waitNextMillis(s.lastTime)
		}
	} else {
		// 不同毫秒，序列号重置
		s.sequence = 0
	}

	s.lastTime = now

	// 生成ID
	id := ((now - epoch) << timestampShift) |
		(s.machineID << machineIDShift) |
		s.sequence

	return id
}

// waitNextMillis 等待下一毫秒
func (s *Snowflake) waitNextMillis(lastTimestamp int64) int64 {
	timestamp := time.Now().UnixMilli()
	for timestamp <= lastTimestamp {
		timestamp = time.Now().UnixMilli()
	}
	return timestamp
}

// 全局雪花ID生成器实例
var globalSnowflake *Snowflake

// InitSnowflake 初始化全局雪花ID生成器
func InitSnowflake(machineID int64) {
	globalSnowflake = NewSnowflake(machineID)
}

// GenerateID 生成全局唯一ID
func GenerateID() string {
	if globalSnowflake == nil {
		// 如果没有初始化，使用默认机器ID
		InitSnowflake(1)
	}

	// 生成时间戳格式的ID: YYYYMMDDHHMMSSmmm + 序列号
	now := time.Now()
	year := now.Year()
	month := int(now.Month())
	day := now.Day()
	hour := now.Hour()
	minute := now.Minute()
	second := now.Second()
	millisecond := now.Nanosecond() / 1000000 // 转换为毫秒

	// 获取序列号（使用雪花ID的序列号部分）
	snowflakeID := globalSnowflake.NextID()
	sequence := snowflakeID & 0xFFF // 取最后12位作为序列号

	// 格式: YYYYMMDDHHMMSSmmm + 序列号
	id := fmt.Sprintf("%04d%02d%02d%02d%02d%02d%03d%03d",
		year, month, day, hour, minute, second, millisecond, sequence)

	return id
}
