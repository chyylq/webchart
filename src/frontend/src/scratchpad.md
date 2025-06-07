# Multi-Series Chart UI Progress

## Step 2: Fetch Additional Module Data & Merge for Chart

[X] Step 1: Multi-select UI and Y-axis assignment for overlays (done)
[ ] Step 2: Fetch overlay module data and merge for chart

### Plan for Step 2
- For each overlay module, fetch time series data using useInstrumentData (with React Query's useQueries for parallel fetching).
- Merge main and overlay module data on date.
- Build a combined plotColumns array, each with its Y-axis assignment.
- Pass merged data and Y-axis mapping to InstrumentChart.

---

## Implementation Checklist
- [ ] Use useQueries to fetch overlay modules' data
- [ ] Merge all data on date (main + overlays)
- [ ] Build plotColumns array with yAxis info
- [ ] Pass merged data and mapping to InstrumentChart

---

## Next Steps
- Implement useQueries for overlays
- Merge/align data for chart
- Test with multiple overlays and Y-axis assignments

---

## Reflection
After this, proceed to update InstrumentChart to support multi-series with dual axes if needed.
