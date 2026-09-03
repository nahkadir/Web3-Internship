# Day 4: Notifications, Live Updates, Performance & Polish

### Toasts

- Made a ToastContext so any part of the app can show a small message
- Auto-disappears after 3 seconds
- Used it for: add, update, delete, CSV export success, new live transaction

### CSV Export

- Now exports only the filtered list, not everything
- Fixed headers to match spec: id, type, amount, category, description, date
- Added proper escaping (so commas/quotes in text don't break the file)
- Button shows "Exporting..." and disables itself while working

### Confirm Before Delete

- Clicking delete no longer removes instantly
- Opens a small popup asking to confirm first
- Cancel just closes it, nothing happens

### Accessibility

- Added real <label> tags to form inputs (visually hidden but there for screen readers)

### Live Transaction Simulation

- Added a toggle button ("Go live")
- When on, adds a random transaction every 20 seconds
- Uses the same addTransaction function as manual entries
- New row gets a highlight color for a couple seconds
- Learned useEffect cleanup here — when you turn it off, the old timer has to be cleared (clearInterval) or you get multiple timers running at once

### Error Handling

I had already implemented this yesterday:

- Wrapped localStorage read/write in try/catch
- If saved data is corrupted or storage fails, app falls back to sample data instead of crashing

### Performance

- Added useMemo to chart data and summary card totals that skips recalculating if data hasn't changed
- Split table rows into their own component with React.memo
- Used useCallback for the row's edit/delete handlers so memo actually works
