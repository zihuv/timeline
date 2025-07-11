@echo off
SETLOCAL

chcp 65001 >nul

:: 配置参数
SET SQLITE_DB_PATH=%~1
IF "%SQLITE_DB_PATH%"=="" SET SQLITE_DB_PATH=C:/Users/10413/OneDrive/diary.db

SET BUILD_DIR=build
SET BACKEND_BINARY=timeline.exe
SET FRONTEND_DIR=dist

:: 清理旧构建
echo 清理旧构建文件...
IF EXIST "%BUILD_DIR%" rmdir /s /q "%BUILD_DIR%"
mkdir "%BUILD_DIR%"

:: 构建前端
echo 构建前端...
cd frontend
call npm install
if %ERRORLEVEL% neq 0 (
    echo 前端npm install失败!
    exit /b 1
)
call npm run build
if %ERRORLEVEL% neq 0 (
    echo 前端构建失败!
    exit /b 1
)
cd ..

:: 复制前端文件
echo 复制前端文件到构建目录...
xcopy /E /I /Y "frontend\%FRONTEND_DIR%" "%BUILD_DIR%\dist"

:: 构建后端(直接输出到BUILD_DIR)
echo 构建后端...
cd backend
go build -o "..\%BUILD_DIR%\%BACKEND_BINARY%" main.go
if %ERRORLEVEL% neq 0 (
    echo 后端构建失败!
    exit /b 1
)
cd ..

:: 创建配置文件
echo 创建配置文件...
echo {"db_path": "%SQLITE_DB_PATH%", "port": "8080"} > "%BUILD_DIR%\config.json"

:: 创建启动脚本
echo 创建启动脚本...
echo @echo off > "%BUILD_DIR%\start.bat"
echo set SQLITE_DB_PATH=%SQLITE_DB_PATH% >> "%BUILD_DIR%\start.bat"
echo if not "%%1"=="" set SQLITE_DB_PATH=%%1 >> "%BUILD_DIR%\start.bat"
echo start /B .\%BACKEND_BINARY% -db "%%SQLITE_DB_PATH%%" >> "%BUILD_DIR%\start.bat"
echo echo 服务器已启动，请访问 http://localhost:8080 >> "%BUILD_DIR%\start.bat"
echo pause >> "%BUILD_DIR%\start.bat"

:: 创建说明文件
echo 创建README...
echo # 项目部署说明 > "%BUILD_DIR%\README.md"
echo. >> "%BUILD_DIR%\README.md"
echo ## 运行项目 >> "%BUILD_DIR%\README.md"
echo. >> "%BUILD_DIR%\README.md"
echo 1. 配置数据库路径(可选): >> "%BUILD_DIR%\README.md"
echo    - 编辑config.json中的db_path或通过启动参数设置 >> "%BUILD_DIR%\README.md"
echo    - 默认数据库路径: .\data.db >> "%BUILD_DIR%\README.md"
echo. >> "%BUILD_DIR%\README.md"
echo 2. 启动服务: >> "%BUILD_DIR%\README.md"
echo    ``` >> "%BUILD_DIR%\README.md"
echo    start.bat "可选的自定义数据库路径" >> "%BUILD_DIR%\README.md"
echo    ``` >> "%BUILD_DIR%\README.md"
echo. >> "%BUILD_DIR%\README.md"
echo 3. 在浏览器中访问: http://localhost:8080 >> "%BUILD_DIR%\README.md"

echo 构建完成! 输出目录: %BUILD_DIR%
ENDLOCAL