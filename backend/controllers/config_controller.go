package controllers

import (
	"net/http"
	"timeline/backend/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// ConfigController 配置控制器
type ConfigController struct {
	db *gorm.DB
}

// NewConfigController 创建新的配置控制器
func NewConfigController(db *gorm.DB) *ConfigController {
	return &ConfigController{db: db}
}

// GetConfig 获取配置
func (cc *ConfigController) GetConfig(c *gin.Context) {
	var config models.Config
	result := cc.db.First(&config)
	if result.Error != nil {
		if result.Error.Error() == "record not found" {
			// 如果没有配置记录，返回默认配置
			c.JSON(http.StatusOK, gin.H{
				"serverUrl": "",
				"updatedAt": nil,
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取配置失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"serverUrl": config.ServerURL,
		"updatedAt": config.UpdatedAt,
	})
}

// SaveConfig 保存配置
func (cc *ConfigController) SaveConfig(c *gin.Context) {
	var requestBody struct {
		ServerURL string `json:"serverUrl"`
		UpdatedAt string `json:"updatedAt"`
	}

	if err := c.ShouldBindJSON(&requestBody); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请求参数错误"})
		return
	}

	// 查找现有配置或创建新配置
	var config models.Config
	result := cc.db.First(&config)

	if result.Error != nil && result.Error.Error() == "record not found" {
		// 创建新配置
		config = models.Config{
			ServerURL: requestBody.ServerURL,
		}
		result = cc.db.Create(&config)
	} else {
		// 更新现有配置
		config.ServerURL = requestBody.ServerURL
		result = cc.db.Save(&config)
	}

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "保存配置失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "配置保存成功",
		"config": gin.H{
			"serverUrl": config.ServerURL,
			"updatedAt": config.UpdatedAt,
		},
	})
}

// HealthCheck 健康检查
func (cc *ConfigController) HealthCheck(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status":  "ok",
		"message": "服务器运行正常",
		"timestamp": gin.H{
			"server": "后端服务正常",
		},
	})
}
