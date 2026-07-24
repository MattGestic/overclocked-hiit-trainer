import { useMemo } from 'react'
import {
  pinnedRow, primaryBtn, backBtn, scrollArea, groupHeader, emptyState,
} from './styles'
import { IconChevronLeft, IconDragHandle } from './icons'
import { IconClose } from '../icons'

export default function PreviewStep({ shortlist, onRemove, onUnassign, onMove, onBack, onGenerate }) {
  const blocks = useMemo(() => {
    const nums = [...new Set(shortlist.filter((i) => i.block != null).map((i) => i.block))].sort((a, b) => a - b)
    return nums.map((n) => ({ number: n, items: shortlist.filter((i) => i.block === n) }))
  }, [shortlist])

  const unassigned = useMemo(() => shortlist.filter((i) => i.block == null), [shortlist])

  // Single tap generates. If anything's unassigned, that tap is gated by a
  // native confirm() (same pattern already used for Stop-workout and
  // Delete-programme) instead of a second tap on a relabelled button —
  // clearer as a real confirmation step, not just "tap twice."
  function handlePrimaryClick() {
    if (unassigned.length > 0) {
      const n = unassigned.length
      const ok = window.confirm(`${n} exercise${n === 1 ? '' : 's'} unassigned — will be excluded. Generate anyway?`)
      if (!ok) return
    }
    onGenerate()
  }

  function handleDragStart(e, itemId) {
    e.dataTransfer.setData('text/plain', itemId)
    e.dataTransfer.effectAllowed = 'move'
  }

  function handleDragOver(e) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  function handleDrop(e, targetBlock, targetIndex) {
    e.preventDefault()
    const itemId = e.dataTransfer.getData('text/plain')
    if (itemId) onMove(itemId, targetBlock, targetIndex)
  }

  const nothingYet = shortlist.length === 0

  return (
    <>
      <div style={pinnedRow}>
        <button onClick={onBack} aria-label="Back" style={backBtn}><IconChevronLeft /></button>
        <button onClick={handlePrimaryClick} disabled={nothingYet} style={{ ...primaryBtn, flex: 1, opacity: nothingYet ? 'var(--opacity-disabled)' : 1 }}>
          Generate Programme
        </button>
      </div>

      <div style={scrollArea}>
        {nothingYet && <div style={emptyState}>Nothing in the shortlist yet.</div>}

        {!nothingYet && unassigned.length > 0 && (
          <div style={{
            border: '1px dashed var(--color-action-danger)', borderRadius: 'var(--radius-md)',
            padding: 'var(--space-3)', marginBottom: 16, color: 'var(--color-error-text)', fontSize: 'var(--text-xs)', fontWeight: 600,
          }}>
            {unassigned.length} exercise{unassigned.length === 1 ? '' : 's'} unassigned — will be excluded.
          </div>
        )}

        {blocks.map(({ number, items }) => (
          <div key={number} style={{ marginBottom: 20 }}>
            <div style={groupHeader}>Block {number}</div>
            <div
              style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 'var(--card-radius)', padding: 8 }}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, number, items.length)}
            >
              {items.map((item, idx) => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, item.id)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => {
                    e.stopPropagation()
                    handleDrop(e, number, idx)
                  }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 6px',
                    borderBottom: idx < items.length - 1 ? '1px solid var(--color-border-subtle)' : 'none',
                  }}
                >
                  <span style={{ color: 'var(--color-text-subtle)', cursor: 'grab', flexShrink: 0 }}>
                    <IconDragHandle />
                  </span>
                  <span style={{ flex: 1, fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)' }}>{item.name}</span>
                  <button
                    onClick={() => onUnassign(item.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}
                  >
                    Unassign
                  </button>
                  <button
                    onClick={() => onRemove(item.id)}
                    aria-label={`Remove ${item.name}`}
                    style={{
                      width: 22, height: 22, borderRadius: '50%', border: 'none', cursor: 'pointer', flexShrink: 0,
                      background: 'var(--color-action-secondary)', color: 'var(--color-action-secondary-text)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <IconClose size={11} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}

        {unassigned.length > 0 && (
          <div style={{ opacity: 0.7 }}>
            <div style={groupHeader}>Unassigned</div>
            {unassigned.map((item) => (
              <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 6px' }}>
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)' }}>{item.name}</span>
                <button
                  onClick={() => onRemove(item.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-action-danger)', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 11 }}
                >
                  &#10005; remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
