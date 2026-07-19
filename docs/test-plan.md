# Test Plan

## Automated (`npm run test`, CI-enforced)

Currently covers `useTimerEngine`'s reducer — the highest-risk, most
reusable piece, and the one place a subtle logic error is easy to write
and hard to eyeball correctly (see `docs/architecture.md`'s note on the
block/repeat cycling bug the tests caught):

- Intro enabled vs. disabled start state
- Countdown ticks fire only in the last 3s of intro/recover, never active
- `endActivity` vs `endBlock` vs `endProgramme` cue selection across a full
  block (round cycling, not per-activity repetition)
- Index advancement (block/round/activity) across a full block
- SKIP produces the same transition/cue as a natural countdown-to-zero
- PAUSE/RESUME don't advance time or fire cues; TICK is a no-op while paused
- STOP resets fully to idle

**Not yet automated, worth adding if this codebase grows:** `programmesApi`'s
row↔client shape mapping (pure functions, easy to fixture-test without a
live database), `ProgrammeEditor`'s validation rules.

## Manual — on-device (Android + real Spotify session)

These are inherently unverifiable in CI or a headless browser — OS-level
audio focus, real screen-lock timing, and actual wake-lock hardware
behaviour have no automated equivalent:

- [ ] Log in, create a programme with 2 blocks, save — confirm rows appear
      in Supabase Table Editor (`programmes`, `blocks`, `activities`)
- [ ] Reload the page, log in again — programme list loads correctly
- [ ] Start a programme with Spotify already playing — Spotify **ducks**,
      does not pause, during cue playback
- [ ] Lock the phone screen mid-active-phase — cues keep firing on
      schedule, timer doesn't drift
- [ ] Unlock the phone mid-programme — timer state is correct (not
      frozen/skipped), wake lock re-engages
- [ ] Screen does not dim/lock on its own while a programme is running
      (unlocked, foreground)
- [ ] Pause → screen lock behaviour reverts to normal (no forced wake lock
      while paused)
- [ ] Intro countdown: chime on Start, 3 beeps in the final 3 seconds,
      first activity cue fires exactly at 0
- [ ] Full programme run start-to-finish fires the complete cue sequence
      (see the table in `docs/architecture.md`) and auto-returns to a
      sane state at the end
- [ ] Skip-phase jumps to the next phase and fires the right cue
- [ ] Stop mid-run releases the wake lock and stops the silent audio loop
      (check via `chrome://media-internals` or confirm no persistent media
      notification after stop)
- [ ] Judge the actual cue sequence by ear — the sound palette (opening
      bell, "Gooo", "3, 2, 1", "Yay", "Well done" + "You go girl") is a
      newer, more energetic design than what was originally planned (see
      `docs/architecture.md`); confirm it lands right in practice, not just
      that the right file plays at the right transition

## Known-bug regressions (do not reintroduce)

Carried forward from prior prototype iterations — each was a real bug once:

| # | Symptom | Root cause | Guard against regressing |
|---|---|---|---|
| BUG-01 | Black screen on Play | A required prop was missing from a component's destructured params | Any timer-screen component must actually use every prop it's passed — a missing/mistyped destructure fails silently in JS, not loudly |
| BUG-02 | Back button exits the browser/app | No History API integration | `useNavStack` — verify browser back navigates screens, not out of the app, after any navigation-related change |
| BUG-03 | All library cards opened the same programme | Single shared programme reference instead of a map keyed by ID | `Library`/`ActiveWorkout`/`ProgrammeEditor` always resolve a programme by the `id` passed in, never a shared "current" reference — verify with 2+ programmes, not just 1 |
| BUG-04 | TimerRun's header icons and NEXT/stat cards were invisible (dark-on-dark) under the dark theme | Used theme-aware tokens (`--color-bg-surface`, `--color-border-default`) for surfaces that are supposed to stay a fixed light "paper" card regardless of the active theme | TimerRun's default-mode accent surfaces must use the fixed `--color-timer-paper*` tokens, never theme-aware ones — verify by screenshotting TimerRun under both themes, not just one |
| BUG-05 | TimerRun's square header icon toggled fully-saturated colour mode instead of the split/checklist view; the lightning bolt did nothing | Built against refined-UI p.3-5 only, which don't disambiguate the two icons — p.6 ("TIMER · SPLIT SCREEN") shows the square icon driving a different, still-paper-background view | Icon-to-function mapping in `TimerRun.jsx`'s header must match p.6, not just an inference from p.3-5: lightning = saturated toggle, square = split/checklist toggle |

Bugs of the same *character* (small, silent-failure mistakes) were found
and fixed during this build via real-browser visual testing rather than
lint/build alone — see individual commit messages for `LiveBar` (checked
`activity?.name` before checking `engine.phase`, so INTRO showed the wrong
exercise name), `Settings` (`s.primaryBtn` referenced but never defined,
silently rendering as an unstyled button), and BUG-04/BUG-05 above. Worth
remembering that this class of bug doesn't trip lint, type checking, or
the build — only actually looking at the rendered result (and, for BUG-05,
having the full reference set) catches it.
