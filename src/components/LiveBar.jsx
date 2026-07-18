import { IconPause, IconPlay, IconSkip, IconExpand, IconClose } from './icons'

function currentPhaseDuration(engine, programme) {
  if (!programme || !engine.phase) return 0
  if (engine.phase === 'intro') return programme.introSeconds
  const block = programme.blocks[engine.blockIndex]
  if (!block) return 0
  if (engine.phase === 'active') return block.active
  if (engine.phase === 'recover') return block.recover
  return 0
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

function phaseColor(engine) {
  if (engine.status === 'paused') return 'var(--color-text-muted)'
  switch (engine.phase) {
    case 'active': return 'var(--color-timer-work)'
    case 'recover': return 'var(--color-timer-rest)'
    case 'intro': return 'var(--color-timer-intro)'
    case 'complete': return 'var(--color-timer-complete)'
    default: return 'var(--color-text-muted)'
  }
}

export default function LiveBar({ engine, programme, onExpand, onStop }) {
  const block = programme?.blocks[engine.blockIndex]
  const activity = block?.activities[engine.activityIndex]
  const total = currentPhaseDuration(engine, programme)
  const elapsedPct = total > 0 ? Math.min(100, Math.round(((total - engine.timeLeft) / total) * 100)) : 0
  const color = phaseColor(engine)
  const phaseLabel = engine.status === 'paused' ? 'PAUSED' : (engine.phase || '').toUpperCase()

  // Check phase first, not activity?.name — blockIndex/activityIndex point
  // at the first real activity by default, so during INTRO the activity
  // lookup already resolves truthy and would wrongly show it as current.
  const exerciseName = engine.phase === 'intro' ? 'GET READY'
    : engine.phase === 'complete' ? 'DONE'
    : activity?.name ?? ''

  return (
    <div style={s.wrap}>
      <div style={s.row}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={s.exerciseName}>{exerciseName}</div>
          {block && (
            <div style={s.counters}>
              R{engine.roundIndex + 1}/{block.repeat} &middot; EX {engine.activityIndex + 1}/{block.activities.length}
            </div>
          )}
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ ...s.phaseLabel, color }}>{phaseLabel}</div>
          <div style={{ ...s.time, color }}>{formatTime(engine.timeLeft)}</div>
        </div>
        <div style={s.iconRow}>
          <button onClick={engine.togglePause} aria-label={engine.status === 'running' ? 'Pause' : 'Resume'} style={s.iconBtn} disabled={engine.status === 'complete'}>
            {engine.status === 'running' ? <IconPause size={16} /> : <IconPlay size={16} />}
          </button>
          <button onClick={engine.skip} aria-label="Skip" style={s.iconBtn} disabled={engine.status !== 'running'}>
            <IconSkip size={16} />
          </button>
          <button onClick={onExpand} aria-label="Expand" style={s.iconBtn}>
            <IconExpand size={16} />
          </button>
          <button onClick={onStop} aria-label="Stop" style={{ ...s.iconBtn, ...s.stopBtn }}>
            <IconClose size={16} />
          </button>
        </div>
      </div>

      <div style={s.progressTrack}>
        <div style={{ ...s.progressFill, width: `${elapsedPct}%`, background: color }} />
      </div>
    </div>
  )
}

const s = {
  wrap: {
    position: 'sticky', top: 0, zIndex: 'var(--z-sticky)',
    background: 'var(--color-bg-card-elevated)', color: 'var(--color-text-primary)',
    borderRadius: 'var(--radius-xl)', padding: 'var(--space-4)', margin: '0 0 var(--space-4)',
    overflow: 'hidden', boxShadow: 'var(--shadow-card)',
  },
  row: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  exerciseName: {
    fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--text-md)',
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
  },
  counters: { fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', opacity: 0.7, marginTop: 2 },
  phaseLabel: { fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 10, letterSpacing: '0.14em' },
  time: { fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 'var(--text-xl)', fontVariantNumeric: 'tabular-nums' },
  iconRow: { display: 'flex', gap: 6, flexShrink: 0 },
  iconBtn: {
    width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(255,255,255,0.08)', color: 'inherit', border: 'none',
    borderRadius: 'var(--radius-md)', cursor: 'pointer',
  },
  stopBtn: { background: 'var(--color-action-danger)', color: 'var(--color-action-danger-text)' },
  progressTrack: { height: 3, background: 'rgba(255,255,255,0.12)', marginTop: 12, borderRadius: 2 },
  progressFill: { height: '100%', borderRadius: 2, transition: 'width 1s linear' },
}
