# InsightAI — AI-Powered SaaS Dashboard

A production-grade analytics dashboard built with **React**, **JavaScript**, and modern frontend tooling. Features real-time data, AI-powered insights, interactive charts, and a fully responsive UI with dark mode.

> 🚀 **Live Demo**: [your-vercel-link.vercel.app](#)
> 📦 **GitHub**: [github.com/yourusername/ai-saas-dashboard](#)

---

## ✨ Features

- **📊 Dashboard** — KPI cards, area charts, pie charts, and live REST API data
- **📈 Analytics** — Multi-chart analytics with user growth and revenue vs expenses
- **🤖 AI Insights** — Chat interface powered by OpenAI GPT-3.5 for data analysis
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
| OpenAI API | AI-powered insights |
| Vite | Build tool |

---

## 🚀 Getting Started

### 1. Clone & Install
```bash
git clone https://github.com/yourusername/ai-saas-dashboard.git
cd ai-saas-dashboard
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
```

Edit `.env` and add your OpenAI API key (optional — works without it using mock responses):
```
VITE_OPENAI_API_KEY=sk-your-key-here
```

### 3. Run Development Server
```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

### 4. Build for Production
```bash
npm run build
npm run preview
```

---

## 📁 Project Structure

```
src/
├── components/
│   ├── Layout.jsx         # App shell (sidebar + header)
│   ├── Sidebar.jsx        # Navigation sidebar
│   ├── Header.jsx         # Top header with search & theme toggle
│   └── ui/
│       └── KPICard.jsx    # Reusable KPI metric card
├── pages/
│   ├── Dashboard.jsx      # Main dashboard with charts & live API
│   ├── Analytics.jsx      # Detailed analytics charts
│   ├── AIInsights.jsx     # AI-powered chat interface
│   ├── DataTable.jsx      # Sortable/filterable data table
│   └── Settings.jsx       # User preferences
├── context/
│   └── ThemeContext.jsx   # Dark/light mode state
├── hooks/
│   └── useFetch.js        # Custom React Query hooks
├── services/
│   └── aiService.js       # OpenAI API integration
└── utils/
    └── mockData.js        # Chart data generators & formatters
```

---

## 🔑 Key Implementation Highlights

### Custom Data Fetching Hook
```js
// hooks/useFetch.js
export function useFetch(key, url, options = {}) {
  return useQuery({
    queryKey: [key],
    queryFn: async () => {
      const { data } = await api.get(url)
      return data
    },
    ...options,
  })
}
```

### AI Integration
```js
// services/aiService.js
export async function getAIInsight(prompt) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
    body: JSON.stringify({ model: 'gpt-3.5-turbo', messages: [...] }),
  })
  // ...
}
```

---

## 🌐 Deployment

This app is deployed on **Vercel**. To deploy your own:

```bash
npm i -g vercel
vercel --prod
```

Add `VITE_OPENAI_API_KEY` in your Vercel dashboard under Environment Variables.

---

## 🧪 What I Learned / Challenges

See [CHALLENGES.md](./CHALLENGES.md) for a detailed write-up on:
- Managing server state with React Query vs local state
- Implementing a scalable dark mode with Tailwind's `class` strategy
- Handling OpenAI API errors gracefully with fallback mock responses
- Building a reusable, accessible data table from scratch

---

## 📸 Screenshots

| Dashboard | AI Insights | Data Table |
|---|---|---|
| ![Dashboard](#) | ![AI Insights](#) | ![Table](#) |

---

## 📄 License

MIT — feel free to fork and use as a portfolio project.
