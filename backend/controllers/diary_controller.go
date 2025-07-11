package controllers

import (
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"net/http"
	"time"
	"timeline/backend/models"
)

// DiaryController 处理日记相关的请求
type DiaryController struct {
	DB *gorm.DB
}

// NewDiaryController 创建一个新的日记控制器
func NewDiaryController(db *gorm.DB) *DiaryController {
	return &DiaryController{DB: db}
}

// GetDiariesByDate 获取指定日期的日记
func (dc *DiaryController) GetDiariesByDate(c *gin.Context) {
	date := c.Query("date") // 获取查询参数中的日期
	if date == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "日期参数不能为空"})
		return
	}

	var entries []models.DiaryEntry
	result := dc.DB.Where("date = ?", date).Preload("Images").Find(&entries)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取日记失败"})
		return
	}

	c.JSON(http.StatusOK, entries)
}

// CreateDiary 创建新的日记
func (dc *DiaryController) CreateDiary(c *gin.Context) {
	var input struct {
		Content string `json:"content"`
		Images  []struct {
			URL  string `json:"url"`
			Name string `json:"name"`
		} `json:"images"`
		Date      string `json:"date"` // 可选，默认为当前日期
		Timestamp string `json:"timestamp"` // 可选，默认为当前时间
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 设置默认值
	if input.Date == "" {
		input.Date = time.Now().Format("2006-01-02")
	}

	if input.Timestamp == "" {
		input.Timestamp = time.Now().Format("15:04")
	}

	// 创建日记条目
	entry := models.DiaryEntry{
		Date:      input.Date,
		Content:   input.Content,
		Timestamp: input.Timestamp,
		Images:    make([]models.DiaryImage, 0),
	}

	// 添加图片
	for _, img := range input.Images {
		entry.Images = append(entry.Images, models.DiaryImage{
			URL:  img.URL,
			Name: img.Name,
		})
	}

	// 保存到数据库
	result := dc.DB.Create(&entry)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "创建日记失败"})
		return
	}

	c.JSON(http.StatusCreated, entry)
}

// GetAllDiaries 获取所有日记（可分页）
func (dc *DiaryController) GetAllDiaries(c *gin.Context) {
	var entries []models.DiaryEntry
	result := dc.DB.Preload("Images").Find(&entries)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取日记失败"})
		return
	}

	c.JSON(http.StatusOK, entries)
}

// DeleteDiary 删除日记
func (dc *DiaryController) DeleteDiary(c *gin.Context) {
	id := c.Param("id")

	// 删除日记及其关联的图片
	result := dc.DB.Delete(&models.DiaryEntry{}, id)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "删除日记失败"})
		return
	}

	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "日记不存在"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "日记已删除"})
}