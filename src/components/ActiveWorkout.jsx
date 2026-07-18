import { useEffect, useState } from 'react'
import { getProgramme } from '../lib/programmesApi'
import { recordSession } from '../lib/sessionLogsApi'
import { useTimerEngine } from '../hooks/useTimerEngine'
import LiveBar from './LiveBar'
import TimerRun from './TimerRun'

export default function ActiveWorkout({ programmeId, onBack, onEdit }) {
  const [programme, setProgramme] = useState(null)
  const [loadError, setLoadError] = useState(null)
  const [expanded, setExpanded] = useState(false)
  const [sessionStartedAt, setSessionStartedAt] = useState(null)

  const engine = useTimerEngine(programme)

  useEffect(() => {
    getProgramme(programmeId).then(setProgramme).catch((err) => setLoadError(err.message))
  }, [programmeId])

  // Best-effort session logging — a failed write here shouldn't block the
  // user from seeing their workout finish or from stopping it.
  useEffect(() => {
    if (engine.status === 'complete' && programme && sessionStartedAt) {
      recordSession(programme, sessionStartedAt, 'completed').catch(() => {})
    }
  }, [engine.status, programme, sessionStartedAt])

  function handleStart() {
    setSessionStartedAt(new Date().toISOString())
    engine.start()
  }

  function handleStop() {
    if (!window.confirm('Stop this workout? Progress will be discarded.')) return
    if (programme && sessionStartedAt) {
      recordSession(programme, sessionStartedAt, 'stopped').catch(() => {})
    }
    setExpanded(false)
    engine.stop()
  }

  if (loadError) {
    return (
      <div style={s.page}>
        <p style={{ color: 'var(--color-error-text)' }}>Couldn&rsquo;t load programme: {loadError}</p>
        <button onClick={onBack} style={s.secondaryBtn}>Back</button>
      </div>
    )
  }

  if (!programme) {
    return <div style={s.page}><p style={{ color: 'var(--color-text-muted)' }}>Loading&hellip;</p></div>
  }

  if (expanded && engine.status !== 'idle') {
    return (
      <TimerRun
        engine={engine}
        programme={programme}
        onCollapse={() => setExpanded(false)}
        onStop={handleStop}
      />
    )
  }

  const actionLabel = engine.status === 'paused' ? 'Resume' : engine.status === 'running' ? 'Running' : 'Start'

  return (
    <div style={s.page}>
      <div style={s.header}>
        <button onClick={onBack} style={s.backBtn} aria-label="Back to Library">&larr;</button>
        <div style={{ flex: 1 }}>
          <div style={s.eyebrow}>{programme.type}</div>
          <h1 style={s.title}>{programme.name}</h1>
        </div>
        <button onClick={() => onEdit(programme.id)} style={s.secondaryBtn}>Edit</button>
        <button
          onClick={engine.status === 'paused' ? engine.resume : engine.status === 'idle' ? handleStart : undefined}
          disabled={engine.status === 'running'}
          style={s.primaryBtn}
        >
          {actionLabel}
        </button>
      </div>

      {engine.status !== 'idle' && (
        <LiveBar engine={engine} programme={programme} onExpand={() => setExpanded(true)} onStop={handleStop} />
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {programme.blocks.map((block, blockIdx) => {
          const isCurrentBlock = engine.status !== 'idle' && engine.blockIndex === blockIdx
          return (
            <div key={block.id} style={s.block}>
              <div style={s.blockHeader}>
                <span>
                  {block.name || `Block ${blockIdx + 1}`}
                  <span style={s.blockMeta}> &middot; {block.repeat} round{block.repeat === 1 ? '' : 's'}</span>
                </span>
                {isCurrentBlock && <span style={s.runningBadge}>{engine.status === 'paused' ? 'PAUSED' : 'RUNNING'}</span>}
              </div>
              <table style={s.table}>
                <thead>
                  <tr>
                    <th style={s.th}>Exercise</th>
                    <th style={s.th}>Reps</th>
                    <th style={s.th}>Weight</th>
                  </tr>
                </thead>
                <tbody>
                  {block.activities.map((activity, activityIdx) => {
                    const isCurrent = isCurrentBlock && engine.activityIndex === activityIdx
                    return (
                      <tr key={activity.id} style={isCurrent ? s.trCurrent : undefined}>
                        <td style={s.td}>{isCurrent && <span style={s.dot} />}{activity.name}</td>
                        <td style={s.td}>{activity.reps}</td>
                        <td style={s.td}>{activity.weight}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const s = {
  page: { maxWidth: 'var(--shell-max-mobile)', margin: '0 auto', padding: '24px var(--shell-px-mobile) 96px' },
  header: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 },
  backBtn: {
    minWidth: 40, minHeight: 40, background: 'var(--color-action-secondary)', color: 'var(--color-action-secondary-text)',
    border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: 18,
  },
  eyebrow: {
    fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 10, letterSpacing: '0.14em',
    color: 'var(--color-action-primary)',
  },
  title: { margin: 0, fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--text-xl)', color: 'var(--color-text-primary)' },
  secondaryBtn: {
    height: 40, padding: '0 14px', background: 'var(--color-action-secondary)', color: 'var(--color-action-secondary-text)',
    fontFamily: 'var(--btn-font)', fontWeight: 700, fontSize: 11, textTransform: 'uppercase',
    border: 'none', borderRadius: 'var(--btn-radius)', cursor: 'pointer',
  },
  primaryBtn: {
    height: 40, padding: '0 16px', background: 'var(--color-action-primary)', color: 'var(--color-action-primary-text)',
    fontFamily: 'var(--btn-font)', fontWeight: 700, fontSize: 11, textTransform: 'uppercase',
    border: 'none', borderRadius: 'var(--btn-radius)', cursor: 'pointer',
  },
  block: { background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 'var(--card-radius)', padding: 'var(--card-padding-md)' },
  blockHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10,
    fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)',
  },
  blockMeta: { fontWeight: 400, color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)' },
  runningBadge: {
    fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 9, letterSpacing: '0.1em',
    color: 'var(--color-timer-work)', border: '1px solid var(--color-timer-work)', borderRadius: 'var(--radius-chip)',
    padding: '2px 8px',
  },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' },
  th: { textAlign: 'left', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 10, letterSpacing: '0.08em', color: 'var(--color-text-muted)', padding: '4px 0' },
  td: { padding: '6px 0', color: 'var(--color-text-primary)', borderTop: '1px solid var(--card-border)' },
  trCurrent: { background: 'var(--color-success-bg)' },
  dot: { display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: 'var(--color-timer-work)', marginRight: 8 },
}
