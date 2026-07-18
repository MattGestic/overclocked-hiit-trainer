import { useEffect, useState } from 'react'
import { useTheme } from './shared-ui'
import { supabase } from './lib/supabaseClient'
import Login from './components/Login'

export default function App() {
  const { dark, toggleTheme } = useTheme()
  const [session, setSession] = useState(undefined) // undefined = still checking

  useEffect(() => {
    if (!supabase) return

    supabase.auth.getSession().then(({ data }) => setSession(data.session))

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })

    return () => subscription.subscription.unsubscribe()
  }, [])

  if (!supabase) {
    return (
      <div style={{ maxWidth: 512, margin: '0 auto', padding: '40px 20px', color: 'var(--color-error-text)' }}>
        Supabase is not configured — copy .env.example to .env and fill in your project credentials.
      </div>
    )
  }

  if (session === undefined) {
    return null // brief session check, nothing worth rendering yet
  }

  if (!session) {
    return <Login />
  }

  return (
    <div style={{
      maxWidth: 512, margin: '0 auto', padding: '40px 20px',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24,
    }}>
      <h1 style={{
        fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 28,
        letterSpacing: '0.06em', color: 'var(--color-text-primary)',
      }}>
        OVER&bull;CLOCK
      </h1>

      <p style={{ color: 'var(--color-text-muted)', textAlign: 'center' }}>
        Signed in as {session.user.email} — Library screen coming next.
      </p>

      <div style={{ display: 'flex', gap: 12 }}>
        <button
          onClick={toggleTheme}
          style={{
            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12,
            letterSpacing: '0.12em', padding: '12px 24px', borderRadius: 12,
            background: 'var(--color-action-secondary)', color: 'var(--color-action-secondary-text)',
            border: 'none', cursor: 'pointer',
          }}
        >
          {dark ? 'LIGHT MODE' : 'DARK MODE'}
        </button>

        <button
          onClick={() => supabase.auth.signOut()}
          style={{
            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12,
            letterSpacing: '0.12em', padding: '12px 24px', borderRadius: 12,
            background: 'var(--color-action-danger)', color: 'var(--color-action-danger-text)',
            border: 'none', cursor: 'pointer',
          }}
        >
          SIGN OUT
        </button>
      </div>
    </div>
  )
}
