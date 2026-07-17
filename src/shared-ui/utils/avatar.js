export const AVATAR_COLORS = [
  { bg: '#E0C2B2', fg: '#3A2418' },
  { bg: '#C3CEDD', fg: '#1A2738' },
  { bg: '#CFD8BE', fg: '#2A3318' },
  { bg: '#D8C7A8', fg: '#2C2410' },
  { bg: '#BFD3C6', fg: '#16302A' },
  { bg: '#D6C6DA', fg: '#2C1E33' },
]

export function avatarColor(id) {
  let h = 0
  for (let i = 0; i < (id || '').length; i++) h = (h * 31 + id.charCodeAt(i)) | 0
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length]
}

export function initials(name) {
  const parts = (name || 'U').split(/[\s@]/).filter(Boolean)
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || (parts[0]?.[1] || ''))).toUpperCase()
}
