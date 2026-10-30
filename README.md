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
- Task inbox: add a task with a length and drag it into a free gap. While you drag, gaps that fit light up and gaps that are too short say so. A dropdown does the same without a mouse
- Placed tasks appear on the timeline; tick them off, or send them back to the inbox
- Fragmentation is respected: two 60-minute holes do not fit a 90-minute task
- A task that ends up overlapping an anchor you added later is flagged as a conflict
- Proportional timeline with a live "now" line that updates every minute
- Prayer times: enter a city and Fajr, Dhuhr, Asr, Maghrib and Isha are fetched from the AlAdhan API and added as anchors, so prayer time is never counted as free. Months load as you open them and stay cached for offline use
- A new visitor starts empty, with a one-click sample day; "Clear all data" is on the Anchors page
- Everything is saved in the browser (localStorage). The only thing sent out is the city and country you enter for prayer times
- One calm light theme

## Where things live

```
src/
  types.ts                  Anchor, Task, Gap, Settings
  lib/time.ts               minutes <-> HH:MM, durations, local-date helpers
  lib/gaps.ts               anchorsForDate() and computeGaps()
  lib/gaps.test.ts          20 tests, one per edge case
  lib/day.ts                freeZonesFor() and upNext(), shared by the greeting and timeline
  lib/calendar.ts           monthGrid() and shiftMonth() for the calendar
  lib/aladhan.ts            AlAdhan monthly URL, response parser, prayerAnchors()
  lib/aladhan.test.ts       tests for both response shapes, errors and the fetch wrapper
  lib/usePrayerSync.ts      fetches the month on screen when prayer times are on
  lib/fit.ts                freeRanges(), checkFit(), fitFrom(), placedOn(), hasConflict()
  lib/fit.test.ts           35 tests for the task-fitting rules
  store/usePlannerStore.ts  Zustand store, persisted under "fursat:v1"
  components/               Sidebar, Greeting, EmptyStart, PlannerDnd (drag and drop), MonthCalendar, Timeline, TaskInbox, TaskBlock, DaySummary, AnchorForm, AnchorList, DataControls, PrayerCard, Card
```

Times are stored as minutes since midnight and dates as `YYYY-MM-DD` strings, so the gap maths is plain integer work with no timezone bugs.

## Next steps

1. PWA install and offline support with `vite-plugin-pwa`
2. Drag a placed task to a new gap, resize it, edit anchors
3. Weekly view, carry-over of unfinished tasks, then optional Supabase sync
