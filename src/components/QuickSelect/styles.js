// Style objects shared across QuickSelectModal's three step components. All
// colour comes from this app's existing --color-*/--card-*/--btn-* tokens —
// Quick Select carries no colour values of its own (see docs/architecture.md's
// Quick Create section).

export const eyebrow = {
  fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 10,
  letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--color-text-muted)',
}

export const stepTitle = {
  fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 19,
  color: 'var(--color-text-primary)', textTransform: 'uppercase', margin: '2px 0 0',
}

export const closeBtn = {
  width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
  background: 'var(--color-action-secondary)', color: 'var(--color-action-secondary-text)',
  border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
}

export const backBtn = {
  width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
  background: 'transparent', color: 'var(--color-text-primary)',
  border: '1px solid var(--color-border-default)', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
}

export const pinnedRow = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
  padding: '14px var(--shell-px-mobile)',
  borderBottom: '1px solid var(--color-border-default)',
  flexShrink: 0,
}

export const monoCounter = {
  fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', fontWeight: 600,
  color: 'var(--color-text-secondary)',
}

export const primaryBtn = {
  height: 'var(--btn-h-md)', padding: '0 20px', background: 'var(--color-action-primary)',
  color: 'var(--color-action-primary-text)', fontFamily: 'var(--btn-font)', fontWeight: 'var(--btn-weight)',
  letterSpacing: 'var(--btn-tracking)', fontSize: 'var(--text-sm)', textTransform: 'uppercase',
  border: 'none', borderRadius: 'var(--btn-radius)', cursor: 'pointer', whiteSpace: 'nowrap',
}

export const primaryBtnDisabled = {
  ...primaryBtn, opacity: 'var(--opacity-disabled)', cursor: 'not-allowed',
}

export const ghostBtn = {
  height: 'var(--btn-h-sm)', padding: '0 16px', background: 'transparent',
  color: 'var(--color-text-secondary)', border: '1px solid var(--color-border-default)',
  borderRadius: 'var(--btn-radius)', cursor: 'pointer',
  fontFamily: 'var(--btn-font)', fontWeight: 'var(--btn-weight)', fontSize: 'var(--text-xs)',
  textTransform: 'uppercase',
}

export const scrollArea = {
  flex: 1, minHeight: 0, overflowY: 'auto',
  padding: '16px var(--shell-px-mobile) 32px',
}

export const groupHeader = {
  fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 11,
  letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--color-text-muted)',
  margin: '18px 0 8px',
}

export const chip = (active) => ({
  flexShrink: 0, height: 32, padding: '0 14px', borderRadius: 'var(--radius-chip)',
  border: 'none', cursor: 'pointer',
  fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12, letterSpacing: '0.04em',
  background: active ? 'var(--color-bg-inverse)' : 'var(--color-bg-surface-subtle)',
  color: active ? 'var(--color-text-inverse)' : 'var(--color-text-muted)',
})

export const searchInput = {
  height: 'var(--input-h-md)', width: '100%', padding: '0 var(--space-3) 0 40px',
  background: 'var(--color-input-bg)', border: '1px solid var(--color-input-border)',
  borderRadius: 'var(--radius-input)', color: 'var(--color-input-text)',
  fontSize: 'var(--text-sm)', fontFamily: 'var(--font-body)',
}

export const cardRow = {
  display: 'flex', alignItems: 'center', gap: 12,
  width: '100%', textAlign: 'left', background: 'var(--card-bg)',
  border: '1px solid var(--card-border)', borderRadius: 'var(--card-radius)',
  padding: '12px 14px', cursor: 'pointer', marginBottom: 8,
}

export const emptyState = {
  textAlign: 'center', color: 'var(--color-text-muted)', padding: '48px 0', fontSize: 'var(--text-sm)',
}
