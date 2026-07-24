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

// Full session rows, newest first — used by History for stats, the
// calendar, and the recent-sessions list. No pagination: this is a
// single-user personal app, not a scale concern for this MVP.
export async function listAllSessions() {
  const { data, error } = await supabase
    .from('session_logs')
    .select('id, programme_name, block_count, started_at, ended_at, status')
    .order('started_at', { ascending: false })

  if (error) throw error
  return data
}

// Written once per run, on natural completion or explicit Stop.
// programme_name/block_count are snapshotted at record time so history
// survives the programme itself being edited or deleted later.
export async function recordSession(programme, startedAt, status) {
  const { error } = await supabase.from('session_logs').insert({
    programme_id: programme.id,
    programme_name: programme.name,
    block_count: programme.blocks.length,
    started_at: startedAt,
    ended_at: new Date().toISOString(),
    status,
  })
  if (error) throw error
}
