# Fursat: Day Planner

A day planner that starts from your fixed commitments ("anchors": work, class, meals, prayers) and shows the free gaps between them. Built as a portfolio project.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # unit tests for the planning logic
npm run build    # type-check + production build
```

## What works now

- Anchors with a start, end and repeat days; one-off anchors for a single date
- Anchors that cross midnight (e.g. 22:00 to 02:00) split correctly across two days
- Free gaps computed automatically, overlaps merged, tiny gaps hidden
- Sidebar layout with a greeting card (free time today and what's up next) and a month calendar to jump between days
- Task inbox: add a task with a length and drag it into a free gap. While you drag, gaps that fit light up and gaps that are too short say so. A dropdown does the same without a mouse
- Placed tasks appear on the timeline; tick them off, or send them back to the inbox
- Drag a placed task by its grip (⠿) to another gap, or within its own gap. A drop that does not fit is ignored and the task stays put
- Resize a placed task: drag the bottom edge of its block (or focus it and press the up and down arrow keys). It snaps to 5 minutes and stops at the next anchor, task or the end of the day
- Edit an anchor from the Anchors page (name, times, repeat days). Tasks it now overlaps are flagged as conflicts rather than silently moved
- Fragmentation is respected: two 60-minute holes do not fit a 90-minute task
- A task that ends up overlapping an anchor you added later is flagged as a conflict
- Proportional timeline with a live "now" line that updates every minute
- Prayer times: enter a city and Fajr, Dhuhr, Asr, Maghrib and Isha are fetched from the AlAdhan API and added as anchors, so prayer time is never counted as free. Months load as you open them and stay cached for offline use
- Day hours: choose when your day starts and ends (Anchors page). If a prayer falls outside, such as an early Fajr, the Today view offers a one-click "Show it". Tasks outside the hours are clipped and flagged
- Week view: seven days side by side with what is fixed and planned, free time per day, and a weekly total. Click a day to open it. Drag a task by its grip onto another day, or drag one from the inbox strip: it lands at that day's earliest free time that fits, and days with no room say so while you drag
- Carry-over: tasks planned for an earlier day and never ticked off show a notice on Today. "Move to today" fits them into what is left of today (oldest first, a task with no room goes to the inbox); "Back to inbox" unplans them instead
- Installable as an app (phone home screen or desktop) and works offline: the whole app is cached by a service worker, with a quiet "update ready" notice when a new version is deployed
- A new visitor starts empty, with a one-click sample day; "Clear all data" is on the Anchors page
- Everything is saved in the browser (localStorage). The only thing sent out is the city and country you enter for prayer times
- Two themes: the calm light one (default) and a dark "Midnight" one with a slow drifting glow and film grain, plus Auto to follow the device. The switch is in the sidebar (top right on a phone)
- Motion that helps: views fade between each other, blocks spring into place, the free-time counter glides, a ring shows how much of the day is done and a bar shows the current item's progress. All of it switches off for people who ask their device to reduce motion
- Focus timer: press the play button on a placed task (or F for your current one) to open a full-screen countdown with a progress ring. Pause, add 5 minutes, finish early, or tuck it into a small pill with Esc. The time shows in the tab title, a chime plays at the end, and a running session survives a reload
- Friendlier: keyboard shortcuts (press ? to list them: T today, W week, A anchors, N new task, F focus, arrows for the previous or next day), a toast that says why a drop did not fit, and a three-step intro for first-time visitors

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
  store/useInstall.ts       keeps the browser's install prompt for the Install button
  lib/dayWindow.ts          day-hour options, suggestWindow(), tasksOutside()
  lib/dayWindow.test.ts     11 tests for the day-hours rules
  lib/week.ts               weekDates() and dayOverview() for the week view
  lib/week.test.ts          tests for week boundaries and the per-day overview
  lib/carryOver.ts          overdueTasks() and planCarryOver()
  lib/carryOver.test.ts     tests for the carry-over rules
  lib/theme.ts              resolveTheme() and the hook that sets data-theme on <html>
  lib/shortcuts.ts          which key does what (pure, tested)
  lib/focus.ts              focus-session maths: countdown, pause, extend, pickFocusTask() (tested)
  lib/chime.ts              the end-of-session chime (WebAudio)
  store/useFocus.ts         the running focus session, persisted under "fursat:focus"
  lib/useTween.ts           a number that glides to its new value
  lib/fit.ts                freeRanges(), checkFit(), fitFrom(), placedOn(), hasConflict()
  lib/fit.test.ts           35 tests for the task-fitting rules
  store/usePlannerStore.ts  Zustand store, persisted under "fursat:v1"
  store/usePlannerStore.test.ts  18 tests for editing anchors, moving and resizing placed tasks, dropping on a day and carry-over
  components/               Sidebar, Greeting, EmptyStart, PlannerDnd (drag and drop), MonthCalendar, Timeline, TaskInbox, TaskBlock, DaySummary, AnchorForm, AnchorList, DataControls, PrayerCard, DayHoursCard, ThemeSwitch, Aurora, Toaster, FocusLayer, ShortcutHelp, Motion, WindowNotice, WeekView, CarryOverNotice, InstallButton, PwaStatus, Card
```

Times are stored as minutes since midnight and dates as `YYYY-MM-DD` strings, so the gap maths is plain integer work with no timezone bugs.

## Next steps

1. Keyboard-only moving, edit prayer settings per prayer, focus stats
2. Optional Supabase sync, then reorder or resize tasks inside a day
