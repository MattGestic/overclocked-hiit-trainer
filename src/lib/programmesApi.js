import { supabase } from './supabaseClient'

// Isolates all programme/block/activity Supabase calls and the row<->client
// shape translation, so components work with the nested client shape only.

export async function listProgrammes() {
  const { data, error } = await supabase
    .from('programmes')
    .select(`
      id, name, type, updated_at,
      blocks ( repeat_count, active_seconds, recover_seconds, activities(count) )
    `)
    .order('updated_at', { ascending: false })

  if (error) throw error

  return data.map((row) => ({
    id: row.id,
    name: row.name,
    type: row.type,
    updatedAt: row.updated_at,
    blockCount: row.blocks.length,
    durationMinutes: estimateDurationMinutes(row.blocks),
  }))
}

// Rough estimate for the Library card badge — repeat × activity-count ×
// (active + recover) per block, summed. Overestimates slightly (the very
// last recover of a run is skipped by the timer engine) but that's an
// acceptable trade for a single cheap nested query instead of N+1 full
// getProgramme() calls just to badge a list.
function estimateDurationMinutes(blocks) {
  const totalSeconds = blocks.reduce((sum, b) => {
    const activityCount = b.activities[0]?.count ?? 0
    return sum + b.repeat_count * activityCount * (b.active_seconds + b.recover_seconds)
  }, 0)
  return Math.max(1, Math.round(totalSeconds / 60))
}

export async function getProgramme(id) {
  const { data, error } = await supabase
    .from('programmes')
    .select(`
      id, name, type, intro_enabled, intro_seconds,
      blocks (
        id, position, name, repeat_count, active_seconds, recover_seconds,
        activities ( id, position, name, reps, weight, notes )
      )
    `)
    .eq('id', id)
    .order('position', { referencedTable: 'blocks', ascending: true })
    .order('position', { referencedTable: 'blocks.activities', ascending: true })
    .single()

  if (error) throw error

  return {
    id: data.id,
    name: data.name,
    type: data.type,
    introEnabled: data.intro_enabled,
    introSeconds: data.intro_seconds,
    blocks: data.blocks.map((b) => ({
      id: b.id,
      position: b.position,
      name: b.name,
      repeat: b.repeat_count,
      active: b.active_seconds,
      recover: b.recover_seconds,
      activities: b.activities.map((a) => ({
        id: a.id,
        position: a.position,
        name: a.name,
        reps: a.reps,
        weight: a.weight,
        notes: a.notes,
      })),
    })),
  }
}

// Delete-and-reinsert save, per spec — acceptable simplification for this
// build (see docs/architecture.md), not wrapped in a client-side
// transaction. A failure between steps can leave stale blocks; the fast
// follow is a single Postgres RPC that does this atomically.
export async function saveProgramme(programme) {
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError) throw userError
  if (!user) throw new Error('Not signed in')

  const { data: savedProgramme, error: programmeError } = await supabase
    .from('programmes')
    .upsert({
      // Only include `id` for an existing programme — a new one has
      // `id: null` (see emptyProgramme() in ProgrammeEditor.jsx), and
      // sending that literally inserts NULL into the primary key instead
      // of letting its DEFAULT gen_random_uuid() generate one.
      ...(programme.id ? { id: programme.id } : {}),
      user_id: user.id,
      name: programme.name,
      type: programme.type,
      intro_enabled: programme.introEnabled,
      intro_seconds: programme.introSeconds,
    })
    .select()
    .single()

  if (programmeError) throw programmeError

  const programmeId = savedProgramme.id

  if (programme.id) {
    const { error: deleteError } = await supabase.from('blocks').delete().eq('programme_id', programmeId)
    if (deleteError) throw deleteError
  }

  for (const [blockPosition, block] of programme.blocks.entries()) {
    const { data: savedBlock, error: blockError } = await supabase
      .from('blocks')
      .insert({
        programme_id: programmeId,
        position: blockPosition + 1,
        name: block.name || null,
        repeat_count: block.repeat,
        active_seconds: block.active,
        recover_seconds: block.recover,
      })
      .select()
      .single()

    if (blockError) throw blockError

    const activityRows = block.activities.map((activity, activityPosition) => ({
      block_id: savedBlock.id,
      position: activityPosition + 1,
      name: activity.name,
      reps: activity.reps || null,
      weight: activity.weight || null,
      notes: activity.notes || null,
    }))

    const { error: activitiesError } = await supabase.from('activities').insert(activityRows)
    if (activitiesError) throw activitiesError
  }

  return programmeId
}

export async function deleteProgramme(id) {
  const { error } = await supabase.from('programmes').delete().eq('id', id)
  if (error) throw error
}
