import { useEffect, useState } from 'react'
import { useToast } from '../shared-ui'
import { timeAgo } from '../shared-ui/utils/format'
import { listProgrammes, deleteProgramme } from '../lib/programmesApi'
import { listSessionCountsSince } from '../lib/sessionLogsApi'
import { useLayout } from '../hooks/useLayout'
import AppTabBar from './AppTabBar'

function libraryMaxWidth(bp) {
  if (bp === 'xl') return 1200
  if (bp === 'lg') return 900
  return 'var(--shell-max-mobile)'
}

function libraryGridColumns(bp) {
  if (bp === 'xl') return 3
  if (bp === 'lg') return 2
  return 1
}

function startOfWeek(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - d.getDay()) // Sunday
  return d
}

// Pure fetch, no state access — safe to call from an effect body directly;
// every setState happens in the .then()/.catch() callback at the call site.
function fetchLibraryData() {
  return Promise.all([listProgrammes(), listSessionCountsSince(startOfWeek(new Date()))])
    .then(([list, counts]) => ({ list, counts }))
}

const WEEKDAY_LABELS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
const MONTH_LABELS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']

// DONE / MISSED / PLANNED week strip (refined-UI p.1). No separate
// "scheduling" data model exists — status is derived purely from a day's
// position relative to today plus whether a session was logged that day:
// past-with-session = done, past-without = missed, future = planned,
// today-without-session-yet reads as neutral (the day isn't over).
function WeekCalendar({ dailyReps }) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const start = startOfWeek(today)
  const weekOfMonth = Math.ceil((start.getDate()) / 7)

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start)
    d.setDate(d.getDate() + i)
    const isToday = d.getTime() === today.getTime()
    const isFuture = d.getTime() > today.getTime()
    const hasSession = (dailyReps[d.toDateString()] || 0) > 0
    const status = hasSession ? 'done' : isFuture ? 'planned' : isToday ? 'neutral' : 'missed'
    return { date: d, isToday, status }
  })

  const dotColor = {
    done: 'var(--color-timer-work)',
    missed: 'var(--color-text-subtle)',
    planned: 'var(--color-timer-rest)',
    neutral: 'transparent',
  }

  return (
    <div style={s.calCard}>
      <div style={s.calHeader}>
        <span style={s.calTitle}>{MONTH_LABELS[start.getMonth()]} &middot; WEEK {weekOfMonth}</span>
        <div style={s.calLegend}>
          <LegendDot color={dotColor.done} label="Done" />
          <LegendDot color={dotColor.missed} label="Missed" />
          <LegendDot color={dotColor.planned} label="Planned" />
        </div>
      </div>
      <div style={s.calGrid}>
        {days.map(({ date, isToday, status }) => (
          <div key={date.toDateString()} style={{ ...s.calDay, ...(isToday ? s.calDayToday : null) }}>
            <span style={{ ...s.calWeekday, color: [0, 6].includes(date.getDay()) ? 'var(--color-timer-warning)' : 'var(--color-text-subtle)' }}>
              {WEEKDAY_LABELS[date.getDay()]}
            </span>
            <span style={s.calDate}>{date.getDate()}</span>
            <span style={{ ...s.calDot, background: dotColor[status] }} />
          </div>
        ))}
      </div>
    </div>
  )
}

function LegendDot({ color, label }) {
  return (
    <span style={s.legendItem}>
      <span style={{ ...s.legendDot, background: color === 'transparent' ? 'var(--color-text-subtle)' : color }} />
      {label}
    </span>
  )
}

function todayLine() {
  const now = new Date()
  const weekday = WEEKDAY_LABELS[now.getDay()].slice(0, 3)
  const date = `${String(now.getDate()).padStart(2, '0')} ${MONTH_LABELS[now.getMonth()]}`
  const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
  return `${weekday} · ${date} · ${time}`
}

export default function Library({ onNew, onQuickNew, onEdit, onRun, onSettings, navigate }) {
  const [programmes, setProgrammes] = useState(null) // null = loading
  const [error, setError] = useState(null)
  const [dailyReps, setDailyReps] = useState({})
  const [reloadToken, setReloadToken] = useState(0)
  const toast = useToast()
  const layout = useLayout()

  function retry() {
    setProgrammes(null)
    setError(null)
    setReloadToken((n) => n + 1)
  }

  useEffect(() => {
    fetchLibraryData()
      .then(({ list, counts }) => {
        setProgrammes(list)
        setDailyReps(counts)
        setError(null)
      })
      .catch((err) => setError(err.message))
  }, [reloadToken])

  async function handleDelete(id, name) {
    if (!window.confirm(`Delete "${name}"? This can't be undone.`)) return
    try {
      await deleteProgramme(id)
      setProgrammes((prev) => prev.filter((p) => p.id !== id))
      toast?.(`Deleted "${name}"`, 'success')
    } catch (err) {
      toast?.(err.message, 'error')
    }
  }

  return (
    <div className="mx-auto w-full" style={{ maxWidth: libraryMaxWidth(layout.bp), padding: '0 var(--shell-px-mobile) calc(var(--bottom-nav-h) + 24px)', transition: 'max-width 0.2s' }}>
      <header className="flex items-center justify-between" style={{ padding: '24px 0 4px' }}>
        <h1 style={s.wordmark}>OVER&bull;CLOCK</h1>
        <button onClick={onSettings} aria-label="Settings" style={s.settingsBtn}>&#9881;</button>
      </header>

      <div style={s.dateLine}>{todayLine()}</div>
      <h2 style={s.hero}>Start the clock.</h2>

      <WeekCalendar dailyReps={dailyReps} />

      <div className="flex items-center justify-between" style={{ margin: '28px 0 12px' }}>
        <span style={s.sectionLabel}>Programmes</span>
        <button onClick={onQuickNew} style={s.newBtn}>+ New</button>
      </div>

      {programmes === null && !error && (
        <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '32px 0' }}>Loading&hellip;</p>
      )}

      {error && (
        <div style={{
          padding: 'var(--space-4)', background: 'var(--color-error-bg)', border: '1px solid var(--color-error-border)',
          borderRadius: 'var(--radius-md)', color: 'var(--color-error-text)', textAlign: 'center',
        }}>
          <p style={{ margin: '0 0 8px' }}>Couldn&rsquo;t load programmes: {error}</p>
          <button onClick={retry} style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--color-error-text)', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}>
            Retry
          </button>
        </div>
      )}

      {programmes && programmes.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: 16 }}>No programmes yet.</p>
          <button onClick={onNew} style={s.newProgrammeBtn}>New Programme</button>
        </div>
      )}

      {programmes && programmes.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${libraryGridColumns(layout.bp)}, 1fr)`, gap: 12 }}>
          {programmes.map((p) => (
            <div key={p.id} style={s.card}>
              <button onClick={() => onRun(p.id)} className="flex items-center flex-1" style={s.cardMain}>
                <div style={s.durationBadge}>{p.durationMinutes}</div>
                <div style={{ minWidth: 0 }}>
                  <div style={s.programmeName}>{p.name}</div>
                  <div style={s.programmeMeta}>
                    <span style={s.typeTag}>{p.type}</span>
                    <span>&middot; {p.blockCount} block{p.blockCount === 1 ? '' : 's'} &middot; {timeAgo(p.updatedAt)}</span>
                  </div>
                </div>
              </button>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <button onClick={() => onEdit(p.id)} aria-label={`Edit ${p.name}`} style={s.iconBtn}>Edit</button>
                <button onClick={() => handleDelete(p.id, p.name)} aria-label={`Delete ${p.name}`} style={s.deleteBtn}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <AppTabBar active="library" onNavigate={(id) => id === 'history' && navigate({ screen: 'history' })} />
    </div>
  )
}

const s = {
  wordmark: {
    fontFamily: 'var(--font-display)', fontWeight: 'var(--weight-bold)', fontSize: 'var(--text-2xl)',
    letterSpacing: 'var(--tracking-wide)', color: 'var(--color-text-primary)', margin: 0,
  },
  settingsBtn: {
    width: 40, height: 40, borderRadius: 'var(--radius-md)', background: 'var(--color-action-secondary)',
    color: 'var(--color-action-secondary-text)', border: 'none', cursor: 'pointer', fontSize: 16,
  },
  dateLine: {
    fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--text-xs)', letterSpacing: 'var(--tracking-wide)',
    color: 'var(--color-text-muted)', textTransform: 'uppercase', marginTop: 4,
  },
  hero: {
    fontFamily: 'var(--font-display)', fontWeight: 'var(--weight-bold)', fontSize: 'var(--text-3xl)',
    letterSpacing: 'var(--tracking-tight)', color: 'var(--color-text-primary)', textTransform: 'uppercase',
    margin: '4px 0 20px',
  },
  calCard: {
    background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 'var(--card-radius)',
    padding: 'var(--card-padding-md)',
  },
  calHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 8 },
  calTitle: { fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--text-sm)', letterSpacing: 'var(--tracking-wide)', color: 'var(--color-text-primary)' },
  calLegend: { display: 'flex', gap: 12 },
  legendItem: { display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'var(--color-text-muted)', fontFamily: 'var(--font-display)', letterSpacing: '0.06em', textTransform: 'uppercase' },
  legendDot: { width: 6, height: 6, borderRadius: '50%', flexShrink: 0 },
  calGrid: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 },
  calDay: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '8px 2px', borderRadius: 'var(--radius-md)' },
  calDayToday: { background: 'var(--color-bg-inverse)', boxShadow: '0 0 0 1px var(--color-border-strong)' },
  calWeekday: { fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 9, letterSpacing: '0.08em' },
  calDate: { fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--text-lg)', color: 'var(--color-text-primary)' },
  calDot: { width: 6, height: 6, borderRadius: '50%' },
  sectionLabel: {
    fontFamily: 'var(--font-display)', fontWeight: 'var(--weight-bold)', fontSize: 'var(--text-xs)',
    letterSpacing: 'var(--tracking-label)', textTransform: 'uppercase', color: 'var(--color-text-muted)',
  },
  newBtn: {
    fontFamily: 'var(--font-display)', fontWeight: 'var(--weight-bold)', fontSize: 'var(--text-xs)',
    letterSpacing: 'var(--tracking-label)', color: 'var(--color-action-primary)',
    background: 'none', border: 'none', cursor: 'pointer', textTransform: 'uppercase',
  },
  newProgrammeBtn: {
    height: 'var(--btn-h-md)', padding: '0 24px', background: 'var(--color-action-primary)',
    color: 'var(--color-action-primary-text)', fontFamily: 'var(--btn-font)', fontWeight: 'var(--btn-weight)',
    letterSpacing: 'var(--btn-tracking)', fontSize: 'var(--text-sm)', textTransform: 'uppercase',
    border: 'none', borderRadius: 'var(--btn-radius)', cursor: 'pointer',
  },
  card: {
    display: 'flex', alignItems: 'center', gap: 12, background: 'var(--card-bg)', border: '1px solid var(--card-border)',
    borderRadius: 'var(--card-radius)', padding: 'var(--card-padding-md)',
  },
  cardMain: { gap: 14, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0, minWidth: 0, flex: 1 },
  durationBadge: {
    width: 44, height: 44, borderRadius: 'var(--radius-lg)', flexShrink: 0,
    background: 'var(--color-bg-inverse)', color: 'var(--color-timer-work)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 'var(--text-md)',
  },
  programmeName: {
    fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--text-md)', color: 'var(--color-text-primary)',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
  programmeMeta: {
    fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', display: 'flex', gap: 6, alignItems: 'center',
    overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
  },
  typeTag: { color: 'var(--color-action-primary)', fontFamily: 'var(--font-display)', fontWeight: 700, letterSpacing: 'var(--tracking-label)', flexShrink: 0 },
  iconBtn: {
    minWidth: 44, minHeight: 44, background: 'var(--color-action-secondary)', color: 'var(--color-action-secondary-text)',
    border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontFamily: 'var(--font-display)',
    fontWeight: 700, fontSize: 'var(--text-xs)',
  },
  deleteBtn: {
    minWidth: 44, minHeight: 44, background: 'transparent', color: 'var(--color-action-danger)',
    border: '1px solid var(--color-action-danger)', borderRadius: 'var(--radius-md)', cursor: 'pointer',
    fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--text-xs)',
  },
}
