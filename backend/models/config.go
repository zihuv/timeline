package models

import (
	"time"

	"gorm.io/gorm"
)

// Config 配置模型
type Config struct {
	ID        uint           `json:"id" gorm:"primaryKey"`
	ServerURL string         `json:"serverUrl" gorm:"column:server_url;type:varchar(255)"`
	CreatedAt time.Time      `json:"createdAt"`
	UpdatedAt time.Time      `json:"updatedAt"`
	DeletedAt gorm.DeletedAt `json:"deletedAt" gorm:"index"`
}

// TableName 指定表名
func (Config) TableName() string {
	return "configs"
}
