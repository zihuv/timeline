package main

import (
	"log"
	"timeline/backend/config"
	"timeline/backend/models"
	"timeline/backend/routes"
)

func main() {
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
	log.Println("服务器启动在 http://localhost:8080")
	r.Run(":8080")
}