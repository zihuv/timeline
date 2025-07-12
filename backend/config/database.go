package config

import (
	"timeline/backend/models"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// InitDB 初始化数据库连接
func InitDB() (*gorm.DB, error) {
	// 使用配置中的SQLite数据库路径
	db, err := gorm.Open(sqlite.Open(AppConfig.DBPath), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})

	if err != nil {
		return nil, err
	}

	// 自动迁移数据库表
	err = db.AutoMigrate(&models.DiaryEntry{}, &models.DiaryImage{}, &models.Config{})
	if err != nil {
		return nil, err
	}

	return db, err
}
