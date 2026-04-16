#!/bin/bash
# StudyMark 一键启动脚本
# 用法: bash start.sh

cd /workspace/studymark

# 杀掉旧进程
kill -9 $(lsof -ti:5173) 2>/dev/null
sleep 1

# 安装依赖（如果需要）
if [ ! -d "node_modules" ]; then
  echo "📦 安装依赖..."
  pnpm install
fi

# 启动开发服务器
echo "🚀 启动 StudyMark..."
npx vite --host 0.0.0.0 --port 5173 &
VITE_PID=$!

# 等待服务器就绪
for i in $(seq 1 15); do
  if curl -s -o /dev/null -w "%{http_code}" http://localhost:5173/ 2>/dev/null | grep -q "200"; then
    echo "✅ 服务器已启动: http://localhost:5173/"
    echo "📌 请在浏览器中打开上方链接"
    break
  fi
  sleep 1
done

# 保持脚本运行
wait $VITE_PID 2>/dev/null
