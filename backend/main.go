package main

import (
	"log"
	"timeline/backend/config"
	"timeline/backend/models"
	"timeline/backend/routes"
)

func main() {
	// 加载配置
	config.LoadConfig()

	// 初始化数据库
	db, err := config.InitDB()
	if err != nil {
		log.Fatalf("数据库初始化失败: %v", err)
	}

	// 自动迁移数据库模型
	models.AutoMigrate(db)

	// 设置路由
	r := routes.SetupRouter(db)

	// 启动服务器
	log.Printf("服务器启动在 http://localhost:%s", config.AppConfig.Port)
	r.Run(":" + config.AppConfig.Port)
}
