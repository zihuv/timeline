package config

import (
	"encoding/json"
	"flag"
	"io/ioutil"
	"log"
	"os"
	"path/filepath"
)

// Config 应用配置结构
type Config struct {
	DBPath string `json:"db_path"` // SQLite数据库路径
	Port   string `json:"port"`    // 服务器端口
}

// 全局配置变量
var AppConfig Config

// LoadConfig 加载配置
func LoadConfig() {
	// 默认配置
	AppConfig = Config{
		DBPath: "diary.db",
		Port:   "8080",
	}

	// 命令行参数
	dbPath := flag.String("db", "", "SQLite数据库路径")
	port := flag.String("port", "", "服务器端口")
	configPath := flag.String("config", "config.json", "配置文件路径")
	flag.Parse()

	// 尝试从配置文件加载
	if _, err := os.Stat(*configPath); err == nil {
		data, err := ioutil.ReadFile(*configPath)
		if err == nil {
			err = json.Unmarshal(data, &AppConfig)
			if err != nil {
				log.Printf("解析配置文件失败: %v, 使用默认配置", err)
			}
		}
	}

	// 命令行参数优先级高于配置文件
	if *dbPath != "" {
		AppConfig.DBPath = *dbPath
	}

	if *port != "" {
		AppConfig.Port = *port
	}

	// 确保数据库路径是绝对路径
	if !filepath.IsAbs(AppConfig.DBPath) {
		execDir, _ := os.Getwd()
		AppConfig.DBPath = filepath.Join(execDir, AppConfig.DBPath)
	}

	log.Printf("配置加载完成: 数据库路径=%s, 端口=%s", AppConfig.DBPath, AppConfig.Port)
}
