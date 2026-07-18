import { useState } from 'react'
import { avatarColor, initials } from '../utils/avatar'

function InitialsFallback({ ac, size, name }) {
  return (
    <span style={{
      flexShrink: 0, width: size, height: size, borderRadius: '50%',
      background: ac.bg, color: ac.fg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 900, fontSize: size * 0.34,
    }}>
      {initials(name)}
    </span>
  )
}

export default function Avatar({ id, name, avatarUrl, size = 38, activeColor, highlight = false }) {
  const ac = highlight && activeColor ? { bg: activeColor, fg: 'var(--color-text-on-lime)' } : avatarColor(id)
  const [imgError, setImgError] = useState(false)

  if (avatarUrl && !imgError) {
    return (
      <img
        src={avatarUrl}
        alt={name || ''}
        onError={() => setImgError(true)}
        style={{
          width: size, height: size, borderRadius: '50%', objectFit: 'cover',
          flexShrink: 0,
        }}
      />
    )
  }

  return <InitialsFallback ac={ac} size={size} name={name} />
}
