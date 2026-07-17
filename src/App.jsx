import { useTheme } from './shared-ui'

export default function App() {
  const { dark, toggleTheme } = useTheme()

  return (
    <div style={{
      maxWidth: 512, margin: '0 auto', padding: '40px 20px',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24,
    }}>
      <h1 style={{
        fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 28,
        letterSpacing: '0.06em', color: 'var(--color-text-primary)',
      }}>
        OVERCLOCKED HIIT
      </h1>

      <p style={{ color: 'var(--color-text-muted)', textAlign: 'center' }}>
        Interval timer app — coming soon.
      </p>

      <button
        onClick={toggleTheme}
        style={{
          fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12,
          letterSpacing: '0.12em', padding: '12px 24px', borderRadius: 12,
          background: 'var(--color-action-primary)', color: 'var(--color-text-on-lime)',
          border: 'none', cursor: 'pointer',
        }}
      >
        {dark ? 'LIGHT MODE' : 'DARK MODE'}
      </button>
    </div>
  )
}
