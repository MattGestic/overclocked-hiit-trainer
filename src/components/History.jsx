import { useEffect, useMemo, useState } from 'react'
import { timeAgo } from '../shared-ui/utils/format'
import { listAllSessions } from '../lib/sessionLogsApi'

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

function startOfWeek(d) {
  const date = new Date(d)
  const day = (date.getDay() + 6) % 7 // Monday = 0
  date.setDate(date.getDate() - day)
  date.setHours(0, 0, 0, 0)
  return date
}

function computeStats(sessions) {
  const dateSet = new Set(sessions.map((s) => new Date(s.started_at).toDateString()))

  const weekStart = startOfWeek(new Date())
  const thisWeekCount = sessions.filter((s) => new Date(s.started_at) >= weekStart).length

  const allTimeMs = sessions.reduce((sum, s) => {
    if (!s.ended_at) return sum
    return sum + (new Date(s.ended_at) - new Date(s.started_at))
  }, 0)

  let streak = 0
  const cursor = new Date()
  cursor.setHours(0, 0, 0, 0)
  if (!dateSet.has(cursor.toDateString())) cursor.setDate(cursor.getDate() - 1)
  while (dateSet.has(cursor.toDateString())) {
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }

  return { dateSet, thisWeekCount, allTimeHours: allTimeMs / 3600000, streak }
}

function buildMonthGrid(monthOffset) {
  const anchor = new Date()
  anchor.setDate(1)
  anchor.setMonth(anchor.getMonth() + monthOffset)
  const year = anchor.getFullYear()
  const month = anchor.getMonth()
  const firstDay = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const leadingBlanks = (firstDay.getDay() + 6) % 7 // Monday = 0

  const cells = Array(leadingBlanks).fill(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d))

  return { cells, label: anchor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) }
}

export default function History({ onBack }) {
  const [sessions, setSessions] = useState(null)
  const [error, setError] = useState(null)
  const [monthOffset, setMonthOffset] = useState(0)

  useEffect(() => {
    listAllSessions().then(setSessions).catch((err) => setError(err.message))
  }, [])

  const stats = useMemo(() => (sessions ? computeStats(sessions) : null), [sessions])
  const { cells, label } = useMemo(() => buildMonthGrid(monthOffset), [monthOffset])
  const today = new Date().toDateString()

  return (
    <div style={s.page}>
      <div style={s.header}>
        <button onClick={onBack} style={s.backBtn} aria-label="Back">&larr;</button>
        <h1 style={s.title}>History</h1>
      </div>

      {error && <p style={{ color: 'var(--color-error-text)' }}>Couldn&rsquo;t load history: {error}</p>}
      {!sessions && !error && <p style={{ color: 'var(--color-text-muted)' }}>Loading&hellip;</p>}

      {stats && (
        <>
          <div style={s.statsRow}>
            <div style={s.statCard}>
              <div style={s.statLabel}>This Week</div>
              <div style={s.statValue}>{stats.thisWeekCount}</div>
            </div>
            <div style={s.statCard}>
              <div style={s.statLabel}>Streak</div>
              <div style={s.statValue}>{stats.streak}</div>
            </div>
            <div style={s.statCard}>
              <div style={s.statLabel}>All-Time</div>
              <div style={s.statValue}>{stats.allTimeHours.toFixed(1)}h</div>
            </div>
          </div>

          <div style={s.calendarCard}>
            <div style={s.calendarHeader}>
              <button onClick={() => setMonthOffset((m) => m - 1)} style={s.navBtn} aria-label="Previous month">&lsaquo;</button>
              <span style={s.monthLabel}>{label}</span>
              <button onClick={() => setMonthOffset((m) => m + 1)} style={s.navBtn} aria-label="Next month">&rsaquo;</button>
            </div>
            <div style={s.weekdayRow}>
              {WEEKDAYS.map((w, i) => <span key={i} style={s.weekday}>{w}</span>)}
            </div>
            <div style={s.grid}>
              {cells.map((date, i) => {
                if (!date) return <span key={i} />
                const has = stats.dateSet.has(date.toDateString())
                const isToday = date.toDateString() === today
                return (
                  <span
                    key={i}
                    style={{
                      ...s.dayCell,
                      ...(has ? s.dayCellActive : {}),
                      ...(isToday ? s.dayCellToday : {}),
                    }}
                  >
                    {date.getDate()}
                  </span>
                )
              })}
            </div>
          </div>

          <div style={s.recentLabel}>Recent Sessions</div>
          {sessions.length === 0 && <p style={{ color: 'var(--color-text-muted)' }}>No sessions logged yet.</p>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {sessions.slice(0, 15).map((sess) => (
              <div key={sess.id} style={s.sessionRow}>
                <div>
                  <div style={s.sessionName}>{sess.programme_name}</div>
                  <div style={s.sessionMeta}>{timeAgo(sess.started_at)}</div>
                </div>
                <span style={sess.status === 'completed' ? s.badgeDone : s.badgeStopped}>
                  {sess.status === 'completed' ? 'Done' : 'Stopped'}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
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
  title: { margin: 0, fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--text-xl)', color: 'var(--color-text-primary)' },
  statsRow: { display: 'flex', gap: 12, marginBottom: 20 },
  statCard: {
    flex: 1, background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 'var(--card-radius)',
    padding: 'var(--card-padding-sm)', textAlign: 'center',
  },
  statLabel: { fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 9, letterSpacing: '0.1em', color: 'var(--color-text-muted)', textTransform: 'uppercase' },
  statValue: { fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 'var(--text-2xl)', color: 'var(--color-text-primary)', marginTop: 4 },
  calendarCard: {
    background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 'var(--card-radius)',
    padding: 'var(--card-padding-md)', marginBottom: 24,
  },
  calendarHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  navBtn: {
    width: 28, height: 28, background: 'var(--color-action-secondary)', color: 'var(--color-action-secondary-text)',
    border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
  },
  monthLabel: { fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)' },
  weekdayRow: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 4 },
  weekday: { textAlign: 'center', fontSize: 10, fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--color-text-subtle)' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 },
  dayCell: {
    aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--radius-sm)',
    fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)',
  },
  dayCellActive: { background: 'var(--color-success-surface)', color: 'var(--color-success-text)', fontWeight: 700 },
  dayCellToday: { outline: '1.5px solid var(--color-action-primary)', outlineOffset: -1 },
  recentLabel: {
    fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--text-xs)', letterSpacing: 'var(--tracking-label)',
    textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: 12,
  },
  sessionRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--card-bg)',
    border: '1px solid var(--card-border)', borderRadius: 'var(--radius-md)', padding: '10px 14px',
  },
  sessionName: { fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)' },
  sessionMeta: { fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' },
  badgeDone: {
    fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase',
    color: 'var(--color-success-text)', background: 'var(--color-success-bg)', border: '1px solid var(--color-success-border)',
    borderRadius: 'var(--radius-chip)', padding: '3px 8px',
  },
  badgeStopped: {
    fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase',
    color: 'var(--color-text-muted)', background: 'var(--color-bg-surface-subtle)', border: '1px solid var(--card-border)',
    borderRadius: 'var(--radius-chip)', padding: '3px 8px',
  },
}
