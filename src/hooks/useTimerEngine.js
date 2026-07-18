import { useReducer, useRef, useEffect, useCallback } from 'react'
import { useWakeLock } from './useWakeLock'
import { useAudioReliability } from './useAudioReliability'
import * as audioEngine from '../lib/audioEngine'

const CUE_FN = {
  introChime: audioEngine.playIntroChime,
  countdownTick: audioEngine.playCountdownTick,
  startActivity: audioEngine.playStartActivity,
  endActivity: audioEngine.playEndActivity,
  endBlock: audioEngine.playEndBlock,
  endProgramme: audioEngine.playEndProgramme,
}

const initialState = {
  status: 'idle', // idle | running | paused | complete
  programme: null,
  phase: null, // intro | active | recover | complete
  timeLeft: 0,
  blockIndex: 0,
  roundIndex: 0,
  activityIndex: 0,
  pendingCues: [],
}

// Where does (blockIndex, roundIndex, activityIndex) go next? null means
// there is no next activity — the programme is finished.
export function nextIndices(programme, blockIndex, roundIndex, activityIndex) {
  const block = programme.blocks[blockIndex]
  if (activityIndex + 1 < block.activities.length) {
    return { blockIndex, roundIndex, activityIndex: activityIndex + 1 }
  }
  if (roundIndex + 1 < block.repeat) {
    return { blockIndex, roundIndex: roundIndex + 1, activityIndex: 0 }
  }
  if (blockIndex + 1 < programme.blocks.length) {
    return { blockIndex: blockIndex + 1, roundIndex: 0, activityIndex: 0 }
  }
  return null
}

function isLastOfBlock(block, roundIndex, activityIndex) {
  return activityIndex === block.activities.length - 1 && roundIndex === block.repeat - 1
}

// Shared by "TICK ran the current phase's timeLeft down to 0" and SKIP —
// both mean "the current phase is over, move to whatever comes next."
function advancePhase(state) {
  const { programme, phase, blockIndex, roundIndex, activityIndex } = state
  const block = programme.blocks[blockIndex]

  if (phase === 'intro') {
    return { ...state, phase: 'active', timeLeft: block.active, pendingCues: ['startActivity'] }
  }

  if (phase === 'active') {
    const next = nextIndices(programme, blockIndex, roundIndex, activityIndex)
    if (next === null) {
      // Last activity of the whole programme — no trailing recover.
      return { ...state, status: 'complete', phase: 'complete', timeLeft: 0, pendingCues: ['endProgramme'] }
    }
    const cue = isLastOfBlock(block, roundIndex, activityIndex) ? 'endBlock' : 'endActivity'
    return { ...state, phase: 'recover', timeLeft: block.recover, pendingCues: [cue] }
  }

  if (phase === 'recover') {
    // Never null here — recover only ever runs when a next activity exists.
    const next = nextIndices(programme, blockIndex, roundIndex, activityIndex)
    const nextBlock = programme.blocks[next.blockIndex]
    return { ...state, ...next, phase: 'active', timeLeft: nextBlock.active, pendingCues: ['startActivity'] }
  }

  return state
}

export function timerReducer(state = initialState, action) {
  switch (action.type) {
    case 'START': {
      const programme = action.programme
      const firstBlock = programme.blocks[0]
      return programme.introEnabled
        ? {
            ...initialState,
            status: 'running',
            programme,
            phase: 'intro',
            timeLeft: programme.introSeconds,
            pendingCues: ['introChime'],
          }
        : {
            ...initialState,
            status: 'running',
            programme,
            phase: 'active',
            timeLeft: firstBlock.active,
            pendingCues: ['startActivity'],
          }
    }

    case 'TICK': {
      if (state.status !== 'running') return state
      const timeLeft = state.timeLeft - 1
      if (timeLeft > 0) {
        // Countdown ticks: last 3s of intro or recover only — not active
        // phases, which are marked by their own end-of-activity/block cue.
        const countdownEligible = state.phase === 'intro' || state.phase === 'recover'
        const pendingCues = countdownEligible && timeLeft <= 3 ? ['countdownTick'] : []
        return { ...state, timeLeft, pendingCues }
      }
      return advancePhase({ ...state, timeLeft: 0, pendingCues: [] })
    }

    case 'SKIP':
      return state.status === 'running' ? advancePhase({ ...state, pendingCues: [] }) : state

    case 'PAUSE':
      return state.status === 'running' ? { ...state, status: 'paused', pendingCues: [] } : state

    case 'RESUME':
      return state.status === 'paused' ? { ...state, status: 'running', pendingCues: [] } : state

    case 'STOP':
      return { ...initialState }

    case 'CLEAR_CUES':
      return state.pendingCues.length ? { ...state, pendingCues: [] } : state

    default:
      return state
  }
}

export function useTimerEngine(programme) {
  const [state, dispatch] = useReducer(timerReducer, initialState)
  const wakeLock = useWakeLock()
  const audioReliability = useAudioReliability()
  const stateRef = useRef(state)
  useEffect(() => {
    stateRef.current = state
  })

  // 1-second tick while running.
  useEffect(() => {
    if (state.status !== 'running') return
    const id = setInterval(() => dispatch({ type: 'TICK' }), 1000)
    return () => clearInterval(id)
  }, [state.status])

  // Fire whatever cues the last transition produced, then clear them so
  // they don't re-fire on the next unrelated render.
  useEffect(() => {
    if (state.pendingCues.length === 0) return
    for (const cue of state.pendingCues) {
      CUE_FN[cue]?.()
    }
    dispatch({ type: 'CLEAR_CUES' })
  }, [state.pendingCues])

  const pause = useCallback(() => {
    wakeLock.release()
    dispatch({ type: 'PAUSE' })
  }, [wakeLock])

  const resume = useCallback(() => {
    wakeLock.acquire()
    dispatch({ type: 'RESUME' })
  }, [wakeLock])

  // Media Session's play/pause handlers both call this — it toggles,
  // matching the spec's "pauseTimer() // toggles" pattern.
  const togglePause = useCallback(() => {
    if (stateRef.current.status === 'running') pause()
    else resume()
  }, [pause, resume])

  const start = useCallback(async () => {
    // Acquire the wake lock synchronously within the gesture; audio
    // decoding (bootAudioContext) can take a moment on a large asset set,
    // and cues mustn't fire before it resolves — the engine throws if a
    // cue is scheduled before every asset has decoded.
    wakeLock.acquire()
    await audioEngine.bootAudioContext()
    audioReliability.start(programme.name, togglePause)
    dispatch({ type: 'START', programme })
  }, [programme, audioReliability, wakeLock, togglePause])

  const stop = useCallback(() => {
    audioReliability.stop()
    wakeLock.release()
    dispatch({ type: 'STOP' })
  }, [audioReliability, wakeLock])

  const skip = useCallback(() => dispatch({ type: 'SKIP' }), [])

  // Natural completion releases the lock and silences the loop too — not
  // just explicit Stop.
  useEffect(() => {
    if (state.status === 'complete') {
      audioReliability.stop()
      wakeLock.release()
    }
  }, [state.status, audioReliability, wakeLock])

  // The one visibilitychange effect for the whole engine (per spec) — do
  // not duplicate this inside useWakeLock or any screen component.
  useEffect(() => {
    function onVisibilityChange() {
      if (document.visibilityState === 'visible' && stateRef.current.status === 'running') {
        wakeLock.acquire()
        audioEngine.resumeAudioContext()
      }
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => document.removeEventListener('visibilitychange', onVisibilityChange)
  }, [wakeLock])

  return { ...state, start, pause, resume, togglePause, stop, skip }
}
