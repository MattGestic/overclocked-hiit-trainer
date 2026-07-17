export default function DayDots({ startDate, durationDays, dailyReps = {}, label, activeColor = 'var(--color-action-primary)' }) {
  const start = new Date(startDate)
  start.setHours(0, 0, 0, 0)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const dots = []
  for (let i = 0; i < durationDays; i++) {
    const d = new Date(start)
    d.setDate(d.getDate() + i)
    const key = d.toDateString()
    const reps = dailyReps[key] || 0
    const isToday = d.toDateString() === today.toDateString()
    const isFuture = d > today

    let bg = 'var(--color-border-subtle)'
    if (reps > 0) bg = activeColor
    else if (isFuture) bg = 'transparent'

    dots.push(
      <span
        key={i}
        title={`Day ${i + 1}: ${reps}`}
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: bg,
          border: isFuture ? '1px solid var(--color-border-subtle)' : 'none',
          boxShadow: isToday ? `0 0 0 1.5px var(--color-bg-app), 0 0 0 2.5px ${activeColor}` : 'none',
          flexShrink: 0,
        }}
      />
    )
  }

  return (
    <div>
      {label !== null && (
        <div style={{
          fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 10,
          letterSpacing: '0.14em', color: 'var(--color-text-muted)', marginBottom: 8,
        }}>
          {label ?? `${durationDays} DAYS`}
        </div>
      )}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {dots}
      </div>
    </div>
  )
}
