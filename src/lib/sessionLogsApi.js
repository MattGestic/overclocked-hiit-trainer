import { supabase } from './supabaseClient'

// Minimal per-session rows since a given date — powers both the Library
// weekly strip's day dots and its date-select filter (which programme(s)
// ran on the selected day). Deliberately just started_at/programme_id so
// callers derive whatever shape (counts, day->programme map) they need
// client-side instead of each needing its own bespoke aggregation query.
export async function listSessionsSince(sinceDate) {
  const { data, error } = await supabase
    .from('session_logs')
    .select('started_at, programme_id')
    .gte('started_at', sinceDate.toISOString())

  if (error) throw error
  return data
}

// Full session rows, newest first — used by History for stats, the
// calendar, and the recent-sessions list. No pagination: this is a
// single-user personal app, not a scale concern for this MVP.
export async function listAllSessions() {
  const { data, error } = await supabase
    .from('session_logs')
    .select('id, programme_id, programme_name, block_count, started_at, ended_at, status')
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
