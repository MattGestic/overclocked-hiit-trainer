import { createContext, useContext, useState, useCallback } from 'react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const show = useCallback((message, type = 'error') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000)
  }, [])

  return (
    <ToastContext.Provider value={show}>
      {children}
      {/* Sits above the bottom nav, not over header controls — a full-width
          top banner previously covered Settings/Edit/Start/back buttons on
          every screen (see WI-0009). */}
      <div style={{
        position: 'fixed', bottom: 'calc(var(--bottom-nav-h) + 16px)', left: 0, right: 0,
        zIndex: 'var(--z-toast)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
        padding: '0 var(--shell-px-mobile)', pointerEvents: 'none',
      }}>
        {toasts.map(t => (
          <div
            key={t.id}
            style={{
              maxWidth: 420, width: '100%', padding: '13px 16px', borderRadius: 'var(--radius-lg)',
              display: 'flex', alignItems: 'center', gap: 10,
              background: 'var(--color-bg-inverse)', color: 'var(--color-text-inverse)',
              border: '1px solid var(--color-border-inverse)', boxShadow: 'var(--shadow-lg)',
              pointerEvents: 'auto', animation: 'toast-in 0.2s ease',
            }}
          >
            <span style={{
              width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
              background: t.type === 'error' ? 'var(--color-error-icon)' : 'var(--color-timer-work)',
            }} />
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, letterSpacing: '0.02em' }}>
              {t.message}
            </span>
          </div>
        ))}
      </div>
      <style>{`@keyframes toast-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
