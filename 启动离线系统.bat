@echo off
chcp 65001 >nul
title 液体散装化学品船运费计算系统 - 离线启动

echo ========================================================
echo       液体散装化学品船运费计算系统 - 离线启动程序
echo ========================================================
echo.

:: 检查 Node.js 是否已安装
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [错误] 请先安装 Node.js! 下载地址: https://nodejs.org/
    pause
    exit /b
)

:: 检查 pnpm 是否安装，没有则用 npm 安装依赖
where pnpm >nul 2>nul
if %errorlevel% neq 0 (
    echo [提示] 未安装 pnpm，将使用 npm 安装依赖并启动...
    echo [提示] 这可能需要一两分钟，请耐心等待。
    call npm install
    call npm run build
    echo.
    echo 正在启动本地服务器...
    start http://localhost:3000
    call npm run start
    pause
    exit /b
)

:: 使用 pnpm
echo [1/3] 正在检查依赖...
call pnpm install >nul 2>&1

echo [2/3] 正在编译前端和后端环境...
call pnpm run build >nul 2>&1

echo [3/3] 正在启动系统...
echo.
echo 系统服务已成功启动！请不要关闭此黑色终端窗口！
echo 正在为您自动打开浏览器：http://localhost:3000
echo.
echo ========================================================
start http://localhost:3000
call pnpm run start

pause
