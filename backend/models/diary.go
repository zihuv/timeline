package models

import (
	"gorm.io/gorm"
	"time"
)

// DiaryImage 日记图片模型
type DiaryImage struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	DiaryID   uint      `json:"diary_id"`
	URL       string    `json:"url" gorm:"type:text"`
	Name      string    `json:"name"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// DiaryEntry 日记条目模型
type DiaryEntry struct {
	ID        uint        `json:"id" gorm:"primaryKey"`
	Date      string      `json:"date" gorm:"index"` // YYYY-MM-DD 格式
	Content   string      `json:"content" gorm:"type:text"`
	Timestamp string      `json:"timestamp"` // HH:MM 格式
	Images    []DiaryImage `json:"images" gorm:"foreignKey:DiaryID"`
	CreatedAt time.Time   `json:"created_at"`
	UpdatedAt time.Time   `json:"updated_at"`
}

// AutoMigrate 自动迁移数据库模型
func AutoMigrate(db *gorm.DB) {
	db.AutoMigrate(&DiaryEntry{}, &DiaryImage{})
}