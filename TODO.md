- [ ] Update src/features/analytics/Analytics.jsx per production-safe analytics UI improvements
  - [ ] Remove static "Data Source" summary card
  - [ ] Add "Most Active Event" card using real eventCounts with safe fallback
  - [ ] Fix timeline aggregation to group by DATE(created_at) and plot numeric event volume via metric_value||1
  - [ ] Add "Latest Activity" card using latest created_at mapped from real event types
  - [ ] Add/adjust empty states so UI never crashes on empty analytics
  - [ ] Introduce useMemo for derived timeline, mostActiveEvent, latestActivity
  - [ ] Ensure totals use reduce(sum + (metric_value||1)) only
  - [ ] Sanity check chart dataKey matches derived timeline structure

