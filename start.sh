#!/bin/bash
# 爪印代码库 PawCode - 启动脚本
cd "$(dirname "$0")"
echo "🐾 启动爪印代码库服务..."
node server/index.js
