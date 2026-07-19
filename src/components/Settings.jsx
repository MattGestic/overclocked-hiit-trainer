import { useState } from 'react'
import { useTheme, useToast } from '../shared-ui'
import { supabase } from '../lib/supabaseClient'

// Preview hex values mirror what src/shared-ui/theme/tokens.css actually
// defines for each [data-theme="light"][data-palette] override — this is
// the one place that duplication is unavoidable, since a swatch has to
// show a palette's colour without switching the whole app to it first.
const PALETTES = [
  { id: 'cream', label: 'Cream', bg: '#faf3e3' },
  { id: 'paper', label: 'Paper', bg: '#f5f0df' },
  { id: 'steel', label: 'Steel', bg: '#eef1f4' },
]

const FONTS = [
  { id: 'barlow', label: 'Barlow Condensed', family: 'var(--font-display-barlow)' },
  { id: 'bebas', label: 'Bebas Neue', family: 'var(--font-display-bebas)' },
  { id: 'oswald', label: 'Oswald', family: 'var(--font-display-oswald)' },
  { id: 'anton', label: 'Anton', family: 'var(--font-display-anton)' },
]

const DENSITIES = [
  { id: 'compact', label: 'Compact' },
  { id: 'regular', label: 'Regular' },
  { id: 'comfy', label: 'Comfy' },
]

export default function Settings({ session, onBack }) {
  const { dark, toggleTheme, density, setDensity, palette, setPalette, font, setFont } = useTheme()
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

      <div style={s.sectionLabel}>Profile</div>
      <section style={s.card}>
        <span style={s.fieldLabel}>Your Name</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <input id="settings-name" value={name} onChange={(e) => setName(e.target.value)} style={s.input} />
          <button onClick={handleSaveName} disabled={saving} style={s.primaryBtn}>{saving ? 'Saving…' : 'Save'}</button>
        </div>
      </section>

      <div style={s.sectionLabel}>Appearance</div>
      <section style={{ ...s.card, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <span style={s.fieldLabel}>Theme</span>
          <div style={s.row}>
            <button onClick={toggleTheme} style={dark ? s.optionActive : s.option}>Dark</button>
            <button onClick={toggleTheme} style={!dark ? s.optionActive : s.option}>Light</button>
          </div>
        </div>

        <div>
          <span style={s.fieldLabel}>Colour Palette</span>
          <div style={s.row}>
            {PALETTES.map((p) => (
              <button
                key={p.id}
                onClick={() => setPalette(p.id)}
                style={{ ...s.swatch, ...(palette === p.id ? s.swatchActive : {}) }}
              >
                <span style={{ ...s.swatchDot, background: p.bg, border: '1px solid var(--color-border-default)' }} />
                {p.label}
              </button>
            ))}
          </div>
          {!dark && <p style={s.note}>Only affects the light theme.</p>}
        </div>

        <div>
          <span style={s.fieldLabel}>Display Font</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {FONTS.map((f) => (
              <button
                key={f.id}
                onClick={() => setFont(f.id)}
                style={{ ...s.fontRow, ...(font === f.id ? s.fontRowActive : {}) }}
              >
                <span style={{ fontFamily: f.family, fontWeight: 700, fontSize: 'var(--text-lg)', textTransform: 'uppercase' }}>
                  OverClock
                </span>
                <span style={s.fontRowLabel}>{f.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <span style={s.fieldLabel}>Layout Density</span>
          <div style={s.row}>
            {DENSITIES.map((d) => (
              <button
                key={d.id}
                onClick={() => setDensity(d.id)}
                style={density === d.id ? s.optionActive : s.option}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div style={s.sectionLabel}>Defaults</div>
      <section style={s.card}>
        <p style={s.note}>
          Default work/rest intervals are set per programme in the Programme Editor
          (open any programme and adjust its blocks).
        </p>
      </section>

      <div style={s.sectionLabel}>About</div>
      <section style={s.card}>
        <div style={s.aboutRow}>
          <span style={s.aboutKey}>App</span>
          <span style={s.aboutValue}>OVER&bull;CLOCK</span>
        </div>
        <div style={s.aboutRow}>
          <span style={s.aboutKey}>Signed in as</span>
          <span style={s.aboutValue}>{session?.user?.email}</span>
        </div>
      </section>

      <button
        onClick={() => supabase.auth.signOut()}
        style={{ ...s.option, color: 'var(--color-action-danger)', width: '100%', marginTop: 8 }}
      >
        Sign Out
      </button>
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
  sectionLabel: {
    fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--text-xs)', letterSpacing: 'var(--tracking-label)',
    textTransform: 'uppercase', color: 'var(--color-text-muted)', margin: '20px 0 10px',
  },
  card: {
    background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 'var(--card-radius)',
    padding: 'var(--card-padding-md)',
  },
  fieldLabel: {
    display: 'block', marginBottom: 10, fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--text-xs)',
    letterSpacing: 'var(--tracking-label)', textTransform: 'uppercase', color: 'var(--color-text-muted)',
  },
  primaryBtn: {
    height: 'var(--input-h-md)', padding: '0 18px', background: 'var(--color-action-primary)', color: 'var(--color-action-primary-text)',
    fontFamily: 'var(--btn-font)', fontWeight: 700, fontSize: 'var(--text-sm)', border: 'none',
    borderRadius: 'var(--btn-radius)', cursor: 'pointer', whiteSpace: 'nowrap',
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
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '10px 14px',
    border: '1px solid var(--card-border)', borderRadius: 'var(--radius-md)', background: 'none',
    fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 11, color: 'var(--color-text-secondary)', cursor: 'pointer',
  },
  swatchActive: { border: '1px solid var(--color-action-primary)', color: 'var(--color-text-primary)' },
  swatchDot: { width: 20, height: 20, borderRadius: '50%', display: 'block' },
  fontRow: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 44, padding: '0 14px',
    border: '1px solid var(--card-border)', borderRadius: 'var(--radius-md)', background: 'var(--color-bg-surface-subtle)',
    color: 'var(--color-text-primary)', cursor: 'pointer',
  },
  fontRowActive: { background: 'var(--color-bg-inverse)', color: 'var(--color-text-inverse)', borderColor: 'var(--color-bg-inverse)' },
  fontRowLabel: { fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', opacity: 0.7 },
  note: { marginTop: 8, fontSize: 'var(--text-xs)', color: 'var(--color-text-subtle)' },
  aboutRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0',
    borderBottom: '1px solid var(--card-border)', fontSize: 'var(--text-sm)',
  },
  aboutKey: { color: 'var(--color-text-muted)' },
  aboutValue: { fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--color-text-primary)' },
}
