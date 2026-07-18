import { useEffect, useState } from 'react'
import { supabase } from './lib/supabaseClient'
import { useNavStack } from './hooks/useNavStack'
import Login from './components/Login'
import Library from './components/Library'
import ProgrammeEditor from './components/ProgrammeEditor'
import ActiveWorkout from './components/ActiveWorkout'
import Settings from './components/Settings'
import History from './components/History'

export default function App() {
  const [session, setSession] = useState(undefined) // undefined = still checking
  const { view, navigate, goBack } = useNavStack({ screen: 'library' })

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

  if (view.screen === 'library') {
    return (
      <Library
        onNew={() => navigate({ screen: 'editor', programmeId: null })}
        onEdit={(id) => navigate({ screen: 'editor', programmeId: id })}
        onRun={(id) => navigate({ screen: 'workout', programmeId: id })}
        onSettings={() => navigate({ screen: 'settings' })}
        onHistory={() => navigate({ screen: 'history' })}
      />
    )
  }

  if (view.screen === 'editor') {
    return (
      <ProgrammeEditor
        programmeId={view.programmeId}
        onSaved={goBack}
        onCancel={goBack}
      />
    )
  }

  if (view.screen === 'workout') {
    return (
      <ActiveWorkout
        programmeId={view.programmeId}
        onBack={goBack}
        onEdit={(id) => navigate({ screen: 'editor', programmeId: id })}
      />
    )
  }

  if (view.screen === 'settings') {
    return <Settings session={session} onBack={goBack} />
  }

  if (view.screen === 'history') {
    return <History onBack={goBack} />
  }

  return null
}
