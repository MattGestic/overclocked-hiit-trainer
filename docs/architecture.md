# Architecture

## File layout

```
src/
  App.jsx                       Screen router (useNavStack-driven), session gate
  main.jsx                      Entry point — ThemeProvider + ToastProvider wrap App
  index.css                     Tailwind + shared-ui tokens import, fixed-viewport app shell

  components/
    Login.jsx                   Email/password form
    Library.jsx                 Programme list, weekly heatmap, responsive grid
    ProgrammeEditor.jsx         Create/edit form — name/type/intro/blocks/activities
    ActiveWorkout.jsx           Owns the single useTimerEngine instance for a run;
                                 overview + LiveBar, or delegates to TimerRun when expanded
    LiveBar.jsx                 Persistent status strip (exercise, phase, controls)
    TimerRun.jsx                Fullscreen timer; landscape split view via useLayout
    BlockList.jsx                Block/exercise table — shared by ActiveWorkout and
                                 TimerRun's split view, so it exists in exactly one place
    Settings.jsx                Name, theme, density, sign out
    History.jsx                 Computed stats, month calendar, recent sessions

  hooks/
    useTimerEngine.js           Phase-sequencing state machine (see below) + React glue
    useWakeLock.js               navigator.wakeLock wrapper
    useAudioReliability.js       Silent-loop keep-alive + Media Session registration
    useNavStack.js                History-API navigation stack
    useLayout.js                  Breakpoint/orientation state

  lib/
    supabaseClient.js            Single Supabase client instance
    programmesApi.js             Programme/block/activity CRUD, row<->client shape mapping
    sessionLogsApi.js            Session logging + stats queries
    audioEngine.js                Cue playback — currently a placeholder (see below)

  shared-ui/                     Vendored design system (see ADR 0002) — tokens, ThemeProvider,
                                 ToastProvider, DayDots, TabBar, Avatar, etc.

supabase/
  schema.sql                     Canonical DDL + RLS + triggers, idempotent, run manually
```

## The timer engine

`useTimerEngine.js` splits into two layers on purpose:

- **`timerReducer`** (exported, pure) implements the phase state machine:
  `intro → [(active → recover) × activities × repeat] × blocks → complete`.
  It's a plain `(state, action) => state` reducer with no DOM/React
  dependency, which is what makes it unit-testable without mounting
  anything — see `useTimerEngine.test.js`.
- **`useTimerEngine`** (the hook) wraps the reducer in `useReducer`, adds
  the 1-second tick interval, fires cues from `state.pendingCues` as a side
  effect, and wires `useWakeLock`/`useAudioReliability` at the right
  lifecycle points. It owns the *only* `visibilitychange` effect in the
  app — re-acquiring the wake lock and resuming the AudioContext when the
  tab regains visibility. Don't duplicate this effect elsewhere; that's
  how you get a double-acquire bug.

Key rules encoded in the reducer, because they're easy to get wrong (one
was, in fact, wrong on the first pass — caught by the tests):

- Recover always runs between activities, **including across block
  boundaries** — a block's `repeat` cycles through its *entire* activity
  list per round, not each activity individually.
- Recover is skipped only after the programme's absolute last activity.
- `endBlock` fires instead of `endActivity` only when the finishing
  activity is the last activity of a block's last round.
- Countdown ticks fire in the last 3 seconds of `intro` and `recover`
  only — not `active` phases, which are marked by their own end cue.

`nextIndices` (also exported) computes "what comes after these indices" and
is reused by `TimerRun`'s "next up" preview, rather than re-deriving that
logic a second time.

## Audio engine — placeholder by design

`src/lib/audioEngine.js` currently just logs a warning per cue. It exports
a locked function contract (`bootAudioContext`, `resumeAudioContext`,
`setVolume`/`getVolume`, `playIntroChime`/`playCountdownTick`/
`playStartActivity`/`playEndActivity`/`playEndBlock`/`playEndProgramme`)
that every caller in the app is already written against. The real
synthesis/decoded-MP3 implementation drops in by replacing this file's
internals only — no other file needs to change.

Final cue mapping (reconciled from the build spec):

| Transition | Cue |
|---|---|
| Start pressed → intro begins | Bell (single strike) |
| Last 3s of intro | Servant-bell, 1/sec ×3 |
| Intro ends → first activity starts | Whistle (synthesized — no source file) |
| Active phase ends → recover starts | Ship-bell-two-chimes |
| Last 3s of recover | Servant-bell, 1/sec ×3 |
| Recover ends → next activity starts | Whistle |
| End of a block | Gong |
| End of programme | Gong (same sound) |

## Data model

Client-side nested shape (see `programmesApi.js`'s `getProgramme`/
`saveProgramme` for the row↔client mapping):

```js
{
  id, name, type,            // 'HIIT' | 'TABATA' | 'CIRCUIT' | 'AMRAP' | 'EMOM'
  introEnabled, introSeconds,
  blocks: [
    { id, position, name, repeat, active, recover,
      activities: [ { id, position, name, reps, weight, notes } ] }
  ]
}
```

Maps directly onto `supabase/schema.sql`'s `programmes` / `blocks` /
`activities` tables. RLS scopes every table to `auth.uid()`.

**`session_logs`** is a separate, minimal table (`programme_id`,
`programme_name` snapshot, `started_at`, `ended_at`, `status`) written once
per run by `recordSession()` — on natural completion or on explicit Stop.
It intentionally doesn't model workout *scheduling* ("missed" vs.
"planned") — there's no scheduling feature to back that distinction yet, so
days without a session render as neutral, not missed.

### Known limitation: delete-and-reinsert save

`saveProgramme` upserts the programme row, deletes its existing blocks
(cascades activities), then bulk-inserts the current blocks/activities —
three sequential Supabase calls, not wrapped in a client-side transaction.
A failure between steps can leave a programme with stale/missing blocks.
Acceptable for this MVP's scale; the fast follow is a single Postgres RPC
that does the whole replace atomically.

## Styling

Tailwind 4 utility classes for structural layout (flex/grid/spacing);
inline `style` objects reading CSS custom properties for anything
token-driven (colour, font, radius, spacing scale) — matching the existing
pattern in the vendored `shared-ui` components rather than introducing a
third convention. No hardcoded hex values in component files; see
`src/shared-ui/theme/tokens.css` for the full token set (colours, type
scale, spacing, radii, shadows, motion — dark and light themes) plus the
`[data-density="compact"]` block that gives the Settings density toggle
real effect.

## Navigation

`useNavStack.js` replaces a plain `useState` view-swap with real History
API integration: forward navigation (`navigate()`) pushes a new history
entry; going back always calls `window.history.back()` rather than each
screen independently deciding where "back" leads. That's what makes
`Library → Workout → Edit → back` correctly land on Workout (not Library)
without any screen needing to know its own navigation history — the
browser's own back stack is the single source of truth.

## State management

Plain `useState`/`useReducer` throughout — no external state library. At
this scale (a handful of screens, one non-trivial state machine that's
naturally a reducer, one entity graph fetched per screen) a library like
Redux or Zustand would be overhead with no payoff.
