import { nextIndices } from '../hooks/useTimerEngine'

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

function nextActivityPreview(engine, programme) {
  const { phase, blockIndex, roundIndex, activityIndex } = engine
  if (phase === 'intro') {
    return { name: programme.blocks[0].activities[0].name, seconds: programme.blocks[0].active }
  }
  if (phase === 'active') {
    const block = programme.blocks[blockIndex]
    return { name: 'Recover', seconds: block.recover }
  }
  if (phase === 'recover') {
    const next = nextIndices(programme, blockIndex, roundIndex, activityIndex)
    if (!next) return null
    const nextBlock = programme.blocks[next.blockIndex]
    return { name: nextBlock.activities[next.activityIndex].name, seconds: nextBlock.active }
  }
  return null
}

export default function TimerRun({ engine, programme, onCollapse, onStop }) {
  const block = programme.blocks[engine.blockIndex]
  const activity = block?.activities[engine.activityIndex]
  const total = currentPhaseDuration(engine, programme)
  const elapsedPct = total > 0 ? Math.min(100, ((total - engine.timeLeft) / total) * 100) : 0
  const color = phaseColor(engine.phase)
  const next = engine.status !== 'complete' && engine.status !== 'idle' ? nextActivityPreview(engine, programme) : null

  const phaseName = engine.phase === 'active' ? 'ACTIVE'
    : engine.phase === 'recover' ? 'REST'
    : engine.phase === 'intro' ? 'INTRO'
    : 'DONE'

  const displayName = engine.phase === 'intro' ? 'GET READY'
    : engine.phase === 'complete' ? 'WORKOUT COMPLETE'
    : activity?.name ?? ''

  // Circular progress ring geometry.
  const radius = 130
  const circumference = 2 * Math.PI * radius

  return (
    <div style={{ ...s.page, background: engine.status === 'paused' ? 'var(--color-bg-app)' : color, transition: 'background 0.3s' }}>
      <div style={s.header}>
        <button onClick={onCollapse} style={s.iconBtn} aria-label="Collapse">&#8595;</button>
        <span style={s.blockRound}>
          {block && `BLOCK ${engine.blockIndex + 1} · ROUND ${engine.roundIndex + 1}/${block.repeat}`}
        </span>
        <span style={{ width: 40 }} />
      </div>

      <div style={s.center}>
        <div style={s.phaseBadge}>{engine.status === 'paused' ? 'PAUSED' : phaseName}</div>
        <div style={s.ringWrap}>
          <svg width={300} height={300} viewBox="0 0 300 300">
            <circle cx={150} cy={150} r={radius} fill="none" stroke="rgba(0,0,0,0.15)" strokeWidth={12} />
            <circle
              cx={150} cy={150} r={radius} fill="none" stroke="var(--color-bg-app)" strokeWidth={12}
              strokeDasharray={circumference} strokeDashoffset={circumference * (1 - elapsedPct / 100)}
              strokeLinecap="round" transform="rotate(-90 150 150)" style={{ transition: 'stroke-dashoffset 1s linear' }}
            />
          </svg>
          <div style={s.ringCenter}>
            <div style={s.exerciseName}>{displayName}</div>
            <div style={s.timeText}>{formatTime(engine.timeLeft)}</div>
          </div>
        </div>

        {next && (
          <div style={s.nextRow}>
            <span style={s.nextLabel}>NEXT</span>
            <span>{next.name} &middot; {next.seconds}s</span>
          </div>
        )}
      </div>

      <div style={s.controls}>
        <button onClick={engine.togglePause} style={s.controlBtn} disabled={engine.status === 'complete'}>
          {engine.status === 'running' ? 'Pause' : 'Resume'}
        </button>
        <button onClick={engine.skip} style={s.controlBtn} disabled={engine.status !== 'running'}>Skip</button>
        <button onClick={onStop} style={{ ...s.controlBtn, ...s.stopBtn }}>Stop</button>
      </div>
    </div>
  )
}

const s = {
  page: { minHeight: '100svh', display: 'flex', flexDirection: 'column', padding: '16px var(--shell-px-mobile) 32px' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  iconBtn: {
    width: 40, height: 40, borderRadius: 'var(--radius-md)', background: 'rgba(0,0,0,0.15)', color: 'inherit',
    border: 'none', cursor: 'pointer', fontSize: 18,
  },
  blockRound: {
    fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 11, letterSpacing: '0.12em', color: 'inherit', opacity: 0.85,
  },
  center: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 },
  phaseBadge: {
    fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12, letterSpacing: '0.16em',
    padding: '4px 14px', borderRadius: 'var(--radius-chip)', background: 'rgba(0,0,0,0.15)', color: 'inherit',
  },
  ringWrap: { position: 'relative', width: 300, height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  ringCenter: { position: 'absolute', textAlign: 'center', padding: '0 16px' },
  exerciseName: {
    fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--text-lg)', color: 'var(--color-text-primary)',
    marginBottom: 8,
  },
  timeText: {
    fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 56, color: 'var(--color-text-primary)',
    fontVariantNumeric: 'tabular-nums',
  },
  nextRow: {
    display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)',
    color: 'inherit', opacity: 0.85,
  },
  nextLabel: { fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 10, letterSpacing: '0.14em' },
  controls: { display: 'flex', gap: 12 },
  controlBtn: {
    flex: 1, height: 'var(--btn-h-lg)', background: 'rgba(0,0,0,0.18)', color: 'inherit', border: 'none',
    borderRadius: 'var(--btn-radius)', fontFamily: 'var(--btn-font)', fontWeight: 700, fontSize: 'var(--text-sm)',
    letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer',
  },
  stopBtn: { background: 'var(--color-action-danger)', color: 'var(--color-action-danger-text)' },
}
