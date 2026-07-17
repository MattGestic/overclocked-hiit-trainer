export function fmtReps(n) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n)
}

export function timeAgo(dateStr) {
  const s = Math.floor((Date.now() - new Date(dateStr)) / 1000)
  if (s < 60) return 'now'
  if (s < 3600) return `${Math.floor(s / 60)}m`
  if (s < 86400) return `${Math.floor(s / 3600)}h`
  return `${Math.floor(s / 86400)}d`
}

export function ordinal(n) {
  if (n === 1) return '1st'
  if (n === 2) return '2nd'
  if (n === 3) return '3rd'
  return `${n}th`
}
