# UNIX Time Helper

A tiny, clean tool to:
- See the current UNIX timestamp (seconds)
- Select a period to add (default: 24h) and see the future UNIX timestamp
- Read both as formatted times in your timezone and UTC (YYYY-MM-DD HH:MM:SS)
- Pause, resume, or reset the clock
- Copy timestamps with one click

This was created because figuring out reasonable timestamps for testing a scheduler was annoying, and most sites that came up were cluttered with ads. This app keeps it fast, simple, and ad-free.

## How it works

- Updates the current time every second when Live.
- Adds the selected period to compute a future timestamp.
- Shows:
  - Your local timezone abbreviation and a 24h formatted time
  - UTC in the same format
- Everything runs in the browser. No network calls or back end.

## UI elements

- Status chip
  - Live or Paused indicator in the header.
- Add period
  - A dropdown to pick common durations like 5m, 1h, 24h, 7d, 30d.
- Controls
  - Pause: freeze the time at the current second
  - Resume: continue ticking every second
  - Reset: set the dropdown back to 24h and resume ticking
- Now card
  - Current UNIX timestamp with a copy button
  - Your timezone abbreviation followed by the local 24h formatted time
  - UTC formatted time
- Future card
  - Future UNIX timestamp and the same local and UTC formatted lines

## Tips

- Use the copy buttons to quickly grab raw UNIX timestamps for testing.
- Edit the period options by changing the PERIOD_OPTIONS array in app/page.tsx.

## Deploy or install

- Use the v0 Install or Deploy button in the preview to add this to your repo or deploy to Vercel.
