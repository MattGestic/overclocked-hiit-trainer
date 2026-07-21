import { useEffect, useState } from 'react'
import { getProgramme } from '../lib/programmesApi'
import { recordSession } from '../lib/sessionLogsApi'
import { useTimerEngine } from '../hooks/useTimerEngine'
import LiveBar from './LiveBar'
import TimerRun from './TimerRun'
import BlockList from './BlockList'
import ProgrammeParameters from './ProgrammeParameters'
import AppTabBar from './AppTabBar'
import { IconChevronDown, IconBack, IconEdit, IconPlay } from './icons'

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default function ActiveWorkout({ programmeId, onBack, onEdit, navigate }) {
  const [programme, setProgramme] = useState(null)
  const [loadError, setLoadError] = useState(null)
  const [expanded, setExpanded] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(true)
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

  const isRunning = engine.status !== 'idle'
  const today = new Date()
  const dateLabel = `${String(today.getDate()).padStart(2, '0')} ${MONTH_LABELS[today.getMonth()]} | ${programme.type}`
  const actionLabel = engine.status === 'paused' ? 'Resume' : engine.status === 'running' ? 'Running' : 'Start'

  return (
    <div style={{ ...s.page, paddingBottom: 'calc(var(--bottom-nav-h) + 24px)' }}>
      <button onClick={onBack} style={s.backBtn} aria-label="Back to Library"><IconBack size={16} /></button>

      {isRunning && <LiveBar engine={engine} programme={programme} onExpand={() => setExpanded(true)} onStop={handleStop} />}

      <div style={s.subHeader}>
        <button onClick={() => setDetailsOpen((v) => !v)} style={s.chevronBtn} aria-label={detailsOpen ? 'Collapse' : 'Expand'}>
          <span style={{ display: 'flex', transform: detailsOpen ? undefined : 'rotate(-90deg)', transition: 'transform 0.15s' }}>
            <IconChevronDown size={16} />
          </span>
        </button>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={s.eyebrow}>{dateLabel}</div>
          <h1 style={s.title}>{programme.name}</h1>
        </div>
        <button onClick={() => onEdit(programme.id)} style={s.secondaryBtn}>
          <IconEdit size={12} /> Edit
        </button>
        <button
          onClick={engine.status === 'paused' ? engine.resume : engine.status === 'idle' ? handleStart : undefined}
          disabled={engine.status === 'running'}
          style={s.primaryBtn}
        >
          <IconPlay size={11} /> {actionLabel}
        </button>
      </div>

      {detailsOpen && <ProgrammeParameters programme={programme} />}

      <BlockList programme={programme} engine={engine} onStart={engine.status === 'idle' ? handleStart : undefined} />

      <AppTabBar
        active={isRunning ? 'running' : null}
        running={isRunning}
        onNavigate={(id) => {
          if (id === 'library') navigate({ screen: 'library' })
          if (id === 'history') navigate({ screen: 'history' })
        }}
      />
    </div>
  )
}

const s = {
  page: { maxWidth: 'var(--shell-max-mobile)', margin: '0 auto', padding: '24px var(--shell-px-mobile) 96px' },
  backBtn: {
    minWidth: 40, minHeight: 40, background: 'var(--card-bg)', color: 'var(--color-text-primary)',
    border: '1px solid var(--card-border)', borderRadius: 'var(--radius-md)', cursor: 'pointer', marginBottom: 16,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  subHeader: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 },
  chevronBtn: {
    minWidth: 36, minHeight: 36, background: 'var(--color-action-secondary)', color: 'var(--color-action-secondary-text)',
    border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'transform 0.15s',
  },
  eyebrow: {
    fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 10, letterSpacing: '0.1em',
    color: 'var(--color-text-muted)', textTransform: 'uppercase',
  },
  title: {
    margin: 0, fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--text-xl)', color: 'var(--color-text-primary)',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
  secondaryBtn: {
    height: 40, padding: '0 14px', background: 'var(--card-bg)', color: 'var(--color-text-primary)',
    fontFamily: 'var(--btn-font)', fontWeight: 700, fontSize: 11, textTransform: 'uppercase',
    border: '1px solid var(--card-border)', borderRadius: 'var(--btn-radius)', cursor: 'pointer', flexShrink: 0,
    display: 'inline-flex', alignItems: 'center', gap: 5,
  },
  primaryBtn: {
    height: 40, padding: '0 16px', background: 'var(--color-action-positive)', color: 'var(--color-action-positive-text)',
    fontFamily: 'var(--btn-font)', fontWeight: 700, fontSize: 11, textTransform: 'uppercase',
    border: 'none', borderRadius: 'var(--btn-radius)', cursor: 'pointer', flexShrink: 0,
    display: 'inline-flex', alignItems: 'center', gap: 5,
  },
}
