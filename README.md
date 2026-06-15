# InsightAI — AI-Powered SaaS Analytics Dashboard

Production analytics dashboard + AI insights for teams.

> 🚀 **Live Demo**: https://ai-dasboard.vercel.app/

---

## 🏁 Badges

| Badge | Status |
|---|---|
| Build | CI badge placeholder |
| License | TBD (see “License” section) |
| Live Demo | https://ai-dasboard.vercel.app/ |
| GitHub | GitHub placeholder |

---

## 📹 Screenshots / Demo

<details>
<summary>View placeholders</summary>

| Dashboard | Analytics | AI Insights |
|---|---|---|
| Screenshot placeholder | Screenshot placeholder | Screenshot placeholder |

</details>

---

## ✨ Features

| Area | What’s included (verified in code) |
|---|---|
| 📊 KPI Dashboard | `src/features/dashboard/Dashboard.jsx` renders trial banner, KPI section, and multiple charts + activity feed |
| 📈 Analytics | `src/features/analytics/Analytics.jsx` renders recharts line chart + event distribution + summary cards |
| 🤖 AI Insights Chat | `src/features/ai/AIInsights.jsx` chat UI using `src/lib/apiClient.js` (secure `/api/chat` proxy + mock fallback) |
| 🗂️ Team Management | `src/features/users/DataTable.jsx` sortable/filterable/paginated table with member role/status actions + invite flow UI |
| 🧩 Projects | `src/features/projects/Projects.jsx` projects list with filters, pagination, create/edit/delete (permission-gated) |
| ⚙️ Workspace Settings | `src/features/organization/Settings.jsx` theme toggle, notification preferences (local), and locally-stored “OpenAI API Key” input |
| 🔔 Activity Logs | `src/pages/activity-logs/ActivityLogs.jsx` search/filter + paginated activity events from `analytics_data` in Supabase |
| 🔔 Notifications | `src/pages/notifications/Notifications.jsx` search/filter + paginated notifications from `analytics_data`, with read/unread persisted in `localStorage` |
| 👥 Invitations & Accept Flow | `src/features/invitations/pages/AcceptInvitePage.jsx` + `PrivateRoute.jsx` reconciling from invite token |
| 🔐 Auth (Supabase) | `src/features/auth/SignIn.jsx`, `src/features/auth/Signup.jsx`, route guards via `src/routes/PrivateRoute.jsx` and `src/routes/PublicOnlyRoute.jsx` |
| 🌙 Persistent Theme | `src/context/ThemeContext.jsx` stores theme in `localStorage` + toggles `dark` class |
| 📱 Responsive Layout | `src/components/layout/Layout.jsx` + `src/components/layout/Sidebar.jsx` collapsible sidebar + mobile overlay |

---

## 🏗️ Architecture

<details>
<summary>ASCII diagram (verified)</summary>

```text
Browser
  |
  |  POST /api/chat
  v
Vercel Serverless Function: api/chat.js
  (server-side only, uses process.env.GROQ_API_KEY)
  |
  v
Groq API
```

Local dev path (verified by Vite proxy + Express backend):

```text
Browser
  |
  |  POST /api/chat
  v
Vite dev server proxy (/api -> http://localhost:3001)
  |
  v
Express dev server: backend/server.js
  |
  v
backend/routes/chat.js
  |
  v
Groq API
```

</details>

---

## 🧰 Tech Stack

| Technology | Version (from `package.json`) |
|---|---|
| React | ^18.2.0 |
| React Router | ^6.22.0 |
| TanStack Query | ^5.24.0 |
| Recharts | ^2.12.0 |
| Tailwind CSS | ^3.4.1 |
| Axios | ^1.6.7 |
| Lucide React | ^0.344.0 |
| Vite | ^5.1.4 |
| Express (backend dev) | ^5.2.1 |
| Groq SDK | ^1.1.2 |
| nodemon (backend dev) | ^3.1.14 |

---

## ✅ Prerequisites

- Node.js (to run Vite + Express)
- A Supabase project (authentication + `analytics_data` table used by Activity/Notifications)
- Groq API key (server-side only)
- Vercel account (for serverless deployment)

---

## 🚀 Getting Started

### 1) Clone
```bash
git clone <your-repo-url>
cd <your-repo-folder>
```

### 2) Install
```bash
npm install
```

### 3) Environment setup

This repo’s `.gitignore` includes `.env`, but **`.env.example` is not present in this repository**. Create `.env` using the table below.

### 4) Run (local fullstack)
```bash
npm run dev
```

- Frontend: http://localhost:5173
- Backend (Express, for local `/api` proxy): http://localhost:3001

---

## 🔐 Environment Variables

> Source of truth: environment variable usage in the codebase (`process.env.GROQ_API_KEY`, `import.meta.env.VITE_*`).

Create a local `.env` file (and configure these in Vercel for production):

| Name | Required | Where used | Description |
|---|---:|---|---|
| `GROQ_API_KEY` | Yes | `backend/server.js`, `backend/routes/chat.js`, `api/chat.js` | Groq API key used server-side by `/api/chat`. Never expose to the browser. |
| `VITE_SUPABASE_URL` | Yes | `src/lib/supabaseClient.js`, `src/services/supabaseService.js` | Supabase project URL (client-side). |
| `VITE_SUPABASE_ANON_KEY` | Yes | `src/lib/supabaseClient.js`, `src/services/supabaseService.js` | Supabase anon key (client-side). |
| `VITE_API_URL` | Optional (has fallback) | `src/services/apiService.js` | Base URL for `apiService` (defaults to a Supabase URL if unset). |
| `VITE_APP_NAME` | Optional | `src/utils/constants.js` | Used for display name fallback (default: `AI SaaS Dashboard`). |
| `VITE_APP_VERSION` | Optional | `src/utils/constants.js` | Used for display version fallback (default: `1.0.0`). |

---

## 📦 npm Scripts

From `package.json`:

- `npm run dev` — `concurrently "npm run dev:frontend" "npm run dev:backend"`
Groq API

