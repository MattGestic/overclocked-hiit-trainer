# MVP Requirements

User-facing requirements for OVER•CLOCK v1. Each maps to what's actually
built — see [`docs/architecture.md`](architecture.md) for how, and
[`docs/test-plan.md`](test-plan.md) for how each is verified.

## Core

1. Single logged-in user; email/password auth (Supabase Auth). Nothing
   renders until a valid session exists. *(`Login.jsx`)*
2. View a list of programmes (name, type, block count, last-used) with a
   weekly done/not-done strip, New/Edit/Delete actions. *(`Library.jsx`)*
3. Create or edit a programme: name, type (HIIT/TABATA/CIRCUIT/AMRAP/EMOM),
   optional timed intro (5–60s), one or more named blocks (repeat count,
   active/recover seconds), each with an ordered list of exercises
   (name, reps, weight, notes). *(`ProgrammeEditor.jsx`)*
4. Quick Create: build one or more blocks from a bundled exercise catalog
   instead of typing each row by hand — search/filter and multi-select
   exercises, assign each to a block number, review grouped by block with
   drag-and-drop reorder (including moving an exercise to a different
   block), then generate. Generating with exercises still unassigned asks
   for confirmation (native confirm, one tap) rather than requiring a
   second tap on the Generate button itself. Generated blocks are appended
   to the programme draft, inheriting the interval (active/recover
   seconds) of the programme's first existing block, or 45/15s if it has
   none yet — never written to Supabase until the normal Save. Reachable
   from `ProgrammeEditor`'s own "Quick Create" button and from Library's
   "+ New" (unless turned off in Settings, see #16). *(`QuickSelectModal.jsx`
   and its `SelectStep`/`AssignStep`/`PreviewStep`; `src/lib/
   exerciseCatalog.js`)*
5. Delete a programme (confirm first — cascades to its blocks/activities).
6. Start a programme and see: a persistent live status strip (current
   exercise, phase, countdown, pause/skip/expand/stop) while browsing the
   block overview, and a fullscreen timer view with a circular countdown,
   phase-coloured background, and a "next up" preview.
   *(`ActiveWorkout.jsx`, `LiveBar.jsx`, `TimerRun.jsx`)*
7. Audio cues fire automatically at phase transitions — no manual
   interaction required. Cues audibly duck (not pause) background music
   such as Spotify. *(manual on-device verification — see test plan)*
8. The screen stays on for the duration of a running programme; reverts to
   normal sleep behaviour on pause or stop. *(`useWakeLock.js`)*
9. Timer survives phone lock/unlock: correct elapsed time, cues on
   schedule, wake lock re-engages automatically on unlock.
   *(`useTimerEngine.js`'s single `visibilitychange` effect)*
10. Pause/resume and stop-early controls; stop confirms first since it
    discards progress.
11. Skip-phase jumps to the next phase and fires its cue immediately, same
    as if the phase had counted down naturally.
12. The last activity of a programme has no trailing recover phase — it
    goes straight to done with the end-of-programme cue.
13. All programme data persists to Supabase and reloads correctly after a
    refresh or a fresh login.
14. Completing or stopping a run logs a session record, feeding the
    Library's weekly strip and the History screen. *(`sessionLogsApi.js`)*
15. History screen: this-week count, current streak, all-time hours, a
    navigable month calendar (with muted leading/trailing days from
    adjacent months, a "Today" jump when viewing another month, and a
    per-day summary mode — Final for a past month, To date for the
    current one, an averaged Forecast for a future one), a tap-a-day
    filter on the session list, and a recent-sessions list. *(`History.jsx`)*
16. Settings screen: display name, theme (dark/light), colour palette, font
    pairing, a real density toggle, a toggle for whether Library's "+ New"
    opens Quick Create directly or the standard create-programme screen,
    and sign out. *(`Settings.jsx`)*
17. Browser/PWA back button navigates within the app instead of leaving it,
    and always returns to the screen that was actually previous — not a
    hardcoded destination. *(`useNavStack.js`)*
18. Responsive: Library shows 1/2/3 programme columns at sm/lg/xl widths;
    the fullscreen timer splits into a side-by-side ring + block list on
    landscape tablet/desktop; History's calendar and recent-sessions list
    sit side by side on wide screens. *(`useLayout.js`)*

## Explicitly out of scope for v1

- Multi-user / coach-client model
- Cue customisation UI (cue→sound mapping is fixed)
- A cooldown phase distinct from recover
- An in-context "Add Exercise" picker modal during a live workout — editing
  a programme's exercises happens in `ProgrammeEditor`, reached via the
  Edit button, not inline within `ActiveWorkout`
- Runtime editing of the Quick Create exercise catalog ("My Exercises") —
  it's a bundled, curated list for v1, not a user-managed library
- A programme-level default interval with a per-block override, and
  per-exercise (rather than per-block) work/rest timing — both visible in
  Quick Create's own design reference but not part of its v1 build (see
  `docs/architecture.md`)
- Swipe-to-delete / quick-swap / swap-menu exercise editing — a touch-
  gesture component and a live exercise-substitution flow, seen in the v2
  design reference but not built this pass
- Inline exercise editing (reps/weight + "confirm as actuals") during a
  live run, and a "Back" reverse-timer control — both need new
  `timerReducer` states/actions, not a visual change
- A "between blocks" recovery interval — needs a new schema column and
  phase-engine behaviour, same category as the per-block interval override
  above
- Extended programme metadata (coach/athlete/week/status/description/
  check-in time/comments/remarks) and per-programme audio volume (vs.
  today's global device volume) — both need new schema columns; the
  coach/athlete framing specifically echoes the declined multi-user model
  above and isn't recommended even if this is revisited later
