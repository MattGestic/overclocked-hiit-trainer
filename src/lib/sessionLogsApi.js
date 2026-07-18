import { supabase } from './supabaseClient'

// Session counts per day, keyed the same way DayDots (shared-ui) expects:
// `date.toDateString()`. Reused by both the Library weekly strip and,
// later, the History screen.
export async function listSessionCountsSince(sinceDate) {
  const { data, error } = await supabase
    .from('session_logs')
    .select('started_at')
    .gte('started_at', sinceDate.toISOString())

  if (error) throw error

  const counts = {}
  for (const row of data) {
    const key = new Date(row.started_at).toDateString()
    counts[key] = (counts[key] || 0) + 1
  }
  return counts
}
