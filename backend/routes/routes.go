package routes

import (
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"timeline/backend/controllers"
)

// SetupRouter 设置路由
func SetupRouter(db *gorm.DB) *gin.Engine {
	r := gin.Default()

	// 配置CORS
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173"}, // 前端开发服务器地址
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept"},
		AllowCredentials: true,
	}))

	// 创建控制器
	diaryController := controllers.NewDiaryController(db)

	// API路由组
	api := r.Group("/api")
	{
		// 日记相关路由
		diaries := api.Group("/diaries")
		{
			diaries.GET("", diaryController.GetAllDiaries)       // 获取所有日记
			diaries.GET("/date", diaryController.GetDiariesByDate) // 获取指定日期的日记
			diaries.POST("", diaryController.CreateDiary)        // 创建新日记
			diaries.DELETE("/:id", diaryController.DeleteDiary)  // 删除日记
		}
	}

	return r
}