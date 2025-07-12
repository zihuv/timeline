package routes

import (
	"net/http"
	"timeline/backend/controllers"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
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
	configController := controllers.NewConfigController(db)

	// API路由组
	api := r.Group("/api")
	{
		// 健康检查
		api.GET("/health", configController.HealthCheck)

		// 配置相关路由
		api.GET("/config", configController.GetConfig)   // 获取配置
		api.POST("/config", configController.SaveConfig) // 保存配置

		// 日记相关路由
		diaries := api.Group("/diaries")
		{
			diaries.GET("", diaryController.GetAllDiaries)            // 获取所有日记
			diaries.GET("/date", diaryController.GetDiariesByDate)    // 获取指定日期的日记
			diaries.POST("", diaryController.CreateDiary)             // 创建新日记
			diaries.DELETE("/:id", diaryController.DeleteDiary)       // 删除日记
			diaries.PUT("/:id", diaryController.UpdateDiary)          // 更新日记
			diaries.DELETE("/clear", diaryController.ClearAllDiaries) // 清理所有数据
		}
	}

	// 静态文件服务
	r.StaticFS("/web", http.Dir("./dist"))

	// 根路径处理 - 使用StaticFile而不是StaticFS
	r.StaticFile("/", "./dist/index.html")
	r.Static("/assets", "./dist/assets")
	r.Static("/css", "./dist/css")
	r.Static("/js", "./dist/js")

	// 前端路由处理
	r.NoRoute(func(c *gin.Context) {
		c.File("./dist/index.html")
	})

	return r
}
