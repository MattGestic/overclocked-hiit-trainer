import { useEffect, useState } from 'react'
import { DayDots, useToast } from '../shared-ui'
import { timeAgo } from '../shared-ui/utils/format'
import { listProgrammes, deleteProgramme } from '../lib/programmesApi'
import { listSessionCountsSince } from '../lib/sessionLogsApi'
import { useLayout } from '../hooks/useLayout'

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

function sevenDaysAgo() {
  const d = new Date()
  d.setDate(d.getDate() - 6)
  d.setHours(0, 0, 0, 0)
  return d
}

// Pure fetch, no state access — safe to call from an effect body directly;
// every setState happens in the .then()/.catch() callback at the call site.
function fetchLibraryData() {
  return Promise.all([listProgrammes(), listSessionCountsSince(sevenDaysAgo())])
    .then(([list, counts]) => ({ list, counts }))
}

export default function Library({ onNew, onEdit, onRun, onSettings, onHistory }) {
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
    <div className="mx-auto w-full pb-24" style={{ maxWidth: libraryMaxWidth(layout.bp), padding: '0 var(--shell-px-mobile) 96px', transition: 'max-width 0.2s' }}>
      <header className="flex items-center justify-between" style={{ padding: '24px 0 16px' }}>
        <h1 style={{
          fontFamily: 'var(--font-display)', fontWeight: 'var(--weight-bold)', fontSize: 'var(--text-2xl)',
          letterSpacing: 'var(--tracking-wide)', color: 'var(--color-text-primary)',
        }}>
          OVER&bull;CLOCK
        </h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={onHistory}
            aria-label="History"
            style={{
              height: 40, padding: '0 12px', borderRadius: 'var(--radius-md)', background: 'var(--color-action-secondary)',
              color: 'var(--color-action-secondary-text)', border: 'none', cursor: 'pointer', fontSize: 11,
              fontFamily: 'var(--font-display)', fontWeight: 700, letterSpacing: '0.06em',
            }}
          >
            HISTORY
          </button>
          <button
            onClick={onSettings}
            aria-label="Settings"
            style={{
              width: 40, height: 40, borderRadius: 'var(--radius-md)', background: 'var(--color-action-secondary)',
              color: 'var(--color-action-secondary-text)', border: 'none', cursor: 'pointer', fontSize: 16,
            }}
          >
            &#9881;
          </button>
        </div>
      </header>

      <DayDots
        startDate={sevenDaysAgo()}
        durationDays={7}
        dailyReps={dailyReps}
        label="THIS WEEK"
        activeColor="var(--color-timer-work)"
      />

      <div className="flex items-center justify-between" style={{ margin: '32px 0 12px' }}>
        <span style={{
          fontFamily: 'var(--font-display)', fontWeight: 'var(--weight-bold)', fontSize: 'var(--text-xs)',
          letterSpacing: 'var(--tracking-label)', textTransform: 'uppercase', color: 'var(--color-text-muted)',
        }}>
          Programmes
        </span>
        <button
          onClick={onNew}
          style={{
            fontFamily: 'var(--font-display)', fontWeight: 'var(--weight-bold)', fontSize: 'var(--text-xs)',
            letterSpacing: 'var(--tracking-label)', color: 'var(--color-action-primary)',
            background: 'none', border: 'none', cursor: 'pointer', textTransform: 'uppercase',
          }}
        >
          + New
        </button>
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
          <button
            onClick={onNew}
            style={{
              height: 'var(--btn-h-md)', padding: '0 24px', background: 'var(--color-action-primary)',
              color: 'var(--color-action-primary-text)', fontFamily: 'var(--btn-font)', fontWeight: 'var(--btn-weight)',
              letterSpacing: 'var(--btn-tracking)', fontSize: 'var(--text-sm)', textTransform: 'uppercase',
              border: 'none', borderRadius: 'var(--btn-radius)', cursor: 'pointer',
            }}
          >
            New Programme
          </button>
        </div>
      )}

      {programmes && programmes.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${libraryGridColumns(layout.bp)}, 1fr)`, gap: 12 }}>
          {programmes.map((p) => (
            <div
              key={p.id}
              className="flex items-center"
              style={{
                background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 'var(--card-radius)',
                padding: 'var(--card-padding-md)', gap: 16,
              }}
            >
              <button
                onClick={() => onRun(p.id)}
                className="flex items-center flex-1"
                style={{ gap: 16, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}
              >
                <div style={{
                  width: 44, height: 44, borderRadius: 'var(--radius-lg)', flexShrink: 0,
                  background: 'var(--color-bg-inverse)', color: 'var(--color-text-inverse)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 'var(--text-md)',
                }}>
                  {p.blockCount * 5 /* rough est. minutes placeholder until real duration calc lands */}
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--text-md)', color: 'var(--color-text-primary)' }}>
                    {p.name}
                  </div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', display: 'flex', gap: 6, alignItems: 'center' }}>
                    <span style={{ color: 'var(--color-action-primary)', fontFamily: 'var(--font-display)', fontWeight: 700, letterSpacing: 'var(--tracking-label)' }}>
                      {p.type}
                    </span>
                    <span>&middot; {p.blockCount} block{p.blockCount === 1 ? '' : 's'} &middot; {timeAgo(p.updatedAt)}</span>
                  </div>
                </div>
              </button>

              <button
                onClick={() => onEdit(p.id)}
                aria-label={`Edit ${p.name}`}
                style={{
                  minWidth: 44, minHeight: 44, background: 'var(--color-action-secondary)', color: 'var(--color-action-secondary-text)',
                  border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontFamily: 'var(--font-display)',
                  fontWeight: 700, fontSize: 'var(--text-xs)',
                }}
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(p.id, p.name)}
                aria-label={`Delete ${p.name}`}
                style={{
                  minWidth: 44, minHeight: 44, background: 'transparent', color: 'var(--color-action-danger)',
                  border: '1px solid var(--color-action-danger)', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                  fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--text-xs)',
                }}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
