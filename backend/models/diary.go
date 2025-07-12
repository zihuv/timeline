package models

import (
	"time"

	"gorm.io/gorm"
)

// DiaryImage 日记图片模型
type DiaryImage struct {
	ID        string    `json:"id" gorm:"primaryKey;type:varchar(255)"`
	DiaryID   string    `json:"diary_id" gorm:"type:varchar(255)"`
	URL       string    `json:"url" gorm:"type:text"`
	Name      string    `json:"name"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// DiaryEntry 日记条目模型
type DiaryEntry struct {
	ID        string       `json:"id" gorm:"primaryKey;type:varchar(255)"`
	Date      string       `json:"date" gorm:"index"` // YYYY-MM-DD 格式
	Content   string       `json:"content" gorm:"type:text"`
	Timestamp string       `json:"timestamp"` // HH:MM 格式
	Images    []DiaryImage `json:"images" gorm:"foreignKey:DiaryID"`
	CreatedAt time.Time    `json:"created_at"`
	UpdatedAt time.Time    `json:"updated_at"`
}

// AutoMigrate 自动迁移数据库模型
func AutoMigrate(db *gorm.DB) {
	// 删除旧表（如果存在）
	db.Migrator().DropTable(&DiaryImage{})
	db.Migrator().DropTable(&DiaryEntry{})

	// 重新创建表
	db.AutoMigrate(&DiaryEntry{}, &DiaryImage{})
}
