package config

import (
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// InitDB 初始化数据库连接
func InitDB() (*gorm.DB, error) {
	// 使用SQLite作为数据库
	db, err := gorm.Open(sqlite.Open("diary.db"), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})

	return db, err
}