import { describe, it, expect } from 'vitest'
import { timerReducer } from './useTimerEngine'

// Block 0: repeat 2, activities [A, B] — exercises the normal endActivity
// path (A, round 0) and the endBlock path (B, round 1, last of block 0).
// Block 1: repeat 1, activities [C] — its single activity is the last of
// the whole programme, so it must skip recover and fire endProgramme.
const programme = {
  name: 'Test Programme',
  introEnabled: true,
  introSeconds: 5,
  blocks: [
    { active: 10, recover: 5, repeat: 2, activities: [{ name: 'A' }, { name: 'B' }] },
    { active: 8, recover: 4, repeat: 1, activities: [{ name: 'C' }] },
  ],
}

const noIntroProgramme = { ...programme, introEnabled: false }

function tick(state, n = 1) {
  for (let i = 0; i < n; i++) state = timerReducer(state, { type: 'TICK' })
  return state
}

describe('timerReducer', () => {
  it('starts into intro with the intro chime cue when intro is enabled', () => {
    const state = timerReducer(undefined, { type: 'START', programme })
    expect(state.status).toBe('running')
    expect(state.phase).toBe('intro')
    expect(state.timeLeft).toBe(5)
    expect(state.pendingCues).toEqual(['introChime'])
  })

  it('starts straight into the first activity when intro is disabled', () => {
    const state = timerReducer(undefined, { type: 'START', programme: noIntroProgramme })
    expect(state.phase).toBe('active')
    expect(state.timeLeft).toBe(10)
    expect(state.pendingCues).toEqual(['startActivity'])
  })

  it('fires countdown ticks only in the last 3 seconds of intro', () => {
    let state = timerReducer(undefined, { type: 'START', programme }) // timeLeft 5
    state = tick(state) // 4
    expect(state.pendingCues).toEqual([])
    state = tick(state) // 3
    expect(state.pendingCues).toEqual(['countdownTick'])
    state = tick(state) // 2
    expect(state.pendingCues).toEqual(['countdownTick'])
    state = tick(state) // 1
    expect(state.pendingCues).toEqual(['countdownTick'])
  })

  it('transitions intro -> first activity with the start-activity cue, no countdown on active phases', () => {
    let state = timerReducer(undefined, { type: 'START', programme })
    state = tick(state, 5) // intro runs out
    expect(state.phase).toBe('active')
    expect(state.blockIndex).toBe(0)
    expect(state.activityIndex).toBe(0)
    expect(state.timeLeft).toBe(10)
    expect(state.pendingCues).toEqual(['startActivity'])

    // No countdown cues during the active phase at all, including its
    // final 3 seconds — only intro/recover get countdown ticks.
    state = tick(state, 6) // timeLeft now 4
    expect(state.pendingCues).toEqual([])
    state = tick(state) // timeLeft 3 -> still no countdown, this is an active phase
    expect(state.pendingCues).toEqual([])
  })

  it('fires endActivity (not endBlock) for a non-final activity in a block', () => {
    let state = timerReducer(undefined, { type: 'START', programme })
    state = tick(state, 5 + 10) // through intro and activity A's active phase
    expect(state.phase).toBe('recover')
    expect(state.pendingCues).toEqual(['endActivity'])
  })

  it('fires endBlock for the last activity of a block (not the last of the programme)', () => {
    let state = timerReducer(undefined, { type: 'START', programme })
    // Block 0 runs A,B (round 0), then A,B again (round 1) before it's done —
    // repeat count cycles the whole activity list, it doesn't repeat each
    // activity individually. endBlock only fires on B's *second* occurrence.
    // intro(5) + [A active(10) + A recover(5) + B active(10) + B recover(5)] x2 - B's final recover
    state = tick(state, 5 + (10 + 5 + 10 + 5) * 2 - 5)
    expect(state.phase).toBe('recover')
    expect(state.roundIndex).toBe(1)
    expect(state.activityIndex).toBe(1)
    expect(state.pendingCues).toEqual(['endBlock'])
  })

  it('advances block/round/activity indices correctly across a full block', () => {
    // Block 0 (repeat 2, activities [A, B]) cycles the whole list per round:
    // A0 B0 A1 B1 — endBlock only fires once, on B's round-1 occurrence.
    let state = timerReducer(undefined, { type: 'START', programme })
    const path = []
    for (let i = 0; i < 60 && state.status === 'running'; i++) {
      state = tick(state)
      if (state.pendingCues.length) path.push({ phase: state.phase, cue: state.pendingCues[0], b: state.blockIndex, r: state.roundIndex, a: state.activityIndex })
    }
    const cues = path.map((p) => p.cue)
    expect(cues).toEqual([
      'countdownTick', 'countdownTick', 'countdownTick', // last 3s of intro
      'startActivity',    // -> A (round 0)
      'endActivity',       // A active ends (round 0)
      'countdownTick', 'countdownTick', 'countdownTick', // last 3s of A's recover
      'startActivity',    // -> B (round 0)
      'endActivity',       // B active ends (round 0 — not last of block yet)
      'countdownTick', 'countdownTick', 'countdownTick',
      'startActivity',    // -> A (round 1)
      'endActivity',       // A active ends (round 1)
      'countdownTick', 'countdownTick', 'countdownTick',
      'startActivity',    // -> B (round 1, last activity of block 0)
      'endBlock',           // B active ends (round 1 — last of block 0)
    ])
    // Confirm the final entry really is B at round 1, not a mislabeled A.
    expect(path.at(-1)).toMatchObject({ b: 0, r: 1, a: 1 })
  })

  it('skips the trailing recover and fires endProgramme on the very last activity', () => {
    let state = timerReducer(undefined, { type: 'START', programme })
    // Walk the whole programme: intro(5) + [A(10)+rec(5) + B(10)+rec(5)] x2 + C(8)
    state = tick(state, 5 + (10 + 5 + 10 + 5) * 2 + 8)
    expect(state.status).toBe('complete')
    expect(state.phase).toBe('complete')
    expect(state.pendingCues).toEqual(['endProgramme'])
  })

  it('SKIP jumps straight to the next phase, firing the same cue TICK would have', () => {
    let state = timerReducer(undefined, { type: 'START', programme }) // intro, timeLeft 5
    state = timerReducer(state, { type: 'SKIP' })
    expect(state.phase).toBe('active')
    expect(state.pendingCues).toEqual(['startActivity'])

    state = timerReducer(state, { type: 'SKIP' }) // A active -> recover
    expect(state.phase).toBe('recover')
    expect(state.pendingCues).toEqual(['endActivity'])
  })

  it('PAUSE/RESUME do not advance time or fire cues, and TICK is a no-op while paused', () => {
    let state = timerReducer(undefined, { type: 'START', programme })
    state = timerReducer(state, { type: 'PAUSE' })
    expect(state.status).toBe('paused')
    expect(state.pendingCues).toEqual([])

    const before = state.timeLeft
    state = timerReducer(state, { type: 'TICK' })
    expect(state.timeLeft).toBe(before) // ignored while paused

    state = timerReducer(state, { type: 'RESUME' })
    expect(state.status).toBe('running')
    expect(state.pendingCues).toEqual([])
  })

  it('STOP resets fully back to idle', () => {
    let state = timerReducer(undefined, { type: 'START', programme })
    state = tick(state, 3)
    state = timerReducer(state, { type: 'STOP' })
    expect(state.status).toBe('idle')
    expect(state.phase).toBe(null)
    expect(state.programme).toBe(null)
    expect(state.blockIndex).toBe(0)
  })
})
