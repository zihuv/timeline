@echo off
echo 开始构建前端项目...

cd frontend

echo 安装依赖...
call npm install

echo 构建项目...
call npm run build

echo 构建完成！
echo 构建文件位于: frontend/dist/
echo.
echo 要预览构建结果，请运行:
echo cd frontend && npm run preview
echo.
pause 