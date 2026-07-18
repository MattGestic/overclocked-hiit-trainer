import { useState } from 'react'
import { useTheme, useToast } from '../shared-ui'
import { supabase } from '../lib/supabaseClient'

const PALETTE_SWATCHES = [
  { label: 'Lime', color: 'var(--color-brand-lime)' },
  { label: 'Navy', color: 'var(--color-bg-inverse)' },
  { label: 'Orange', color: 'var(--color-brand-orange)' },
]

export default function Settings({ session, onBack }) {
  const { dark, toggleTheme, compact, toggleDensity } = useTheme()
  const toast = useToast()
  const [name, setName] = useState(session?.user?.user_metadata?.display_name || '')
  const [saving, setSaving] = useState(false)

  async function handleSaveName() {
    setSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({ data: { display_name: name } })
      if (error) throw error
      toast?.('Saved', 'success')
    } catch (err) {
      toast?.(err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={s.page}>
      <div style={s.header}>
        <button onClick={onBack} style={s.backBtn} aria-label="Back">&larr;</button>
        <h1 style={s.title}>Settings</h1>
      </div>

      <section style={s.section}>
        <label style={s.label} htmlFor="settings-name">Name</label>
        <div style={{ display: 'flex', gap: 8 }}>
          <input id="settings-name" value={name} onChange={(e) => setName(e.target.value)} style={s.input} />
          <button onClick={handleSaveName} disabled={saving} style={s.primaryBtn}>{saving ? 'Saving…' : 'Save'}</button>
        </div>
      </section>

      <section style={s.section}>
        <span style={s.label}>Theme</span>
        <div style={s.row}>
          <button onClick={toggleTheme} style={dark ? s.optionActive : s.option}>Dark</button>
          <button onClick={toggleTheme} style={!dark ? s.optionActive : s.option}>Light</button>
        </div>
      </section>

      <section style={s.section}>
        <span style={s.label}>Density</span>
        <div style={s.row}>
          <button onClick={toggleDensity} style={!compact ? s.optionActive : s.option}>Comfortable</button>
          <button onClick={toggleDensity} style={compact ? s.optionActive : s.option}>Compact</button>
        </div>
      </section>

      <section style={s.section}>
        <span style={s.label}>Colour Palette</span>
        <div style={s.row}>
          {PALETTE_SWATCHES.map((p, i) => (
            <div key={p.label} style={{ ...s.swatch, ...(i === 0 ? s.swatchActive : {}) }}>
              <span style={{ width: 20, height: 20, borderRadius: '50%', background: p.color, display: 'block', marginBottom: 4 }} />
              {p.label}
            </div>
          ))}
        </div>
        <p style={s.note}>More palettes are coming later — Lime is the only complete one for now.</p>
      </section>

      <section style={s.section}>
        <span style={s.label}>Font</span>
        <div style={s.row}>
          <div style={{ ...s.swatch, ...s.swatchActive }}>Oswald / Inter</div>
        </div>
        <p style={s.note}>The only font pairing available for now.</p>
      </section>

      <section style={s.section}>
        <button
          onClick={() => supabase.auth.signOut()}
          style={{ ...s.option, color: 'var(--color-action-danger)', width: '100%' }}
        >
          Sign Out
        </button>
      </section>
    </div>
  )
}

const s = {
  page: { maxWidth: 'var(--shell-max-mobile)', margin: '0 auto', padding: '24px var(--shell-px-mobile) 96px' },
  header: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 },
  backBtn: {
    minWidth: 40, minHeight: 40, background: 'var(--color-action-secondary)', color: 'var(--color-action-secondary-text)',
    border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: 18,
  },
  title: { margin: 0, fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--text-xl)', color: 'var(--color-text-primary)' },
  primaryBtn: {
    height: 'var(--input-h-md)', padding: '0 18px', background: 'var(--color-action-primary)', color: 'var(--color-action-primary-text)',
    fontFamily: 'var(--btn-font)', fontWeight: 700, fontSize: 'var(--text-sm)', border: 'none',
    borderRadius: 'var(--btn-radius)', cursor: 'pointer', whiteSpace: 'nowrap',
  },
  section: { marginBottom: 28 },
  label: {
    display: 'block', marginBottom: 10, fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--text-xs)',
    letterSpacing: 'var(--tracking-label)', textTransform: 'uppercase', color: 'var(--color-text-muted)',
  },
  input: {
    flex: 1, height: 'var(--input-h-md)', padding: '0 var(--space-3)', background: 'var(--color-input-bg)',
    border: '1px solid var(--color-input-border)', borderRadius: 'var(--radius-input)', color: 'var(--color-input-text)',
    fontSize: 'var(--text-sm)', fontFamily: 'var(--font-body)',
  },
  row: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  option: {
    height: 40, padding: '0 16px', background: 'var(--color-action-secondary)', color: 'var(--color-action-secondary-text)',
    border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12,
  },
  optionActive: {
    height: 40, padding: '0 16px', background: 'var(--color-action-primary)', color: 'var(--color-action-primary-text)',
    border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12,
  },
  swatch: {
    padding: '10px 14px', border: '1px solid var(--card-border)', borderRadius: 'var(--radius-md)',
    fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 11, color: 'var(--color-text-secondary)', textAlign: 'center',
  },
  swatchActive: { border: '1px solid var(--color-action-primary)', color: 'var(--color-text-primary)' },
  note: { marginTop: 8, fontSize: 'var(--text-xs)', color: 'var(--color-text-subtle)' },
}
