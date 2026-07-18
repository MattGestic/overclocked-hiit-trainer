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
      <div style={{ position: 'fixed', top: 56, left: 0, right: 0, zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, pointerEvents: 'none' }}>
        {toasts.map(t => (
          <div
            key={t.id}
            style={{
              maxWidth: 400, width: '90%', padding: '12px 16px', borderRadius: 14,
              fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, letterSpacing: '0.04em',
              pointerEvents: 'auto', animation: 'toast-in 0.3s ease',
              ...(t.type === 'error'
                ? { background: 'var(--color-error-bg)', border: '1px solid var(--color-error-border)', color: 'var(--color-error-text)' }
                : { background: 'var(--color-success-bg)', border: '1px solid var(--color-success-border)', color: 'var(--color-success-text)' }),
            }}
          >
            {t.message}
          </div>
        ))}
      </div>
      <style>{`@keyframes toast-in { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
