import { useMemo } from 'react'
import { pinnedRow, monoCounter, primaryBtn, backBtn, scrollArea } from './styles'
import { IconChevronLeft } from './icons'

export default function AssignStep({ shortlist, onAssign, onBack, onNext }) {
  const maxBlock = useMemo(
    () => shortlist.reduce((max, i) => (i.block != null && i.block > max ? i.block : max), 0),
    [shortlist]
  )
  const assignedCount = shortlist.filter((i) => i.block != null).length

  function handleSelectChange(itemId, value) {
    onAssign(itemId, value === '' ? null : Number(value))
  }

  return (
    <>
      <div style={pinnedRow}>
        <button onClick={onBack} aria-label="Back" style={backBtn}><IconChevronLeft /></button>
        <span style={{ ...monoCounter, flex: 1, textAlign: 'center' }}>{assignedCount} of {shortlist.length} assigned</span>
        <button onClick={onNext} style={primaryBtn}>Preview</button>
      </div>

      <div style={scrollArea}>
        {shortlist.map((item) => (
          <div
            key={item.id}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
              background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 'var(--card-radius)',
              padding: '12px 14px', marginBottom: 8, opacity: item.block != null ? 0.55 : 1,
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text-primary)' }}>{item.name}</div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{item.group}</div>
            </div>

            {item.block == null ? (
              <select
                value=""
                onChange={(e) => handleSelectChange(item.id, e.target.value)}
                style={{
                  height: 36, padding: '0 8px', borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-input-border)', background: 'var(--color-input-bg)',
                  color: 'var(--color-input-text)', fontSize: 'var(--text-xs)', flexShrink: 0,
                }}
              >
                <option value="" disabled>Block ▾</option>
                {Array.from({ length: maxBlock }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>Block {n}</option>
                ))}
                <option value={maxBlock + 1}>+ New Block {maxBlock + 1}</option>
              </select>
            ) : (
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                <span style={{
                  height: 28, padding: '0 12px', borderRadius: 'var(--radius-chip)',
                  background: 'var(--color-timer-work)', color: '#ffffff',
                  fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 11,
                  display: 'flex', alignItems: 'center',
                }}>
                  Block {item.block}
                </span>
                <button
                  onClick={() => onAssign(item.id, null)}
                  aria-label={`Unassign ${item.name}`}
                  style={{
                    width: 22, height: 22, borderRadius: '50%', border: 'none', cursor: 'pointer',
                    background: 'var(--color-action-secondary)', color: 'var(--color-action-secondary-text)',
                    fontSize: 12, lineHeight: 1,
                  }}
                >
                  &times;
                </button>
              </span>
            )}
          </div>
        ))}
      </div>
    </>
  )
}
