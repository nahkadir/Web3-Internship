# Day 5

## Full app testing

- Went through every feature end-to-end: add, edit, delete, filter, search, CSV export, live simulation
- Checked Summary Cards and charts update immediately when transactions change
- Confirmed everything works together, not just individually

## Edge case testing

- Zero transactions — list, cards, and charts show empty states instead of breaking
- Description with commas and quotes — CSV export still opens correctly
- Very long description + huge amount — no layout breaking
- Corrupted localStorage data — app falls back to sample data instead of crashing
- Mobile width (375px) — filters wrap, charts stay readable, table scrolls instead of breaking

## Live simulation refinement

- Made simulated transactions more realistic — amount and description now match the category (no more "Coffee" under Healthcare)
- Confirmed toggling Live on/off starts and stops the timer properly with no leftover timers running
- Confirmed simulated transactions go through the same addTransaction as manual ones

## Cleanup

- Removed the dark mode button since it was never implemented (unfinished placeholder)
- Checked for and removed leftover console.logs and unused imports

## Accessibility

- Verified keyboard navigation — all buttons, inputs, and links are reachable and usable with Tab

## UI polish

- Improved the footer: made footer links actually point to the right sections

## Result

Dashboard is fully tested, handles broken/empty data safely, works across screen sizes and is cleaned up and ready for demo/review.
