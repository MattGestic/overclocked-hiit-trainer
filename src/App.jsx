import { useEffect, useState } from 'react'
import { useTheme, useToast } from './shared-ui'
import { supabase } from './lib/supabaseClient'
import Login from './components/Login'
import Library from './components/Library'
import ProgrammeEditor from './components/ProgrammeEditor'

export default function App() {
  const { dark, toggleTheme } = useTheme()
  const toast = useToast()
  const [session, setSession] = useState(undefined) // undefined = still checking
  const [view, setView] = useState({ screen: 'library' })

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
    <>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, maxWidth: 'var(--shell-max-mobile)',
        height: 'var(--header-h)', boxSizing: 'border-box', margin: '0 auto', padding: '0 var(--shell-px-mobile)',
      }}>
        <button onClick={toggleTheme} style={topBarBtn}>{dark ? 'LIGHT' : 'DARK'}</button>
        <button onClick={() => supabase.auth.signOut()} style={topBarBtn}>SIGN OUT</button>
      </div>

      {view.screen === 'library' && (
        <Library
          onNew={() => setView({ screen: 'editor', programmeId: null })}
          onEdit={(id) => setView({ screen: 'editor', programmeId: id })}
          onRun={() => toast?.('The workout runner is coming in a later build step.', 'success')}
        />
      )}

      {view.screen === 'editor' && (
        <ProgrammeEditor
          programmeId={view.programmeId}
          onSaved={() => setView({ screen: 'library' })}
          onCancel={() => setView({ screen: 'library' })}
        />
      )}
    </>
  )
}

const topBarBtn = {
  fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 10,
  letterSpacing: '0.1em', padding: '8px 14px', borderRadius: 10,
  background: 'var(--color-action-secondary)', color: 'var(--color-action-secondary-text)',
  border: 'none', cursor: 'pointer',
}
