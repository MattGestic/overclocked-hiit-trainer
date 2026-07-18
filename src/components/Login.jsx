import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email || !password || submitting) return

    setSubmitting(true)
    setError(null)

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })

    if (signInError) {
      setError(signInError.message)
      setSubmitting(false)
    }
    // On success, the onAuthStateChange listener in App.jsx picks up the
    // new session — nothing else to do here.
  }

  return (
    <div style={styles.page}>
      <form style={styles.card} onSubmit={handleSubmit}>
        <h1 style={styles.title}>OVER&bull;CLOCK</h1>
        <p style={styles.subtitle}>Sign in to start the clock.</p>

        <label style={styles.label} htmlFor="login-email">Email</label>
        <input
          id="login-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={styles.input}
          disabled={submitting}
          required
        />

        <label style={styles.label} htmlFor="login-password">Password</label>
        <input
          id="login-password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={styles.input}
          disabled={submitting}
          required
        />

        {error && <p style={styles.error}>{error}</p>}

        <button type="submit" style={styles.submit} disabled={submitting}>
          {submitting ? 'Signing In…' : 'Sign In'}
        </button>
      </form>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100svh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 'var(--space-5)',
  },
  card: {
    width: '100%',
    maxWidth: 360,
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-3)',
    background: 'var(--card-bg)',
    border: '1px solid var(--card-border)',
    borderRadius: 'var(--card-radius)',
    boxShadow: 'var(--card-shadow)',
    padding: 'var(--card-padding-lg)',
  },
  title: {
    margin: 0,
    fontFamily: 'var(--font-display)',
    fontWeight: 'var(--weight-bold)',
    fontSize: 'var(--text-2xl)',
    letterSpacing: 'var(--tracking-wide)',
    color: 'var(--color-text-primary)',
    textAlign: 'center',
  },
  subtitle: {
    margin: '0 0 var(--space-2)',
    color: 'var(--color-text-muted)',
    fontSize: 'var(--text-sm)',
    textAlign: 'center',
  },
  label: {
    fontFamily: 'var(--font-display)',
    fontWeight: 'var(--weight-bold)',
    fontSize: 'var(--text-xs)',
    letterSpacing: 'var(--tracking-label)',
    textTransform: 'uppercase',
    color: 'var(--color-input-label)',
  },
  input: {
    height: 'var(--input-h-md)',
    padding: '0 var(--space-4)',
    background: 'var(--color-input-bg)',
    border: '1px solid var(--color-input-border)',
    borderRadius: 'var(--radius-input)',
    color: 'var(--color-input-text)',
    fontSize: 'var(--text-md)',
    fontFamily: 'var(--font-body)',
  },
  error: {
    margin: 0,
    padding: 'var(--space-2) var(--space-3)',
    background: 'var(--color-error-bg)',
    border: '1px solid var(--color-error-border)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--color-error-text)',
    fontSize: 'var(--text-sm)',
  },
  submit: {
    height: 'var(--btn-h-md)',
    marginTop: 'var(--space-2)',
    background: 'var(--color-action-primary)',
    color: 'var(--color-action-primary-text)',
    fontFamily: 'var(--btn-font)',
    fontWeight: 'var(--btn-weight)',
    letterSpacing: 'var(--btn-tracking)',
    fontSize: 'var(--text-sm)',
    textTransform: 'uppercase',
    border: 'none',
    borderRadius: 'var(--btn-radius)',
    cursor: 'pointer',
  },
}
