# Challenges & Learnings

This document describes the key technical challenges I faced while building this project and how I solved them. This is great to talk about in interviews!

---

## 1. Server State vs Client State

**Challenge**: Deciding when to use React Query vs `useState` for data.

**Solution**: I adopted the rule — *anything that comes from an API lives in React Query; anything that only exists in the UI lives in `useState`*. This kept components clean and eliminated redundant loading states.

**Outcome**: React Query's automatic caching meant navigating between pages felt instant — no redundant API calls on re-renders.

---

## 2. Dark Mode Without Flash

**Challenge**: On page load, there was a brief flash of light mode before the dark theme applied.

**Solution**: I initialized the theme state from `localStorage` synchronously using a function initializer in `useState`:

```js
const [theme, setTheme] = useState(() => {
  return localStorage.getItem('theme') || 'light'
})
```

This reads the persisted value before the first render, eliminating the flash.

---

## 3. AI API Error Handling

**Challenge**: The OpenAI API can fail (rate limits, invalid key, network errors). This shouldn't break the whole page.

**Solution**: Wrapped the API call in a try/catch and built a `getMockInsight()` fallback that returns realistic demo data. The UI shows an error message but remains fully functional.

---

## 4. Reusable Data Table

**Challenge**: Building a sortable, filterable, paginated table without a library.

**Solution**: Used `useMemo` to derive filtered + sorted data without mutating the original array:

```js
const filtered = useMemo(() => {
  let data = [...users]
  // filter → sort → return
}, [users, search, sortField, sortDir])
```

This keeps the logic declarative and performant.

---

## 5. Responsive Sidebar

**Challenge**: The sidebar needed to work as a persistent panel on desktop and a slide-over drawer on mobile.

**Solution**: Used Tailwind's `lg:` breakpoints combined with CSS `translate-x` transitions. On mobile, a backdrop overlay closes the drawer on click.

---

## 6. Environment Variables Security

**Challenge**: The OpenAI API key must not be hardcoded.

**Solution**: Vite exposes only variables prefixed with `VITE_` to the client bundle. Added `.env` to `.gitignore` and provided `.env.example` as a template.
