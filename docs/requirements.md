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
4. Delete a programme (confirm first — cascades to its blocks/activities).
5. Start a programme and see: a persistent live status strip (current
   exercise, phase, countdown, pause/skip/expand/stop) while browsing the
   block overview, and a fullscreen timer view with a circular countdown,
   phase-coloured background, and a "next up" preview.
   *(`ActiveWorkout.jsx`, `LiveBar.jsx`, `TimerRun.jsx`)*
6. Audio cues fire automatically at phase transitions — no manual
   interaction required. Cues audibly duck (not pause) background music
   such as Spotify. *(manual on-device verification — see test plan)*
7. The screen stays on for the duration of a running programme; reverts to
   normal sleep behaviour on pause or stop. *(`useWakeLock.js`)*
8. Timer survives phone lock/unlock: correct elapsed time, cues on
   schedule, wake lock re-engages automatically on unlock.
   *(`useTimerEngine.js`'s single `visibilitychange` effect)*
9. Pause/resume and stop-early controls; stop confirms first since it
   discards progress.
10. Skip-phase jumps to the next phase and fires its cue immediately, same
    as if the phase had counted down naturally.
11. The last activity of a programme has no trailing recover phase — it
    goes straight to done with the end-of-programme cue.
12. All programme data persists to Supabase and reloads correctly after a
    refresh or a fresh login.
13. Completing or stopping a run logs a session record, feeding the
    Library's weekly strip and the History screen. *(`sessionLogsApi.js`)*
14. History screen: this-week count, current streak, all-time hours, a
    navigable month calendar with session days marked, and a recent-
    sessions list. *(`History.jsx`)*
15. Settings screen: display name, theme (dark/light), a real density
    toggle, sign out. *(`Settings.jsx`)*
16. Browser/PWA back button navigates within the app instead of leaving it,
    and always returns to the screen that was actually previous — not a
    hardcoded destination. *(`useNavStack.js`)*
17. Responsive: Library shows 1/2/3 programme columns at sm/lg/xl widths;
    the fullscreen timer splits into a side-by-side ring + block list on
    landscape tablet/desktop; History's calendar and recent-sessions list
    sit side by side on wide screens. *(`useLayout.js`)*

## Explicitly out of scope for v1

- Multi-user / coach-client model
- Cue customisation UI (cue→sound mapping is fixed)
- Exercise name autocomplete or a shared exercise library
- A cooldown phase distinct from recover
- An in-context "Add Exercise" picker modal during a live workout — editing
  a programme's exercises happens in `ProgrammeEditor`, reached via the
  Edit button, not inline within `ActiveWorkout`
- Multiple selectable colour palettes or font pairings (Settings shows the
  one that exists; more are a later addition, not a v1 requirement)
