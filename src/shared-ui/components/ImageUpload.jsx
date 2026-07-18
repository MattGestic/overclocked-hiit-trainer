import { useRef, useState } from 'react'

const MAX_SIZE_MB = 2
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

function cropToSquare(file) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const size = Math.min(img.width, img.height)
      const canvas = document.createElement('canvas')
      canvas.width = 256
      canvas.height = 256
      const ctx = canvas.getContext('2d')
      const sx = (img.width - size) / 2
      const sy = (img.height - size) / 2
      ctx.drawImage(img, sx, sy, size, size, 0, 0, 256, 256)
      canvas.toBlob(resolve, 'image/webp', 0.85)
    }
    img.src = URL.createObjectURL(file)
  })
}

export default function ImageUpload({ currentUrl, onUpload, shape = 'circle', size = 96, label = 'UPLOAD PHOTO' }) {
  const inputRef = useRef(null)
  const [preview, setPreview] = useState(null)
  const [pendingBlob, setPendingBlob] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)

  async function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    e.target.value = ''

    if (!ALLOWED_TYPES.includes(file.type)) { setError('Use JPG, PNG, or WebP'); return }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) { setError(`Max ${MAX_SIZE_MB}MB`); return }

    const cropped = shape === 'circle' ? await cropToSquare(file) : file
    setPreview(URL.createObjectURL(cropped))
    setPendingBlob(cropped)
  }

  async function confirmUpload() {
    if (!pendingBlob) return
    setUploading(true)
    try {
      await onUpload(pendingBlob)
    } catch {
      setError('Upload failed')
    }
    setPendingBlob(null)
    setUploading(false)
  }

  function cancelCrop() {
    setPreview(null)
    setPendingBlob(null)
  }

  const displayUrl = preview || currentUrl
  const borderRadius = shape === 'circle' ? '50%' : 16
  const hasPending = !!pendingBlob

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={() => !hasPending && inputRef.current?.click()}
        disabled={uploading}
        style={{
          position: 'relative', width: size, height: size, borderRadius, overflow: 'hidden',
          border: displayUrl ? (hasPending ? '2px solid var(--color-action-primary)' : 'none') : '2px dashed var(--color-border-default)',
          background: displayUrl ? 'transparent' : 'var(--color-bg-surface)',
          cursor: uploading ? 'wait' : 'pointer',
        }}
      >
        {displayUrl ? (
          <img src={displayUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div className="flex flex-col items-center justify-center h-full" style={{ color: 'var(--color-text-muted)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </div>
        )}
        {uploading && (
          <div style={{
            position: 'absolute', inset: 0, background: 'rgba(0,0,0,.5)', borderRadius,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{ width: 24, height: 24, border: '3px solid rgba(255,255,255,.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          </div>
        )}
      </button>

      {hasPending && !uploading ? (
        <div className="flex items-center gap-2">
          <button
            onClick={confirmUpload}
            style={{
              fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 10, letterSpacing: '0.1em',
              color: 'var(--color-text-on-lime)', background: 'var(--color-action-primary)',
              border: 'none', borderRadius: 8, padding: '6px 12px', cursor: 'pointer',
            }}
          >
            SAVE
          </button>
          <button
            onClick={cancelCrop}
            style={{
              fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 10, letterSpacing: '0.1em',
              color: 'var(--color-text-muted)', background: 'none', border: 'none', cursor: 'pointer',
            }}
          >
            CANCEL
          </button>
        </div>
      ) : !uploading && (
        <button
          onClick={() => inputRef.current?.click()}
          style={{
            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 10, letterSpacing: '0.14em',
            color: 'var(--color-action-primary)', background: 'none', border: 'none', cursor: 'pointer',
          }}
        >
          {displayUrl ? 'CHANGE' : label}
        </button>
      )}

      {uploading && (
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 10, letterSpacing: '0.14em', color: 'var(--color-text-muted)' }}>
          UPLOADING...
        </span>
      )}

      {error && <div style={{ fontSize: 11, color: 'var(--color-status-error-text)', fontWeight: 600 }}>{error}</div>}

      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFile} style={{ display: 'none' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
