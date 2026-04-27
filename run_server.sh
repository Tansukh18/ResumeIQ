#!/bin/bash

# ============================================
#   ResumeIQ — Full Stack Project Runner
# ============================================

PROJECT_DIR="/Users/tansukhsuthar/Documents/PROJECT/ResumeIQ"

echo ""
echo "============================================"
echo "   🚀 Starting ResumeIQ Project..."
echo "============================================"
echo ""

# --- Kill any existing processes on ports 3000 and 5173 ---
echo "🧹 Cleaning up old server processes..."

PORT3000=$(lsof -ti:3000)
if [ -n "$PORT3000" ]; then
  echo "   Killing old process on port 3000 (PID: $PORT3000)"
  kill -9 $PORT3000 2>/dev/null
fi

PORT5173=$(lsof -ti:5173)
if [ -n "$PORT5173" ]; then
  echo "   Killing old process on port 5173 (PID: $PORT5173)"
  kill -9 $PORT5173 2>/dev/null
fi

sleep 1
echo "   ✅ Ports 3000 and 5173 are now free!"
echo ""

# --- Install Backend dependencies if missing ---
if [ ! -d "$PROJECT_DIR/Backend/node_modules" ]; then
  echo "📦 Installing Backend dependencies first..."
  osascript -e "tell app \"Terminal\" to do script \"echo '📦 Installing Backend dependencies...' && cd '$PROJECT_DIR/Backend' && npm install && echo '✅ Done! Starting Backend...' && npm run dev\""
else
  echo "▶ Starting Backend (Port 3000)..."
  osascript -e "tell app \"Terminal\" to do script \"cd '$PROJECT_DIR/Backend' && npm run dev\""
fi

sleep 2

# --- Install Frontend dependencies if missing ---
if [ ! -d "$PROJECT_DIR/Frontend/node_modules" ]; then
  echo "📦 Installing Frontend dependencies first..."
  osascript -e "tell app \"Terminal\" to do script \"echo '📦 Installing Frontend dependencies...' && cd '$PROJECT_DIR/Frontend' && npm install && echo '✅ Done! Starting Frontend...' && npm run dev\""
else
  echo "▶ Starting Frontend (Port 5173)..."
  osascript -e "tell app \"Terminal\" to do script \"cd '$PROJECT_DIR/Frontend' && npm run dev\""
fi

sleep 5

# --- Open Browser ---
echo "▶ Opening Browser at http://localhost:5173 ..."
open "http://localhost:5173"

echo ""
echo "============================================"
echo "  ✅ ResumeIQ is running!"
echo "  🌐 App URL  : http://localhost:5173"
echo "  🔧 Backend  : http://localhost:3000"
echo "  📦 Database : MongoDB Atlas (auto-connected)"
echo "============================================"
echo ""
echo "  To STOP servers: Press Ctrl+C in each Terminal window"
echo ""
