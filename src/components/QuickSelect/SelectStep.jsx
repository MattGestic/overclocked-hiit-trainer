import { useMemo, useState } from 'react'
import { EXERCISE_CATALOG, EXERCISE_CATEGORIES } from '../../lib/exerciseCatalog'
import {
  pinnedRow, monoCounter, primaryBtn, primaryBtnDisabled, scrollArea,
  groupHeader, chip, searchInput, cardRow, emptyState,
} from './styles'
import { IconSearch, IconCheck } from './icons'

export default function SelectStep({ shortlist, onToggle, onDone }) {
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState(null)

  const selectedIds = useMemo(() => new Set(shortlist.map((i) => i.id)), [shortlist])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return EXERCISE_CATALOG.filter((ex) => {
      if (activeCategory && ex.category !== activeCategory) return false
      if (q && !ex.name.toLowerCase().includes(q)) return false
      return true
    })
  }, [search, activeCategory])

  const groups = useMemo(() => {
    return EXERCISE_CATEGORIES
      .map((category) => ({ category, items: filtered.filter((ex) => ex.category === category) }))
      .filter((g) => g.items.length > 0)
  }, [filtered])

  return (
    <>
      <div style={pinnedRow}>
        <span style={monoCounter}>{shortlist.length} selected</span>
        <button
          onClick={onDone}
          disabled={shortlist.length === 0}
          style={shortlist.length === 0 ? primaryBtnDisabled : primaryBtn}
        >
          Done — Review Shortlist
        </button>
      </div>

      <div style={scrollArea}>
        <div style={{ position: 'relative', marginBottom: 12 }}>
          <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-subtle)', pointerEvents: 'none' }}>
            <IconSearch />
          </span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search exercises…"
            style={searchInput}
          />
        </div>

        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, marginBottom: 4 }}>
          {EXERCISE_CATEGORIES.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory((c) => (c === category ? null : category))}
              style={chip(activeCategory === category)}
            >
              {category}
            </button>
          ))}
        </div>

        {groups.length === 0 && <div style={emptyState}>No exercises match.</div>}

        {groups.map(({ category, items }) => (
          <div key={category}>
            <div style={groupHeader}>{category}</div>
            {items.map((ex) => {
              const checked = selectedIds.has(ex.id)
              return (
                <button key={ex.id} onClick={() => onToggle(ex)} style={cardRow}>
                  <span
                    style={{
                      width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                      border: checked ? 'none' : '1px solid var(--color-border-strong)',
                      background: checked ? 'var(--color-timer-work)' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    {checked && <IconCheck size={12} color="#ffffff" />}
                  </span>
                  <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)' }}>{ex.name}</span>
                </button>
              )
            })}
          </div>
        ))}
      </div>
    </>
  )
}
