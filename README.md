# InsightAI — AI-Powered SaaS Dashboard

A production-grade analytics dashboard built with **React**, **JavaScript**, and modern frontend tooling. Features real-time data, AI-powered insights, interactive charts, and a fully responsive UI with dark mode.

> 🚀 **Live Demo**: [your-vercel-link.vercel.app](#)
> 📦 **GitHub**: [github.com/yourusername/ai-saas-dashboard](#)

---

## ✨ Features

- **📊 Dashboard** — KPI cards, area charts, pie charts, and live REST API data
- **📈 Analytics** — Multi-chart analytics with user growth and revenue vs expenses  
- **🤖 AI Insights** — Chat interface powered by **secure backend proxy** → Groq AI
- **🗃️ Data Table** — Sortable, filterable, paginated table with live API data
- **🌙 Dark Mode** — Persistent dark/light theme toggle
- **📱 Responsive** — Mobile-first design with collapsible sidebar
- **⚡ Fast** — Built with Vite, React Query caching, and lazy loading

---

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| React 18 | UI framework |
| React Router v6 | Client-side routing |
| TanStack Query (React Query) | Data fetching & caching |
| Recharts | Charts and data visualization |
| Tailwind CSS | Utility-first styling |
| Axios | HTTP client |
| Lucide React | Icons |
| **Vercel Serverless** | Secure backend API proxy |
| **Groq AI** | Ultra-fast LLM inference |
| Vite | Build tool |

---

## 🚀 Getting Started

### 1. Clone & Install
```bash
git clone https://github.com/yourusername/ai-saas-dashboard.git
cd ai-saas-dashboard
npm install
```

### 2. Backend Setup (Serverless)
API key **never** exposed to frontend:
```
# Backend (.env or Vercel dashboard)
GROQ_API_KEY=your_groq_key_here
```

### 3. Run Development Server (Local Fullstack)
```bash
# Copy & set API key
cp .env.example .env
# Edit .env: GROQ_API_KEY=your_key

# Start frontend + backend
npm run dev
```

Frontend: http://localhost:5173  
Backend: http://localhost:3001/api/chat (proxied)

**Scripts:**
- `npm run dev:frontend` — Vite only (mocks)
- `npm run dev:backend` — Backend server
- `npm run dev` — Both concurrently

### 4. Build for Production
```bash
npm run build
npm run preview
```

---

## 📁 Project Structure

```
src/
├── components/    # UI components
├── pages/         # Route pages
├── services/      # API services
│   └── aiService.js  # Secure backend proxy
backend/
└── api/           # Vercel serverless functions
    └── chat.js    # Groq AI proxy 🔒
```

---

## 🔑 Key Implementation Highlights

### Secure Serverless API Architecture
**Implemented secure serverless API architecture using Vercel Functions to protect API keys and prevent client-side exposure.**

```js
// Frontend (safe)
const data = await fetch('/api/chat', { method: 'POST', body: JSON.stringify({message}) })

// Backend (secret key)
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
```

### Custom Proxy Service
```js
// services/aiService.js  
export async function getAIInsight(prompt) {
  const response = await fetch('/api/chat', {
    method: 'POST',
    body: JSON.stringify({ message: systemPrompt + prompt })
  })
  return response.reply  // Backend hides Groq key
}
```

---

## 🌐 Deployment (Vercel Recommended)

```bash
npm i -g vercel
vercel --prod
```

**Vercel Dashboard** → Settings → Environment Variables:
```
GROQ_API_KEY = gsk_your_key_here
```

**Remove** any `VITE_GROQ_API_KEY` vars.

---

## 🧪 Challenges Overcome

See [CHALLENGES.md](./CHALLENGES.md)

- Migrated from direct client-side AI calls to secure backend proxy
- Graceful fallback to mocks during dev
- Maintained identical UX while improving security

---

## 📸 Screenshots

| Dashboard | **Secure AI Insights** | Data Table |
|---|---|---|
| ![Dashboard](#) | ![AI](#) | ![Table](#) |

---

## 📄 License

MIT — perfect portfolio project.

