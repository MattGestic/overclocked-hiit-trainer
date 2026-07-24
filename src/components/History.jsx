import { useEffect, useMemo, useState } from 'react'
import { listAllSessions } from '../lib/sessionLogsApi'
import { useLayout } from '../hooks/useLayout'
import { useToast } from '../shared-ui'
import { IconChevron } from './icons'
import AppTabBar from './AppTabBar'

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
const WEEKDAY_ABBR = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

function startOfWeek(d) {
  const date = new Date(d)
  const day = (date.getDay() + 6) % 7 // Monday = 0
  date.setDate(date.getDate() - day)
  date.setHours(0, 0, 0, 0)
  return date
}

function sessionDurationMs(s) {
  if (!s.ended_at) return 0
  return new Date(s.ended_at) - new Date(s.started_at)
}

function formatClock(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const sec = totalSeconds % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  return `${m}:${String(sec).padStart(2, '0')}`
}

function computeStats(sessions) {
  const dateSet = new Set(sessions.map((s) => new Date(s.started_at).toDateString()))

  const weekStart = startOfWeek(new Date())
  const thisWeekCount = sessions.filter((s) => new Date(s.started_at) >= weekStart).length

  const allTimeMs = sessions.reduce((sum, s) => sum + sessionDurationMs(s), 0)

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

// Sessions/longest-run/total-time for a specific calendar month — "longest
// run" here is the longest streak of consecutive days *within that month*
// that have a session, distinct from the top stat card's all-time streak.
function computeMonthSummary(sessions, year, month) {
  const inMonth = sessions.filter((s) => {
    const d = new Date(s.started_at)
    return d.getFullYear() === year && d.getMonth() === month
  })

  const daysWithSession = new Set(inMonth.map((s) => new Date(s.started_at).getDate()))
  let longestRun = 0
  let current = 0
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  for (let d = 1; d <= daysInMonth; d++) {
    if (daysWithSession.has(d)) { current++; longestRun = Math.max(longestRun, current) }
    else current = 0
  }

  const totalMs = inMonth.reduce((sum, s) => sum + sessionDurationMs(s), 0)

  return { sessions: inMonth.length, longestRun, totalMs }
}

// Average a set of past real months' summaries — powers the "Forecast"
// badge for a month that hasn't happened yet. Purely a client-side
// projection over sessions already fetched; no separate data model.
function forecastSummary(sessions, beforeYear, beforeMonth) {
  const byMonth = new Map()
  for (const s of sessions) {
    const d = new Date(s.started_at)
    const key = d.getFullYear() * 12 + d.getMonth()
    if (key >= beforeYear * 12 + beforeMonth) continue
    if (!byMonth.has(key)) byMonth.set(key, [])
    byMonth.get(key).push(s)
  }
  const keys = [...byMonth.keys()]
  if (keys.length === 0) return { sessions: 0, longestRun: 0, totalMs: 0 }
  let sessionsSum = 0, longestRunSum = 0, msSum = 0
  for (const key of keys) {
    const y = Math.floor(key / 12), m = key % 12
    const summary = computeMonthSummary(sessions, y, m)
    sessionsSum += summary.sessions
    longestRunSum += summary.longestRun
    msSum += summary.totalMs
  }
  const n = keys.length
  return { sessions: Math.round(sessionsSum / n), longestRun: Math.round(longestRunSum / n), totalMs: msSum / n }
}

function buildMonthGrid(monthOffset) {
  const anchor = new Date()
  anchor.setDate(1)
  anchor.setMonth(anchor.getMonth() + monthOffset)
  const year = anchor.getFullYear()
  const month = anchor.getMonth()
  const firstDay = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const prevDaysInMonth = new Date(year, month, 0).getDate()
  const leadingBlanks = (firstDay.getDay() + 6) % 7 // Monday = 0

  const cells = []
  for (let i = 0; i < leadingBlanks; i++) {
    cells.push({ date: new Date(year, month - 1, prevDaysInMonth - leadingBlanks + 1 + i), current: false })
  }
  for (let d = 1; d <= daysInMonth; d++) cells.push({ date: new Date(year, month, d), current: true })
  let nextDay = 1
  while (cells.length < 42) cells.push({ date: new Date(year, month + 1, nextDay++), current: false })

  return { cells, year, month, label: anchor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) }
}

export default function History({ navigate }) {
  const [sessions, setSessions] = useState(null)
  const [error, setError] = useState(null)
  const [monthOffset, setMonthOffset] = useState(0)
  const [selectedDate, setSelectedDate] = useState(null) // toDateString() or null
  const layout = useLayout()
  const toast = useToast()

  function openSession(sess) {
    if (sess.programme_id) navigate({ screen: 'workout', programmeId: sess.programme_id })
    else toast?.('That programme was deleted — this session is a record only', 'error')
  }

  useEffect(() => {
    listAllSessions().then(setSessions).catch((err) => setError(err.message))
  }, [])

  const stats = useMemo(() => (sessions ? computeStats(sessions) : null), [sessions])
  const { cells, year, month, label } = useMemo(() => buildMonthGrid(monthOffset), [monthOffset])
  const today = new Date()
  const todayStr = today.toDateString()
  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth()
  const isFutureMonth = year * 12 + month > today.getFullYear() * 12 + today.getMonth()

  const byDate = useMemo(() => {
    const map = new Map()
    if (!sessions) return map
    for (const s of sessions) {
      const key = new Date(s.started_at).toDateString()
      if (!map.has(key)) map.set(key, [])
      map.get(key).push(s)
    }
    return map
  }, [sessions])

  const monthSummary = useMemo(() => {
    if (!sessions) return null
    return isFutureMonth ? forecastSummary(sessions, year, month) : computeMonthSummary(sessions, year, month)
  }, [sessions, year, month, isFutureMonth])

  const monthSessions = useMemo(() => {
    if (!sessions) return []
    return sessions
      .filter((s) => { const d = new Date(s.started_at); return d.getFullYear() === year && d.getMonth() === month })
      .sort((a, b) => (a.started_at < b.started_at ? 1 : -1))
  }, [sessions, year, month])

  function goMonth(delta) {
    setSelectedDate(null)
    setMonthOffset((m) => m + delta)
  }
  function goToday() {
    setSelectedDate(null)
    setMonthOffset(0)
  }

  const listedSessions = selectedDate ? (byDate.get(selectedDate) || []) : monthSessions
  const modeLabel = isFutureMonth ? 'Forecast' : isCurrentMonth ? 'To date' : 'Final'

  const calendar = stats && (
    <div style={s.calendarCard}>
      <div style={s.calendarHeader}>
        <button onClick={() => goMonth(-1)} style={s.navBtn} aria-label="Previous month">
          <span style={{ display: 'inline-flex', transform: 'rotate(180deg)' }}><IconChevron size={13} /></span>
        </button>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 7 }}>
          <span style={s.monthLabel}>{label}</span>
          {!isCurrentMonth && <button onClick={goToday} style={s.todayBtn}>Today</button>}
        </div>
        <button onClick={() => goMonth(1)} style={s.navBtn} aria-label="Next month"><IconChevron size={13} /></button>
      </div>
      <div style={s.weekdayRow}>
        {WEEKDAYS.map((w, i) => <span key={i} style={s.weekday}>{w}</span>)}
      </div>
      <div style={s.grid}>
        {cells.map(({ date, current }, i) => {
          const key = date.toDateString()
          if (!current) return <span key={i} style={s.dayCellMuted}>{date.getDate()}</span>
          const has = byDate.has(key)
          const isToday = key === todayStr
          const isSelected = key === selectedDate
          return (
            <button
              key={i}
              onClick={() => setSelectedDate((prev) => (prev === key ? null : key))}
              style={{
                ...s.dayCell,
                ...(has && !isToday ? s.dayCellActive : {}),
                ...(isToday ? s.dayCellToday : {}),
                ...(isSelected ? s.dayCellSelected : {}),
              }}
            >
              {date.getDate()}
              {has && !isToday && <span style={s.dayDot} />}
            </button>
          )
        })}
      </div>
      {monthSummary && (
        <div style={s.monthSummaryRow}>
          <div style={s.monthSummaryItem}>
            <span style={s.monthSummaryValue}>{isFutureMonth && '~'}{monthSummary.sessions}</span>
            <span style={s.monthSummaryLabel}>Sessions</span>
          </div>
          <div style={s.monthSummaryDivider} />
          <div style={s.monthSummaryItem}>
            <span style={s.monthSummaryValue}>{isFutureMonth && '~'}{monthSummary.longestRun}</span>
            <span style={s.monthSummaryLabel}>Longest run</span>
          </div>
          <div style={s.monthSummaryDivider} />
          <div style={s.monthSummaryItem}>
            <span style={s.monthSummaryValue}>{formatClock(monthSummary.totalMs)}</span>
            <span style={s.monthSummaryLabel}>Total time</span>
          </div>
          <span style={{ ...s.modeBadge, ...(isFutureMonth ? s.modeBadgeForecast : isCurrentMonth ? s.modeBadgeToDate : s.modeBadgeFinal) }}>
            {modeLabel}
          </span>
        </div>
      )}
    </div>
  )

  const recentSessions = stats && (
    <div>
      <div style={s.recentHeader}>
        <span style={s.recentLabel}>{selectedDate ? 'Sessions' : 'Recent Sessions'}</span>
        {selectedDate ? (
          <button onClick={() => setSelectedDate(null)} style={s.clearChip}>
            {new Date(selectedDate).toLocaleDateString(undefined, { weekday: 'short', day: '2-digit', month: 'short' })}
            <span style={{ marginLeft: 4 }}>&times;</span>
          </button>
        ) : (
          <span style={s.monthChip}>{label.toUpperCase()}</span>
        )}
      </div>
      {listedSessions.length === 0 && (
        <p style={{ color: 'var(--color-text-muted)' }}>
          {selectedDate ? (new Date(selectedDate) > today ? 'No session planned.' : 'Rest day.') : 'No sessions logged this month.'}
        </p>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {listedSessions.slice(0, 15).map((sess) => {
          const d = new Date(sess.started_at)
          return (
            <button
              key={sess.id}
              onClick={() => openSession(sess)}
              style={{ ...s.sessionRow, opacity: sess.programme_id ? 1 : 0.72 }}
              aria-label={sess.programme_id ? `Open ${sess.programme_name}` : `${sess.programme_name} (programme deleted)`}
            >
              <div style={s.sessionDateBadge}>
                <span style={s.sessionDateWeekday}>{WEEKDAY_ABBR[d.getDay()]}</span>
                <span style={s.sessionDateNum}>{String(d.getDate()).padStart(2, '0')}</span>
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={s.sessionName}>
                  {sess.programme_name}{sess.status === 'stopped' && <span style={s.stoppedTag}> &middot; stopped early</span>}
                </div>
                <div style={s.sessionMeta}>
                  {formatClock(sessionDurationMs(sess))}{sess.block_count != null && ` · ${sess.block_count} block${sess.block_count === 1 ? '' : 's'}`}
                </div>
              </div>
              <span style={{ color: 'var(--color-text-muted)', flexShrink: 0 }}><IconChevron size={13} /></span>
            </button>
          )
        })}
      </div>
    </div>
  )

  return (
    <div style={{ ...s.page, maxWidth: layout.wide ? 900 : 'var(--shell-max-mobile)' }}>
      <div style={s.header}>
        <div style={s.eyebrow}>Workout Log</div>
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

          {layout.wide ? (
            <div style={s.sideBySide}>
              <div style={{ flex: 1 }}>{calendar}</div>
              <div style={{ flex: 1 }}>{recentSessions}</div>
            </div>
          ) : (
            <>
              {calendar}
              {recentSessions}
            </>
          )}
        </>
      )}

      <AppTabBar active="history" onNavigate={(id) => id === 'library' && navigate({ screen: 'library' })} />
    </div>
  )
}

const s = {
  page: { maxWidth: 'var(--shell-max-mobile)', margin: '0 auto', padding: '24px var(--shell-px-mobile) calc(var(--bottom-nav-h) + 24px)' },
  header: { marginBottom: 20 },
  eyebrow: {
    fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 10, letterSpacing: '0.14em',
    textTransform: 'uppercase', color: 'var(--color-text-muted)',
  },
  title: { margin: '2px 0 0', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--text-2xl)', color: 'var(--color-text-primary)' },
  statsRow: { display: 'flex', gap: 12, marginBottom: 20 },
  sideBySide: { display: 'flex', gap: 24, alignItems: 'flex-start' },
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
    border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  monthLabel: { fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)' },
  todayBtn: {
    fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase',
    color: 'var(--color-success-text)', padding: '2px 6px', borderRadius: 4,
    background: 'var(--color-success-bg)', border: 'none', cursor: 'pointer',
  },
  weekdayRow: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 4 },
  weekday: { textAlign: 'center', fontSize: 10, fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--color-text-subtle)' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 },
  dayCell: {
    position: 'relative', aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--radius-sm)',
    fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'var(--font-mono)',
  },
  dayCellMuted: {
    aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 'var(--text-xs)', color: 'var(--color-text-subtle)', opacity: 0.35, fontFamily: 'var(--font-mono)',
  },
  dayCellActive: { background: 'var(--color-success-surface)', color: 'var(--color-success-text)', fontWeight: 700 },
  dayDot: { position: 'absolute', bottom: 3, width: 4, height: 4, borderRadius: '50%', background: 'var(--color-success-icon)' },
  dayCellToday: { background: 'var(--color-bg-inverse)', color: 'var(--color-text-inverse)', fontWeight: 700 },
  dayCellSelected: { boxShadow: 'inset 0 0 0 2px var(--color-bg-inverse)' },
  monthSummaryRow: {
    display: 'flex', alignItems: 'center', gap: 12, marginTop: 16, paddingTop: 14,
    borderTop: '1px solid var(--card-border)', flexWrap: 'wrap',
  },
  monthSummaryItem: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 },
  monthSummaryValue: { fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--text-md)', color: 'var(--color-text-primary)' },
  monthSummaryLabel: { fontSize: 9, fontFamily: 'var(--font-display)', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-text-muted)' },
  monthSummaryDivider: { width: 1, height: 24, background: 'var(--card-border)' },
  modeBadge: {
    marginLeft: 'auto', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 9, letterSpacing: '0.08em',
    textTransform: 'uppercase', borderRadius: 'var(--radius-chip)', padding: '3px 8px', textAlign: 'center',
  },
  modeBadgeToDate: { color: 'var(--color-success-text)', background: 'var(--color-success-bg)', border: '1px solid var(--color-success-border)' },
  modeBadgeForecast: { color: 'var(--color-action-primary)', background: 'var(--color-info-bg)', border: '1px solid var(--color-info-border)' },
  modeBadgeFinal: { color: 'var(--color-text-muted)', background: 'var(--color-bg-surface-subtle)', border: '1px solid var(--card-border)' },
  recentHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  recentLabel: {
    fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--text-xs)', letterSpacing: 'var(--tracking-label)',
    textTransform: 'uppercase', color: 'var(--color-text-muted)',
  },
  clearChip: {
    display: 'inline-flex', alignItems: 'center', fontSize: 10, fontWeight: 700,
    letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-text-secondary)',
    padding: '3px 8px', borderRadius: 4, background: 'var(--color-action-secondary)', border: 'none', cursor: 'pointer',
  },
  monthChip: {
    fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--color-text-muted)',
  },
  sessionRow: {
    display: 'flex', alignItems: 'center', gap: 12, background: 'var(--card-bg)', width: '100%',
    border: '1px solid var(--card-border)', borderRadius: 'var(--radius-md)', padding: '10px 14px',
    textAlign: 'left', cursor: 'pointer',
  },
  sessionDateBadge: { display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, width: 32 },
  sessionDateWeekday: { fontSize: 9, fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--color-text-subtle)', letterSpacing: '0.04em' },
  sessionDateNum: { fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--text-lg)', color: 'var(--color-text-primary)' },
  sessionName: { fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)' },
  sessionMeta: { fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 2 },
  stoppedTag: { fontWeight: 400, color: 'var(--color-text-muted)', textTransform: 'none' },
}
