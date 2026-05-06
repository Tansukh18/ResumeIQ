<div align="center">
  <h1>🚀 ResumeIQ</h1>
  <p><strong>AI-Powered Interview Coach & ATS Resume Optimizer</strong></p>
  
  [![Live Demo](https://img.shields.io/badge/Live_Demo-Vercel-black?style=for-the-badge&logo=vercel)](https://resume-iq-oci5.vercel.app)
  [![Backend API](https://img.shields.io/badge/Backend_API-Render-blue?style=for-the-badge&logo=render)](https://resumeiq-q68e.onrender.com)
</div>

<br />

ResumeIQ is a full-stack, AI-driven application designed to help job seekers instantly evaluate their resumes against specific Job Descriptions (JDs). It generates tailored, hyper-personalized interview preparation reports, complete with likely technical/behavioral questions, skill gap analysis, and day-by-day study plans. Additionally, it features an advanced engine to parse, optimize, and rebuild resumes into pristine, 100% ATS-friendly PDF formats.

---

## ✨ Features

- **🧠 Intelligent Interview Prep Generation:** Uses blazing-fast **Groq (Llama-3.3-70b-versatile)** to analyze a resume against a JD in under 5 seconds.
- **📄 ATS-Friendly Resume Generation:** Rebuilds poorly formatted resumes into a strictly structured, highly professional PDF layout engineered specifically to bypass and score highly on Applicant Tracking Systems using `pdfkit`.
- **📊 Match Scoring & Skill Gap Analysis:** Automatically computes how well your profile aligns with the role and outlines critical missing skills with severity weightings.
- **🗓️ Day-by-Day Preparation Plan:** AI-generated timeline breaking down exactly what to study before the interview.
- **🔒 Secure User Authentication:** Full JWT-based auth flow integrated with MongoDB.
- **⚡ Built for Scale:** Implements automatic exponential backoff, rate limit handling, and AI model fallbacks to ensure 99.9% uptime during API traffic spikes.

---

## 🛠️ Technology Stack

### **Frontend**
- **Framework:** React 19 (via Vite)
- **Routing:** React Router v7
- **Styling:** TailwindCSS
- **State Management:** React Context API
- **Deployment:** Vercel

### **Backend**
- **Runtime:** Node.js (v20+)
- **Framework:** Express.js 5.x
- **Database:** MongoDB (via Mongoose)
- **Authentication:** JWT (JSON Web Tokens), bcryptjs
- **PDF Processing:** `pdf-parse` (parsing), `pdfkit` (rendering)
- **Deployment:** Render

### **AI Integration**
- **Provider:** Groq API
- **Model:** Llama-3.3-70b-versatile (with auto-fallback to Llama3-8b-8192)
- **Structured Outputs:** Zod + JSON Schema for strictly typed AI responses.

---

## 🏗️ System Architecture & Data Flow

### **1. Presentation Layer (Frontend)**
- **React 19 & Vite:** Delivers a lightning-fast, Single Page Application (SPA) experience.
- **TailwindCSS:** Provides responsive, mobile-first styling and glassmorphism UI components.
- **Vercel Edge Network:** Hosts the compiled frontend globally for low-latency loading.

### **2. Application Layer (Backend)**
- **Express.js (Node.js):** REST API handling all business logic, protected by CORS and JWT middleware.
- **Auth Service:** Issues encrypted JWT tokens and manages session states.
- **Parsing Service (`pdf-parse`):** Extracts raw text from uploaded user PDFs.
- **PDF Engine (`pdfkit`):** Dynamically draws and builds rigid, ATS-friendly PDF templates via stream buffers.
- **Render.com:** Hosts the backend on a managed cloud container.

### **3. Intelligence Layer (AI Agent)**
- **Groq API:** Handles the heavy NLP lifting.
- **Routing Logic:** Automatically routes requests to `llama-3.3-70b-versatile` (primary) and falls back to `llama3-8b-8192` if rate limits are exceeded.
- **Zod Schema:** Enforces strict JSON data shapes so the AI never returns malformed markdown.

### **4. Data Layer (Database)**
- **MongoDB Atlas:** Cloud NoSQL database storing user profiles, raw resumes, and the structured AI-generated interview reports.

### **Flowchart**

```mermaid
sequenceDiagram
    participant U as User (Browser)
    participant F as React Frontend
    participant B as Express Backend
    participant AI as Groq API
    participant DB as MongoDB Atlas

    U->>F: Upload Resume PDF & Paste JD
    F->>B: POST /api/interview (Form Data)
    B->>B: pdf-parse extracts text
    B->>AI: Send Prompt + JSON Schema
    AI-->>B: Return structured JSON evaluation
    B->>DB: Save Report Data
    B-->>F: Return Interview Report
    F-->>U: Display Dashboard & Study Plan
    
    U->>F: Click "Download ATS Resume"
    F->>B: GET /api/interview/download
    B->>B: pdfkit draws ATS-friendly format
    B-->>U: Stream PDF File
```

---

## ⚙️ Requirements & Local Setup

### **Prerequisites**
- **Node.js**: v20 or higher
- **MongoDB**: Local instance or Atlas URI
- **Groq API Key**: Get a free API key at [console.groq.com](https://console.groq.com/)

### **1. Clone the repository**
\`\`\`bash
git clone https://github.com/Tansukh18/ResumeIQ.git
cd ResumeIQ
\`\`\`

### **2. Backend Setup**
\`\`\`bash
cd Backend
npm install
\`\`\`
Create a `.env` file in the `Backend` directory:
\`\`\`env
PORT=10000
FRONTEND_URL=http://localhost:5173
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
GROQ_API_KEY=your_groq_api_key
\`\`\`
Start the development server:
\`\`\`bash
npm run dev
\`\`\`

### **3. Frontend Setup**
Open a new terminal window:
\`\`\`bash
cd Frontend
npm install
\`\`\`
Create a `.env` file in the `Frontend` directory:
\`\`\`env
VITE_BACKEND_URL=http://localhost:10000
\`\`\`
Start the frontend development server:
\`\`\`bash
npm run dev
\`\`\`

---

## 🔒 Security & Performance Details

- **Robust Error Handling:** Express 5 natively handles async errors. The AI service includes logic to intercept `429 Too Many Requests` (Quota Exhausted) from Groq, instantly falling back to lower-tier models (30k TPM vs 6k TPM limits) to guarantee 100% successful report generation.
- **Regex OCR Sanitization:** The `pdfkit` generator uses advanced regular expressions to clean OCR-corrupted dates, ensuring perfect right-aligned margins when generating the ATS resume.
- **CORS Protection:** Cross-Origin Resource Sharing is strictly bound to Vercel production URLs and localhost preview deployments.

---
*Developed by Tansukh Suthar*
