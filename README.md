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
- Sidebar layout with a greeting card (free time today and what's up next) and a month calendar to jump between days
- Task inbox: add a task with a length, see which gaps it fits in, and place it from a dropdown (gaps that are too short are disabled and show by how much)
- Placed tasks appear on the timeline; tick them off, or send them back to the inbox
- Fragmentation is respected: two 60-minute holes do not fit a 90-minute task
- A task that ends up overlapping an anchor you added later is flagged as a conflict
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
  lib/day.ts                freeZonesFor() and upNext(), shared by the greeting and timeline
  lib/calendar.ts           monthGrid() and shiftMonth() for the calendar
  lib/fit.ts                freeRanges(), checkFit(), placedOn(), hasConflict()
  lib/fit.test.ts           30 tests for the task-fitting rules
  store/usePlannerStore.ts  Zustand store, persisted under "fursat:v1"
  components/               Sidebar, Greeting, MonthCalendar, Timeline, TaskInbox, TaskBlock, DaySummary, AnchorForm, AnchorList, Card
```

Times are stored as minutes since midnight and dates as `YYYY-MM-DD` strings, so the gap maths is plain integer work with no timezone bugs.

## Next steps

1. Drag tasks into gaps with `@dnd-kit/core` (already installed), on top of the existing `planTask` rule
2. Prayer anchors from the Aladhan API (`source: 'prayer-api'` is already in the model)
3. PWA install and offline support with `vite-plugin-pwa`
4. Weekly view, carry-over of unfinished tasks, then optional Supabase sync
