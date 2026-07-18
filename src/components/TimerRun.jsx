import { useState } from 'react'
import { nextIndices } from '../hooks/useTimerEngine'
import { useLayout } from '../hooks/useLayout'
import { setVolume, getVolume } from '../lib/audioEngine'
import BlockList from './BlockList'
import { IconChevronDown, IconBolt, IconSquare, IconSpeaker, IconPause, IconPlay, IconSkip } from './icons'

function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

function phaseColor(phase) {
  switch (phase) {
    case 'active': return 'var(--color-timer-work)'
    case 'recover': return 'var(--color-timer-rest)'
    case 'intro': return 'var(--color-timer-intro)'
    case 'complete': return 'var(--color-timer-complete)'
    default: return 'var(--color-text-muted)'
  }
}

function currentPhaseDuration(engine, programme) {
  if (engine.phase === 'intro') return programme.introSeconds
  const block = programme.blocks[engine.blockIndex]
  if (!block) return 0
  if (engine.phase === 'active') return block.active
  if (engine.phase === 'recover') return block.recover
  return 0
}

// Next-up preview, including the phase *type* it belongs to — the NEXT
// card is color-coded to whatever's coming next (green = exercise, blue =
// recover), per user-testing markup, not to the current phase. Also carries
// the upcoming activity's reps/weight: during RECOVER, the stat boxes show
// what's coming next (matches the refined-UI reference), not the activity
// that just finished.
function nextActivityPreview(engine, programme) {
  const { phase, blockIndex, roundIndex, activityIndex } = engine
  if (phase === 'intro') {
    const a = programme.blocks[0].activities[0]
    return { name: a.name, seconds: programme.blocks[0].active, type: 'active', reps: a.reps, weight: a.weight }
  }
  if (phase === 'active') {
    const block = programme.blocks[blockIndex]
    return { name: 'Recover', seconds: block.recover, type: 'recover' }
  }
  if (phase === 'recover') {
    const next = nextIndices(programme, blockIndex, roundIndex, activityIndex)
    if (!next) return { name: 'Finish', seconds: 0, type: 'complete' }
    const nextBlock = programme.blocks[next.blockIndex]
    const a = nextBlock.activities[next.activityIndex]
    return { name: a.name, seconds: nextBlock.active, type: 'active', reps: a.reps, weight: a.weight }
  }
  return null
}

export default function TimerRun({ engine, programme, onCollapse, onStop }) {
  const layout = useLayout()
  const [saturated, setSaturated] = useState(false)
  const [muted, setMuted] = useState(() => getVolume() === 0)
  const block = programme.blocks[engine.blockIndex]
  const activity = block?.activities[engine.activityIndex]
  const total = currentPhaseDuration(engine, programme)
  const elapsedPct = total > 0 ? Math.min(100, ((total - engine.timeLeft) / total) * 100) : 0
  const color = phaseColor(engine.phase)
  const next = engine.status !== 'complete' && engine.status !== 'idle' ? nextActivityPreview(engine, programme) : null
  const nextColor = next ? phaseColor(next.type) : color
  const split = layout.landscape && (layout.tablet || layout.wide)
  // RECOVER shows the upcoming exercise's target/weight, not the one just
  // finished — ACTIVE shows the exercise currently in progress.
  const statsSource = engine.phase === 'recover' ? next : activity
  const showStats = (engine.phase === 'active' || engine.phase === 'recover') && statsSource && (statsSource.reps || statsSource.weight)

  const phaseName = engine.phase === 'active' ? 'ACTIVE'
    : engine.phase === 'recover' ? 'RECOVER'
    : engine.phase === 'intro' ? 'INTRO'
    : 'DONE'

  const displayName = engine.phase === 'intro' ? 'GET READY'
    : engine.phase === 'complete' ? 'WORKOUT COMPLETE'
    : activity?.name ?? ''

  function toggleMute() {
    const willMute = !muted
    setVolume(willMute ? 0 : 0.8)
    setMuted(willMute)
  }

  // Circular progress ring geometry.
  const radius = 130
  const circumference = 2 * Math.PI * radius

  const pageBg = engine.status === 'paused'
    ? (saturated ? 'var(--color-bg-app)' : 'var(--color-timer-paper)')
    : (saturated ? color : 'var(--color-timer-paper)')
  const fg = saturated ? '#ffffff' : 'var(--color-timer-paper-text)'

  return (
    <div style={{ ...s.page, background: pageBg, color: fg, transition: 'background 0.3s, color 0.3s' }}>
      <div style={s.header}>
        <button onClick={onCollapse} style={s.iconBtn(saturated)} aria-label="Collapse">
          <IconChevronDown size={18} />
        </button>
        <span style={s.blockRound}>
          {block && `BLOCK ${engine.blockIndex + 1} · ROUND ${engine.roundIndex + 1}/${block.repeat}`}
        </span>
        <div style={{ display: 'flex', gap: 8 }}>
          <span style={s.iconBtn(saturated)} aria-hidden="true"><IconBolt size={16} /></span>
          <button onClick={() => setSaturated((v) => !v)} style={s.iconBtn(saturated, saturated)} aria-label="Toggle full-colour mode" aria-pressed={saturated}>
            <IconSquare size={16} />
          </button>
          <button onClick={toggleMute} style={s.iconBtn(saturated)} aria-label={muted ? 'Unmute' : 'Mute'} aria-pressed={muted}>
            <IconSpeaker size={16} muted={muted} />
          </button>
        </div>
      </div>

      <div style={split ? s.splitBody : undefined}>
        <div style={s.center}>
          <div style={{ ...s.phaseBadge, background: saturated ? 'rgba(255,255,255,0.18)' : 'var(--color-timer-paper-surface)', border: saturated ? 'none' : `1px solid ${color}` }}>
            <span style={{ ...s.phaseDot, background: saturated ? '#fff' : color }} />
            {engine.status === 'paused' ? 'PAUSED' : phaseName}
          </div>
          <div style={s.ringWrap}>
            <svg width={280} height={280} viewBox="0 0 300 300">
              <circle cx={150} cy={150} r={radius} fill="none" stroke={saturated ? 'rgba(255,255,255,0.25)' : 'var(--color-timer-paper-track)'} strokeWidth={12} />
              <circle
                cx={150} cy={150} r={radius} fill="none" stroke={saturated ? '#ffffff' : color} strokeWidth={12}
                strokeDasharray={circumference} strokeDashoffset={circumference * (1 - elapsedPct / 100)}
                strokeLinecap="round" transform="rotate(-90 150 150)" style={{ transition: 'stroke-dashoffset 1s linear' }}
              />
            </svg>
            <div style={s.ringCenter}>
              <div style={{ ...s.exerciseName, color: fg }}>{displayName}</div>
              <div style={{ ...s.timeText, color: fg }}>{formatTime(engine.timeLeft)}</div>
            </div>
          </div>

          {showStats && (
            <div style={s.statRow}>
              {statsSource.reps && (
                <div style={{ ...s.statBox, background: saturated ? 'rgba(255,255,255,0.14)' : 'var(--color-timer-paper-surface)' }}>
                  <div style={s.statLabel}>Target</div>
                  <div style={{ ...s.statValue, color: fg }}>{statsSource.reps}</div>
                </div>
              )}
              {statsSource.weight && (
                <div style={{ ...s.statBox, background: saturated ? 'rgba(255,255,255,0.14)' : 'var(--color-timer-paper-surface)' }}>
                  <div style={s.statLabel}>Weight</div>
                  <div style={{ ...s.statValue, color: fg }}>{statsSource.weight}</div>
                </div>
              )}
            </div>
          )}

          {next && (
            <div style={{
              ...s.nextRow,
              borderColor: saturated ? 'rgba(255,255,255,0.4)' : nextColor,
              background: saturated ? 'rgba(255,255,255,0.1)' : 'var(--color-timer-paper-surface)',
            }}>
              <span style={{ ...s.nextLabel, color: saturated ? '#fff' : nextColor }}>NEXT</span>
              <span style={{ color: fg }}>{next.name}{next.seconds ? ` · ${next.seconds}s` : ''}</span>
            </div>
          )}
        </div>

        {split && (
          <div style={s.splitPanel}>
            <BlockList programme={programme} engine={engine} />
          </div>
        )}
      </div>

      <div style={s.controls}>
        <button onClick={engine.togglePause} style={s.controlBtn(saturated)} disabled={engine.status === 'complete'}>
          {engine.status === 'running' ? <IconPause size={16} /> : <IconPlay size={16} />}
          {engine.status === 'running' ? 'Pause' : 'Resume'}
        </button>
        <button onClick={engine.skip} style={s.controlBtn(saturated)} disabled={engine.status !== 'running'}>
          <IconSkip size={16} /> Skip
        </button>
        <button onClick={onStop} style={{ ...s.controlBtn(saturated), ...s.stopBtn(saturated) }}>Stop</button>
      </div>
    </div>
  )
}

const s = {
  page: { minHeight: '100svh', display: 'flex', flexDirection: 'column', padding: '16px var(--shell-px-mobile) 32px' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  iconBtn: (saturated, pressed) => ({
    width: 36, height: 36, borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: pressed ? (saturated ? 'rgba(255,255,255,0.35)' : 'var(--color-bg-inverse)') : (saturated ? 'rgba(255,255,255,0.15)' : 'var(--color-timer-paper-surface)'),
    color: pressed && !saturated ? 'var(--color-text-inverse)' : 'inherit',
    border: 'none', cursor: 'pointer',
  }),
  blockRound: { fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 11, letterSpacing: '0.12em', opacity: 0.85 },
  splitBody: { flex: 1, display: 'flex', flexDirection: 'row', gap: 24, alignItems: 'stretch', minHeight: 0 },
  splitPanel: { flex: 1, overflowY: 'auto', paddingTop: 24, maxWidth: 480 },
  center: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18, padding: '24px 0' },
  phaseBadge: {
    display: 'flex', alignItems: 'center', gap: 6,
    fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12, letterSpacing: '0.16em',
    padding: '5px 14px', borderRadius: 'var(--radius-chip)',
  },
  phaseDot: { width: 6, height: 6, borderRadius: '50%' },
  ringWrap: { position: 'relative', width: 280, height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  ringCenter: { position: 'absolute', textAlign: 'center', padding: '0 16px' },
  exerciseName: {
    fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--text-xl)', textTransform: 'uppercase',
    marginBottom: 8, letterSpacing: '0.02em',
  },
  timeText: {
    fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 56,
    fontVariantNumeric: 'tabular-nums',
  },
  statRow: { display: 'flex', gap: 10, width: '100%', maxWidth: 320 },
  statBox: { flex: 1, borderRadius: 'var(--radius-lg)', padding: '10px 4px', textAlign: 'center' },
  statLabel: { fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 9, letterSpacing: '0.12em', opacity: 0.65 },
  statValue: { fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--text-lg)', marginTop: 2 },
  nextRow: {
    display: 'flex', alignItems: 'center', gap: 10, width: '100%', maxWidth: 320,
    borderRadius: 'var(--radius-lg)', border: '1px solid', padding: '10px 14px',
    fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)',
  },
  nextLabel: { fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 9, letterSpacing: '0.14em', flexShrink: 0 },
  controls: { display: 'flex', gap: 12 },
  controlBtn: (saturated) => ({
    flex: 1, height: 'var(--btn-h-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    background: saturated ? 'rgba(255,255,255,0.16)' : 'var(--color-timer-paper-surface)',
    color: saturated ? '#fff' : 'var(--color-timer-paper-text)',
    border: saturated ? '1px solid rgba(255,255,255,0.4)' : '1px solid var(--color-timer-paper-border)',
    borderRadius: 'var(--btn-radius)', fontFamily: 'var(--btn-font)', fontWeight: 700, fontSize: 'var(--text-sm)',
    letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer',
  }),
  stopBtn: (saturated) => ({
    background: saturated ? 'rgba(255,255,255,0.16)' : 'transparent',
    color: saturated ? '#fff' : 'var(--color-action-danger)',
    border: `1px solid ${saturated ? 'rgba(255,255,255,0.5)' : 'var(--color-action-danger)'}`,
  }),
}
