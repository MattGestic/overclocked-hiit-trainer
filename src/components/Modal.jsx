// Reusable dialog shell — the app's first consumer of tokens.css's
// dialog/z-modal token set (--dialog-*, --z-modal*, --color-bg-scrim),
// which existed unused until now. Rendered inline with no portal, matching
// Toast.jsx's existing overlay convention (see shared-ui/components/Toast.jsx).
//
// `variant="dialog"` (default) is a centered card, capped at --dialog-max-md.
// `variant="fullBleed"` covers the whole viewport with its own scroll — used
// by Quick Select, which is a full workflow, not a small confirm/prompt.
export default function Modal({ open, onClose, variant = 'dialog', children, ariaLabel }) {
  if (!open) return null

  return (
    <div
      role="presentation"
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 'var(--z-modal-backdrop)',
        background: 'var(--color-bg-scrim)',
        display: 'flex',
        alignItems: variant === 'fullBleed' ? 'stretch' : 'center',
        justifyContent: 'center',
        padding: variant === 'fullBleed' ? 0 : 'var(--space-4)',
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        onClick={(e) => e.stopPropagation()}
        style={
          variant === 'fullBleed'
            ? {
                position: 'relative', zIndex: 'var(--z-modal)', width: '100%', height: '100dvh',
                background: 'var(--dialog-bg)', display: 'flex', flexDirection: 'column', overflow: 'hidden',
              }
            : {
                position: 'relative', zIndex: 'var(--z-modal)', width: '100%', maxWidth: 'var(--dialog-max-md)',
                maxHeight: '90dvh', overflowY: 'auto',
                background: 'var(--dialog-bg)', border: '1px solid var(--dialog-border)',
                borderRadius: 'var(--dialog-radius)', boxShadow: 'var(--dialog-shadow)',
                padding: 'var(--dialog-padding)',
              }
        }
      >
        {children}
      </div>
    </div>
  )
}
