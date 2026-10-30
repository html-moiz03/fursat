# Fursat: Day Planner

A day planner that starts from your fixed commitments ("anchors": work, class, meals, prayers) and shows the free gaps between them. Built as a portfolio project.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # unit tests for the gap logic
npm run build    # type-check + production build
```

## What works now

- Anchors with a start, end and repeat days; one-off anchors for a single date
- Anchors that cross midnight (e.g. 22:00 to 02:00) split correctly across two days
- Free gaps computed automatically, overlaps merged, tiny gaps hidden
- Proportional timeline with a live "now" line that updates every minute
- Everything saved in the browser (localStorage), nothing leaves your device
- Light and dark mode follow the system setting

## Where things live

```
src/
  types.ts                  Anchor, Task, Gap, Settings
  lib/time.ts               minutes <-> HH:MM, durations, local-date helpers
  lib/gaps.ts               anchorsForDate() and computeGaps()
  lib/gaps.test.ts          20 tests, one per edge case
  store/usePlannerStore.ts  Zustand store, persisted under "fursat:v1"
  components/               Timeline, AnchorForm, AnchorList
```

Times are stored as minutes since midnight and dates as `YYYY-MM-DD` strings, so the gap maths is plain integer work with no timezone bugs.

## Next steps

1. Task inbox and `canFit` / `placeTask` (the task type is already in `types.ts`)
2. Drag tasks into gaps with `@dnd-kit/core` (already installed)
3. Prayer anchors from the Aladhan API (`source: 'prayer-api'` is already in the model)
4. PWA install and offline support with `vite-plugin-pwa`
5. Weekly view, carry-over of unfinished tasks, then optional Supabase sync
