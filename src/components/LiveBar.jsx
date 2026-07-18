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
        <div style={{ minWidth: 0 }}>
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
      </div>

      <div style={s.controls}>
        <button onClick={engine.togglePause} style={s.btn} disabled={engine.status === 'complete'}>
          {engine.status === 'running' ? 'Pause' : 'Resume'}
        </button>
        <button onClick={engine.skip} style={s.btn} disabled={engine.status !== 'running'}>Skip</button>
        <button onClick={onExpand} style={s.btn}>Expand</button>
        <button onClick={onStop} style={{ ...s.btn, color: 'var(--color-action-danger)' }}>Stop</button>
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
  row: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  exerciseName: {
    fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--text-lg)',
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
  },
  counters: { fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', opacity: 0.7, marginTop: 2 },
  phaseLabel: { fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 10, letterSpacing: '0.14em' },
  time: { fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 'var(--text-xl)', fontVariantNumeric: 'tabular-nums' },
  controls: { display: 'flex', gap: 8, marginTop: 12 },
  btn: {
    flex: 1, minHeight: 36, background: 'rgba(255,255,255,0.08)', color: 'inherit', border: 'none',
    borderRadius: 'var(--radius-md)', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 11,
    letterSpacing: '0.06em', cursor: 'pointer',
  },
  progressTrack: { height: 3, background: 'rgba(255,255,255,0.12)', marginTop: 12, borderRadius: 2 },
  progressFill: { height: '100%', borderRadius: 2, transition: 'width 1s linear' },
}
