# Course Aura — AI Course Builder

> **Instantly generate structured, comprehensive course outlines on any topic using the power of Google Gemini AI.**

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite)](https://vitejs.dev)
[![Node.js](https://img.shields.io/badge/Node.js-20-339933?logo=nodedotjs)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-5-000000?logo=express)](https://expressjs.com)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb)](https://www.mongodb.com)
[![Firebase](https://img.shields.io/badge/Firebase-Auth-FFCA28?logo=firebase)](https://firebase.google.com)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker)](https://docs.docker.com/compose/)

---

## 📸 Overview

**Course Aura** is a full-stack SaaS application that allows authenticated users to:

- 🤖 **Generate** detailed, structured course outlines (with modules, lessons, and study resources) using Google Gemini AI
- 💾 **Save & Load** chat history persistently in MongoDB per user
- 📄 **Export** any generated course to a downloadable PDF
- 🔐 **Authenticate** via Google OAuth or Email/Password (Firebase Auth)
- 🕘 **Manage** session history through an interactive sidebar

---

## 🏗️ Architecture

```
ai-course-builder/
├── server/                 # Node.js + Express backend
│   ├── server.js           # Main API server
│   ├── package.json
│   ├── Dockerfile
│   ├── .env                # (gitignored) Secret keys
│   └── .env.example        # Template for environment variables
│
├── src/                    # React (Vite) frontend
│   ├── components/
│   │   ├── ChatApp.jsx         # Main app logic & state
│   │   ├── ChatHeader.jsx      # Top navigation bar
│   │   ├── ChatInput.jsx       # Prompt input area
│   │   ├── ChatMessage.jsx     # Individual message renderer
│   │   ├── ChatOutput.jsx      # Course outline renderer
│   │   ├── ChatStyles.module.css  # All CSS module styles
│   │   ├── HistorySidebar.jsx  # Session history sidebar
│   │   └── LoginScreen.jsx     # Login / Sign-up screen
│   ├── firebaseConfig.js       # Firebase client init
│   ├── main.jsx                # React entry point
│   └── index.css               # Global styles
│
├── public/                 # Static assets
├── index.html              # HTML entry point
├── vite.config.js          # Vite configuration
├── docker-compose.yml      # Multi-container Docker setup
├── Dockerfile              # Frontend Docker image (Nginx)
└── .env.example            # Frontend env template
```

---

## 🚀 Getting Started

### Prerequisites

| Tool | Version |
|------|---------|
| Node.js | ≥ 20 |
| npm | ≥ 10 |
| Docker + Docker Compose | (Optional) |

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/ai-course-builder.git
cd ai-course-builder
```

### 2. Set Up the Backend

```bash
cd server

# Copy the environment template
cp .env.example .env
```

Edit `server/.env` with your actual credentials:

```env
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/
GEMINI_API_KEY=your_google_gemini_api_key
FIREBASE_SERVICE_ACCOUNT={"type":"service_account", ...}  # Full JSON on one line
PORT=3001
```

> **Where to get credentials:**
> - **Gemini API Key** → [Google AI Studio](https://aistudio.google.com/app/apikey)
> - **Firebase Service Account** → Firebase Console → Project Settings → Service Accounts → Generate New Private Key
> - **MongoDB URI** → [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)

Install dependencies and start the server:

```bash
npm install
npm run dev   # Development (requires nodemon)
# or
npm start     # Production
```

The backend starts at **http://localhost:3001**

### 3. Set Up the Frontend

```bash
# From the project root
cp .env.example .env.local
```

Edit `.env.local`:

```env
VITE_API_URL=http://localhost:3001
```

Install dependencies and start:

```bash
npm install
npm run dev
```

The frontend starts at **http://localhost:5173**

---

## 🐳 Docker (Full Stack)

Run both services with a single command:

```bash
docker-compose up --build
```

| Service | URL |
|---------|-----|
| Frontend (Nginx) | http://localhost:5173 |
| Backend (Express) | http://localhost:3001 |

> **Note:** Make sure `server/.env` exists with valid credentials before running Docker.

---

## 🔌 API Reference

Base URL: `http://localhost:3001`

### `POST /api/generate-course`
Generate a course outline using AI.

**Rate limited:** 30 requests per 15 minutes per IP.

**Request body:**
```json
{ "prompt": "A beginner Python course, 4 weeks, for high school students" }
```

**Response:**
```json
{
  "success": true,
  "course": {
    "title": "Introduction to Python",
    "modules": [
      {
        "title": "Module 1: Getting Started",
        "lessons": ["Installing Python", "Hello World", "Variables"],
        "resources": [
          { "type": "Article", "title": "Python Docs", "link": "https://docs.python.org" }
        ]
      }
    ]
  }
}
```

---

### `POST /api/export-course`
Export a course outline to a PDF file.

**Request body:**
```json
{ "course": { "title": "...", "modules": [...] } }
```

**Response:** Binary PDF stream (`Content-Type: application/pdf`)

---

### `GET /api/history/load` 🔒
Load all saved sessions for the authenticated user.

**Headers:** `Authorization: Bearer <firebase_id_token>`

---

### `POST /api/history/save` 🔒
Save or update a chat session.

**Headers:** `Authorization: Bearer <firebase_id_token>`

**Request body:**
```json
{
  "sessionId": "abc123",
  "title": "Python Course",
  "messages": [...]
}
```

---

### `DELETE /api/history/clear` 🔒
Delete all history for the authenticated user.

**Headers:** `Authorization: Bearer <firebase_id_token>`

---

## 🔐 Authentication

Authentication is handled by **Firebase Auth**. The app supports:

- ✉️ Email / Password sign-up & sign-in
- 🌐 Google OAuth sign-in

Firebase ID tokens are passed in the `Authorization: Bearer <token>` header for all protected backend routes. The server verifies tokens using the **Firebase Admin SDK**.

---

## 🛡️ Security Notes

> [!CAUTION]
> **Never commit your `.env` file or any real API keys to version control.**
> Both `server/.env` and `server/.gitignore` are configured to exclude secrets.

- API keys and service account credentials must be stored in `server/.env` only
- The frontend Firebase config (in `firebaseConfig.js`) only contains **public** credentials that are safe to ship in client bundles
- Rate limiting is applied to the `/api/generate-course` endpoint to prevent abuse

---

## 🧰 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 7, CSS Modules |
| Backend | Node.js 20, Express 5 |
| Database | MongoDB Atlas (via official driver) |
| AI | Google Gemini 2.5 Flash (`@google/genai`) |
| Auth | Firebase Auth (client) + Firebase Admin SDK (server) |
| PDF | PDFKit |
| Rate Limiting | express-rate-limit |
| Containerization | Docker, Docker Compose, Nginx |

---

## 📁 Environment Variables

### Backend (`server/.env`)

| Variable | Description | Required |
|----------|-------------|----------|
| `MONGO_URI` | MongoDB connection string | ✅ |
| `GEMINI_API_KEY` | Google Gemini API key | ✅ |
| `FIREBASE_SERVICE_ACCOUNT` | Firebase Admin SDK JSON (single line) | ✅ |
| `PORT` | Server port (default: `3001`) | ❌ |

### Frontend (`.env.local`)

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_API_URL` | Backend base URL (no trailing slash) | ❌ (defaults to `http://localhost:3001`) |

---

## 🚢 Deployment

### Backend (Render / Railway / Fly.io)
1. Set all environment variables from `server/.env.example` in your hosting dashboard
2. Set build command: `npm install`
3. Set start command: `node server.js`
4. Set port: `3001`

### Frontend (Render / Vercel / Netlify)
1. Set `VITE_API_URL` to your deployed backend URL (e.g., `https://your-api.onrender.com`)
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Add an SPA redirect rule: all paths → `/index.html`

---

## 🧑‍💻 Development Scripts

### Frontend (project root)
```bash
npm run dev       # Start Vite dev server
npm run build     # Production build
npm run preview   # Preview production build
npm run lint      # ESLint check
```

### Backend (`server/`)
```bash
npm run dev       # Start with nodemon (auto-reload)
npm start         # Start with node
```

---

## 📄 License

This project is licensed under the **ISC License**.

---

## 🙏 Acknowledgements

- [Google Gemini](https://deepmind.google/technologies/gemini/) for the AI backbone
- [Firebase](https://firebase.google.com/) for authentication
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) for the database
- [PDFKit](https://pdfkit.org/) for PDF generation
- [Lucide React](https://lucide.dev/) for icons
