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

## Audio engine

`src/lib/audioEngine.js` is a delivered module (built separately against a
locked function contract, then dropped in — see the file's own header
comment), backed by real audio files in `src/lib/audio/`. It fetches every
asset eagerly at module load (a deliberate perf choice: downloads start
before the user ever presses Start) and decodes them inside
`bootAudioContext()`, which is `async` — `useTimerEngine.js`'s `start()`
**must** `await` it before dispatching `START`, since scheduling a cue
before every asset has decoded throws. Get this ordering wrong and the
first Start press after a cold load silently fails.

**The actual sound palette changed significantly from earlier planning.**
The originally-discussed bell/gong/whistle/ship-bell design (and the
synthesized-whistle plan) was superseded during hands-on iteration on a
separate platform — the gong and ship-bell files aren't part of the
delivered package at all, replaced by a more energetic voice/hype palette:

| Cue (function called) | Sound |
|---|---|
| `playIntroChime` — start pressed, intro begins | Opening bell |
| `playCountdownTick` — last 3s of intro/recover, ×3 | Servant-bell |
| `playStartActivity` — every activity starts | "Gooo" |
| `playEndActivity` — active phase ends, recover starts | Female voice, "3, 2, 1" |
| `playEndBlock` — end of a block | "Yay" |
| `playEndProgramme` — end of the programme | "Well done" (capped/faded at 22s) + "You go girl" (queued) |

Only these six functions are wired into `useTimerEngine.js` today — the
same six from the original locked contract, matching what's actually
called via `CUE_FN` in that file. The module also exports a considerably
richer API that isn't used yet: `playStartBlock`/`playStartRest`/
`playEndRest` (distinct cues for block-start vs. activity-start, and
rest-start vs. rest-end — concepts the phase engine doesn't currently
model separately), `playTimerEvent`/`scheduleCueSequence` (schedule a
whole run's cues against one AudioContext timestamp up front, with
automatic capping so cues can't overlap into the next one), and
`pauseTimerAudio`/`resumeTimerAudio`/`terminateTimerAudio` (suspend/resume
the AudioContext clock itself, freezing an in-flight cue's exact playback
position — more precise than this app's current pause, which just stops
the tick interval). Using any of that means giving `timerReducer` new
phase-transition concepts it doesn't have yet, not just an audioEngine
change — left available rather than stripped out, but not a v1 requirement.

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
