import { useEffect, useState } from 'react'
import { useToast } from '../shared-ui'
import { getProgramme, saveProgramme } from '../lib/programmesApi'
import QuickSelectModal from './QuickSelect/QuickSelectModal'
import { IconPlus, IconSave, IconClose } from './icons'

const PROGRAMME_TYPES = ['HIIT', 'TABATA', 'CIRCUIT', 'AMRAP', 'EMOM']

function emptyActivity() {
  return { id: crypto.randomUUID(), name: '', reps: '', weight: '', notes: '' }
}

function emptyBlock() {
  return { id: crypto.randomUUID(), name: '', repeat: 3, active: 45, recover: 30, activities: [emptyActivity()] }
}

function emptyProgramme() {
  return { id: null, name: 'New Programme', type: 'HIIT', introEnabled: true, introSeconds: 10, blocks: [emptyBlock()] }
}

function validate(programme) {
  const errors = {}
  if (!programme.name.trim()) errors.name = 'Name is required'
  if (programme.introEnabled && (programme.introSeconds < 5 || programme.introSeconds > 60)) {
    errors.introSeconds = 'Must be between 5 and 60 seconds'
  }
  if (programme.blocks.length === 0) errors.blocks = 'Add at least one block'

  for (const block of programme.blocks) {
    if (block.repeat < 1) errors[`block-${block.id}-repeat`] = 'Must be at least 1'
    if (block.active <= 0) errors[`block-${block.id}-active`] = 'Must be greater than 0'
    if (block.recover < 0) errors[`block-${block.id}-recover`] = 'Cannot be negative'
    if (block.activities.length === 0) errors[`block-${block.id}-activities`] = 'Add at least one activity'
    for (const activity of block.activities) {
      if (!activity.name.trim()) errors[`activity-${activity.id}-name`] = 'Name is required'
    }
  }
  return errors
}

export default function ProgrammeEditor({ programmeId, onSaved, onCancel, autoOpenQuickCreate = false }) {
  const [programme, setProgramme] = useState(() => (programmeId ? null : emptyProgramme())) // null while loading in edit mode
  const [loadError, setLoadError] = useState(null)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [quickCreateOpen, setQuickCreateOpen] = useState(autoOpenQuickCreate)
  const toast = useToast()

  useEffect(() => {
    if (!programmeId) return
    getProgramme(programmeId)
      .then((p) => setProgramme({
        ...p,
        blocks: p.blocks.map((b) => ({ ...b, id: b.id, activities: b.activities.map((a) => ({ ...a })) })),
      }))
      .catch((err) => setLoadError(err.message))
  }, [programmeId])

  function updateField(key, value) {
    setProgramme((p) => ({ ...p, [key]: value }))
  }

  function updateBlock(blockId, patch) {
    setProgramme((p) => ({ ...p, blocks: p.blocks.map((b) => (b.id === blockId ? { ...b, ...patch } : b)) }))
  }

  function addBlock() {
    setProgramme((p) => ({ ...p, blocks: [...p.blocks, emptyBlock()] }))
  }

  function removeBlock(blockId) {
    setProgramme((p) => ({ ...p, blocks: p.blocks.filter((b) => b.id !== blockId) }))
  }

  function updateActivity(blockId, activityId, patch) {
    setProgramme((p) => ({
      ...p,
      blocks: p.blocks.map((b) =>
        b.id !== blockId
          ? b
          : { ...b, activities: b.activities.map((a) => (a.id === activityId ? { ...a, ...patch } : a)) }
      ),
    }))
  }

  function addActivity(blockId) {
    setProgramme((p) => ({
      ...p,
      blocks: p.blocks.map((b) => (b.id === blockId ? { ...b, activities: [...b.activities, emptyActivity()] } : b)),
    }))
  }

  function removeActivity(blockId, activityId) {
    setProgramme((p) => ({
      ...p,
      blocks: p.blocks.map((b) =>
        b.id === blockId ? { ...b, activities: b.activities.filter((a) => a.id !== activityId) } : b
      ),
    }))
  }

  // Quick Select's own callback contract: a plain array of new blocks to
  // append to the draft. Never writes to Supabase directly — the user
  // still reviews and saves via the existing Save button below.
  function handleQuickCreateGenerate(newBlocks) {
    setProgramme((p) => ({ ...p, blocks: [...p.blocks, ...newBlocks] }))
    setQuickCreateOpen(false)
    toast?.(`${newBlocks.length} block${newBlocks.length === 1 ? '' : 's'} added`, 'success')
  }

  async function handleSave() {
    const validationErrors = validate(programme)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) {
      toast?.('Fix the highlighted fields before saving', 'error')
      return
    }
    setSaving(true)
    try {
      await saveProgramme(programme)
      toast?.(`Saved "${programme.name}"`, 'success')
      onSaved()
    } catch (err) {
      toast?.(err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loadError) {
    return (
      <div style={s.page}>
        <p style={{ color: 'var(--color-error-text)' }}>Couldn&rsquo;t load programme: {loadError}</p>
        <button onClick={onCancel} style={s.secondaryBtn}>Back</button>
      </div>
    )
  }

  if (!programme) {
    return <div style={s.page}><p style={{ color: 'var(--color-text-muted)' }}>Loading&hellip;</p></div>
  }

  return (
    <div style={s.page}>
      <div style={s.field}>
        <label style={s.label} htmlFor="pe-name">Name</label>
        <input
          id="pe-name"
          value={programme.name}
          onChange={(e) => updateField('name', e.target.value)}
          style={s.input}
        />
        {errors.name && <span style={s.error}>{errors.name}</span>}
      </div>

      <div style={s.field}>
        <label style={s.label} htmlFor="pe-type">Type</label>
        <select id="pe-type" value={programme.type} onChange={(e) => updateField('type', e.target.value)} style={s.input}>
          {PROGRAMME_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div style={{ ...s.field, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <input
          id="pe-intro-enabled"
          type="checkbox"
          checked={programme.introEnabled}
          onChange={(e) => updateField('introEnabled', e.target.checked)}
          style={{ width: 20, height: 20 }}
        />
        <label htmlFor="pe-intro-enabled" style={s.label}>Intro countdown</label>
        {programme.introEnabled && (
          <input
            type="number"
            min={5}
            max={60}
            value={programme.introSeconds}
            onChange={(e) => updateField('introSeconds', Number(e.target.value))}
            style={{ ...s.input, width: 80 }}
          />
        )}
      </div>
      {errors.introSeconds && <span style={s.error}>{errors.introSeconds}</span>}

      {/* emptyBlock() always seeds one blank activity, so "has exercises" means a
          named one exists — not just a non-empty activities array. */}
      {!programme.blocks.some((b) => b.activities.some((a) => a.name.trim() !== '')) && (
        <button onClick={() => setQuickCreateOpen(true)} style={s.quickCreateBtn}>
          <IconPlus size={12} /> Quick Create
        </button>
      )}

      <QuickSelectModal
        open={quickCreateOpen}
        onClose={() => setQuickCreateOpen(false)}
        programme={programme}
        onGenerate={handleQuickCreateGenerate}
      />

      <div style={{ margin: '24px 0 12px', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--text-xs)', letterSpacing: 'var(--tracking-label)', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>
        Blocks
      </div>
      {errors.blocks && <span style={s.error}>{errors.blocks}</span>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {programme.blocks.map((block, blockIdx) => (
          <div key={block.id} style={s.block}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <input
                placeholder={`Block ${blockIdx + 1} name (optional)`}
                value={block.name || ''}
                onChange={(e) => updateBlock(block.id, { name: e.target.value })}
                style={{ ...s.input, flex: 1, marginRight: 8 }}
              />
              <button onClick={() => removeBlock(block.id)} style={s.removeBtn} aria-label="Remove block"><IconClose size={13} /></button>
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <div style={s.numberField}>
                <label style={s.smallLabel}>Repeat</label>
                <input type="number" min={1} value={block.repeat} onChange={(e) => updateBlock(block.id, { repeat: Number(e.target.value) })} style={s.input} />
                {errors[`block-${block.id}-repeat`] && <span style={s.error}>{errors[`block-${block.id}-repeat`]}</span>}
              </div>
              <div style={s.numberField}>
                <label style={s.smallLabel}>Active (s)</label>
                <input type="number" min={1} value={block.active} onChange={(e) => updateBlock(block.id, { active: Number(e.target.value) })} style={s.input} />
                {errors[`block-${block.id}-active`] && <span style={s.error}>{errors[`block-${block.id}-active`]}</span>}
              </div>
              <div style={s.numberField}>
                <label style={s.smallLabel}>Recover (s)</label>
                <input type="number" min={0} value={block.recover} onChange={(e) => updateBlock(block.id, { recover: Number(e.target.value) })} style={s.input} />
                {errors[`block-${block.id}-recover`] && <span style={s.error}>{errors[`block-${block.id}-recover`]}</span>}
              </div>
            </div>

            {errors[`block-${block.id}-activities`] && <span style={s.error}>{errors[`block-${block.id}-activities`]}</span>}

            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {block.activities.map((activity, activityIdx) => (
                <div key={activity.id} style={s.activityRow}>
                  <input
                    placeholder={`Exercise ${activityIdx + 1}`}
                    value={activity.name}
                    onChange={(e) => updateActivity(block.id, activity.id, { name: e.target.value })}
                    style={{ ...s.input, flex: 2 }}
                  />
                  <input
                    placeholder="Reps"
                    value={activity.reps || ''}
                    onChange={(e) => updateActivity(block.id, activity.id, { reps: e.target.value })}
                    style={{ ...s.input, flex: 1 }}
                  />
                  <input
                    placeholder="Weight"
                    value={activity.weight || ''}
                    onChange={(e) => updateActivity(block.id, activity.id, { weight: e.target.value })}
                    style={{ ...s.input, flex: 1 }}
                  />
                  <button onClick={() => removeActivity(block.id, activity.id)} style={s.removeBtn} aria-label="Remove exercise"><IconClose size={13} /></button>
                  {errors[`activity-${activity.id}-name`] && <span style={s.error}>{errors[`activity-${activity.id}-name`]}</span>}
                </div>
              ))}
              <button onClick={() => addActivity(block.id)} style={s.dashedBtn}><IconPlus size={11} /> Add Exercise</button>
            </div>
          </div>
        ))}
        <button onClick={addBlock} style={s.dashedBtn}><IconPlus size={11} /> Add Block</button>
      </div>

      <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
        <button onClick={onCancel} style={s.secondaryBtn} disabled={saving}>Cancel</button>
        <button onClick={handleSave} style={s.primaryBtn} disabled={saving}>
          <IconSave size={14} /> {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  )
}

const s = {
  page: {
    maxWidth: 'var(--shell-max-mobile)', margin: '0 auto', padding: '24px var(--shell-px-mobile) 96px',
    display: 'flex', flexDirection: 'column',
  },
  field: { display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 },
  label: {
    fontFamily: 'var(--font-display)', fontWeight: 'var(--weight-bold)', fontSize: 'var(--text-xs)',
    letterSpacing: 'var(--tracking-label)', textTransform: 'uppercase', color: 'var(--color-input-label)',
  },
  smallLabel: {
    fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 10, letterSpacing: '0.1em',
    textTransform: 'uppercase', color: 'var(--color-text-muted)',
  },
  input: {
    height: 'var(--input-h-md)', padding: '0 var(--space-3)', background: 'var(--color-input-bg)',
    border: '1px solid var(--color-input-border)', borderRadius: 'var(--radius-input)', color: 'var(--color-input-text)',
    fontSize: 'var(--text-sm)', fontFamily: 'var(--font-body)', width: '100%',
  },
  quickCreateBtn: {
    height: 'var(--btn-h-md)', padding: '0 20px', background: 'transparent', color: 'var(--color-action-positive)',
    border: '1px solid var(--color-action-positive)', borderRadius: 'var(--btn-radius)', cursor: 'pointer',
    fontFamily: 'var(--btn-font)', fontWeight: 'var(--btn-weight)', letterSpacing: 'var(--btn-tracking)',
    fontSize: 'var(--text-sm)', textTransform: 'uppercase', alignSelf: 'flex-start', marginBottom: 8,
    display: 'inline-flex', alignItems: 'center', gap: 6,
  },
  numberField: { display: 'flex', flexDirection: 'column', gap: 4, minWidth: 90, flex: 1 },
  error: { color: 'var(--color-error-text)', fontSize: 'var(--text-xs)' },
  block: {
    background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 'var(--card-radius)',
    padding: 'var(--card-padding-md)',
  },
  activityRow: { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' },
  removeBtn: {
    minWidth: 32, minHeight: 32, background: 'var(--color-error-bg)', color: 'var(--color-error-text)',
    border: '1px solid var(--color-error-border)', borderRadius: 'var(--radius-md)', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  dashedBtn: {
    height: 'var(--btn-h-sm)', border: '1px dashed var(--color-border-strong)', borderRadius: 'var(--radius-md)',
    background: 'transparent', color: 'var(--color-text-secondary)', cursor: 'pointer',
    fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--text-xs)', letterSpacing: '0.08em',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5,
  },
  primaryBtn: {
    height: 'var(--btn-h-md)', flex: 1, background: 'var(--color-action-primary)', color: 'var(--color-action-primary-text)',
    fontFamily: 'var(--btn-font)', fontWeight: 'var(--btn-weight)', letterSpacing: 'var(--btn-tracking)',
    fontSize: 'var(--text-sm)', textTransform: 'uppercase', border: 'none', borderRadius: 'var(--btn-radius)', cursor: 'pointer',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  secondaryBtn: {
    height: 'var(--btn-h-md)', padding: '0 20px', background: 'var(--color-action-secondary)', color: 'var(--color-action-secondary-text)',
    fontFamily: 'var(--btn-font)', fontWeight: 'var(--btn-weight)', letterSpacing: 'var(--btn-tracking)',
    fontSize: 'var(--text-sm)', textTransform: 'uppercase', border: 'none', borderRadius: 'var(--btn-radius)', cursor: 'pointer',
  },
}
