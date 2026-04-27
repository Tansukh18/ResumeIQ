# 🚀 How to Run ResumeIQ Project
=====================================

## ✅ EASIEST WAY — One Command (Recommended)

Open Terminal and run:

```
cd /Users/tansukhsuthar/Documents/PROJECT/ResumeIQ
bash run_server.sh
```

This will automatically:
- Install dependencies if missing
- Open Backend in a new Terminal tab (Port 3000)
- Open Frontend in a new Terminal tab (Port 5173)
- Open your browser at http://localhost:5173

---

## 🖐 MANUAL WAY — Two Separate Terminals

### Terminal 1 — Backend
```
cd /Users/tansukhsuthar/Documents/PROJECT/ResumeIQ/Backend
npm install
npm run dev
```
Wait for: Server is running on port 3000 + Connected to Database ✅

### Terminal 2 — Frontend (press Cmd+T for new tab)
```
cd /Users/tansukhsuthar/Documents/PROJECT/ResumeIQ/Frontend
npm install
npm run dev
```
Wait for: VITE ready on http://localhost:5173 ✅

### Then open your browser at:
```
http://localhost:5173
```

---

## 🛑 To Stop the Project

Press **Ctrl + C** in each Terminal window.

---

## 📋 Project Info

| Service  | URL                    | Status        |
|----------|------------------------|---------------|
| Frontend | http://localhost:5173  | React + Vite  |
| Backend  | http://localhost:3000  | Node + Express|
| Database | MongoDB Atlas (Cloud)  | Auto-connects |

---

## ⚠️ Requirements Before Running

- Mac must be connected to the Internet (for MongoDB Atlas)
- Both Terminal windows must stay open while using the app
- No need to manually connect to the database — it's automatic!
