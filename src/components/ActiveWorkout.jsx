import { useEffect, useRef, useState } from 'react'
import { getProgramme } from '../lib/programmesApi'
import { recordSession } from '../lib/sessionLogsApi'
import { useTimerEngine } from '../hooks/useTimerEngine'
import { useFullscreen } from '../hooks/useFullscreen'
import { useOffline } from '../hooks/useOffline'
import LiveBar from './LiveBar'
import TimerRun from './TimerRun'
import BlockList from './BlockList'
import ProgrammeParameters from './ProgrammeParameters'
import AppTabBar from './AppTabBar'
import { IconChevronDown, IconBack, IconEdit, IconPlay } from './icons'

const SESSION_KEY = 'oc_session'
const SESSION_TTL_MS = 30 * 60 * 1000 // 30 min

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function loadSavedSession(programmeId) {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const s = JSON.parse(raw)
    if (s.programmeId !== programmeId) return null
    if (Date.now() - s.savedAt > SESSION_TTL_MS) {
      localStorage.removeItem(SESSION_KEY)
      return null
    }
    return s
  } catch {
    return null
  }
}

function clearSavedSession() {
  localStorage.removeItem(SESSION_KEY)
}

export default function ActiveWorkout({ programmeId, onBack, onEdit, navigate }) {
  const [programme, setProgramme] = useState(null)
  const [loadError, setLoadError] = useState(null)
  const [expanded, setExpanded] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(true)
  const [sessionStartedAt, setSessionStartedAt] = useState(null)
  const [pendingResume, setPendingResume] = useState(() => loadSavedSession(programmeId))

  const engine = useTimerEngine(programme)
  const fullscreen = useFullscreen()
  const offline = useOffline()

  // Save session state to localStorage on every phase transition or pause/resume.
  // Saving on every tick (1 s) would thrash storage — phase key changes are enough.
  const phaseKey = `${engine.blockIndex}-${engine.roundIndex}-${engine.activityIndex}-${engine.phase}`
  const phaseKeyRef = useRef(phaseKey)
  useEffect(() => {
    if (phaseKeyRef.current === phaseKey && engine.status === phaseKeyRef._lastStatus) return
    phaseKeyRef.current = phaseKey
    phaseKeyRef._lastStatus = engine.status

    if (engine.status === 'running' || engine.status === 'paused') {
      try {
        localStorage.setItem(SESSION_KEY, JSON.stringify({
          programmeId,
          phase: engine.phase,
          timeLeft: engine.timeLeft,
          blockIndex: engine.blockIndex,
          roundIndex: engine.roundIndex,
          activityIndex: engine.activityIndex,
          paused: engine.status === 'paused',
          savedAt: Date.now(),
        }))
      } catch { /* storage full — swallow */ }
    }

    if (engine.status === 'idle' || engine.status === 'complete') {
      clearSavedSession()
    }
  })

  useEffect(() => {
    getProgramme(programmeId).then(setProgramme).catch((err) => setLoadError(err.message))
  }, [programmeId])

  useEffect(() => {
    if (engine.status === 'complete' && programme && sessionStartedAt) {
      recordSession(programme, sessionStartedAt, 'completed').catch(() => {})
    }
  }, [engine.status, programme, sessionStartedAt])

  function handleStart() {
    setSessionStartedAt(new Date().toISOString())
    clearSavedSession()
    setPendingResume(null)
    engine.start()
    fullscreen.enter()
  }

  function handleStop() {
    if (!window.confirm('Stop this workout? Progress will be discarded.')) return
    if (programme && sessionStartedAt) {
      recordSession(programme, sessionStartedAt, 'stopped').catch(() => {})
    }
    clearSavedSession()
    setExpanded(false)
    fullscreen.exit()
    engine.stop()
  }

  async function handleResume(saved) {
    setPendingResume(null)
    setSessionStartedAt(new Date().toISOString())
    const elapsed = Math.floor((Date.now() - saved.savedAt) / 1000)
    const timeLeft = Math.max(1, saved.timeLeft - (saved.paused ? 0 : elapsed))
    await engine.restore({ ...saved, timeLeft })
    setExpanded(true)
    if (!saved.paused) fullscreen.enter()
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
      <>
        {offline && <OfflineBanner />}
        <TimerRun
          engine={engine}
          programme={programme}
          onCollapse={() => { setExpanded(false); fullscreen.exit() }}
          onStop={handleStop}
        />
      </>
    )
  }

  const isRunning = engine.status !== 'idle'
  const today = new Date()
  const dateLabel = `${String(today.getDate()).padStart(2, '0')} ${MONTH_LABELS[today.getMonth()]} | ${programme.type}`
  const actionLabel = engine.status === 'paused' ? 'Resume' : engine.status === 'running' ? 'Running' : 'Start'

  return (
    <div style={{ ...s.page, paddingBottom: 'calc(var(--bottom-nav-h) + 24px)' }}>
      {offline && <OfflineBanner />}

      {pendingResume && engine.status === 'idle' && (
        <ResumeBanner
          saved={pendingResume}
          programme={programme}
          onResume={() => handleResume(pendingResume)}
          onDismiss={() => { setPendingResume(null); clearSavedSession() }}
        />
      )}

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

function OfflineBanner() {
  return (
    <div style={s.offlineBanner} role="status" aria-live="polite">
      OFFLINE — session protected
    </div>
  )
}

function ResumeBanner({ saved, programme, onResume, onDismiss }) {
  const stateLabel = saved.paused ? 'Paused' : 'In progress'
  const phaseLabel = saved.phase === 'active' ? 'Active'
    : saved.phase === 'recover' ? 'Recover'
    : saved.phase === 'intro' ? 'Intro'
    : saved.phase

  return (
    <div style={s.resumeBanner}>
      <div>
        <div style={s.resumeTitle}>Resume {programme.name}?</div>
        <div style={s.resumeSub}>{stateLabel} · {phaseLabel} phase</div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={onDismiss} style={s.resumeDismiss}>Discard</button>
        <button onClick={onResume} style={s.resumeConfirm}>Resume</button>
      </div>
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
  offlineBanner: {
    position: 'fixed', top: 0, left: 0, right: 0, zIndex: 60,
    background: 'var(--color-action-danger, #dc2626)', color: '#fff',
    fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 11, letterSpacing: '0.12em',
    textTransform: 'uppercase', textAlign: 'center', padding: '8px 16px',
  },
  resumeBanner: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
    background: 'var(--color-bg-surface)', border: '1px solid var(--color-border-default)',
    borderRadius: 'var(--radius-lg)', padding: '14px 16px', marginBottom: 16,
  },
  resumeTitle: {
    fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--text-sm)',
    color: 'var(--color-text-primary)', marginBottom: 2,
  },
  resumeSub: { fontSize: 12, color: 'var(--color-text-muted)' },
  resumeDismiss: {
    height: 36, padding: '0 12px', background: 'transparent',
    color: 'var(--color-text-secondary)', fontFamily: 'var(--btn-font)', fontWeight: 700, fontSize: 11,
    textTransform: 'uppercase', border: '1px solid var(--color-border-default)',
    borderRadius: 'var(--btn-radius)', cursor: 'pointer',
  },
  resumeConfirm: {
    height: 36, padding: '0 14px', background: 'var(--color-action-primary)',
    color: 'var(--color-action-primary-text)', fontFamily: 'var(--btn-font)', fontWeight: 700, fontSize: 11,
    textTransform: 'uppercase', border: 'none', borderRadius: 'var(--btn-radius)', cursor: 'pointer',
  },
}
