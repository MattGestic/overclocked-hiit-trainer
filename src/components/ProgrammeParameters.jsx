// Read-only summary of the programme's existing settings, shown above
// BlockList on ActiveWorkout. Deliberately scoped to fields that already
// exist on `programme` today — no new schema. Extended metadata (status,
// description, plan date, check-in time, comments), a cooldown countdown,
// a between-blocks interval, and per-programme audio volume were all
// considered and dropped: each needs new columns and/or phase-engine
// changes, and docs/requirements.md already lists them (and the
// coach/athlete framing they came with) as explicitly out of scope for v1.
export default function ProgrammeParameters({ programme }) {
  const block = programme.blocks[0]

  return (
    <div style={s.card}>
      <div style={s.eyebrow}>Parameters</div>

      <div style={s.row}>
        <Field label="Type" value={programme.type} />
        <Field
          label="Intro countdown"
          value={programme.introEnabled ? `${programme.introSeconds} sec` : 'Off'}
        />
      </div>

      {block && (
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <IntervalChip label="Active" value={`${block.active} sec`} />
          <IntervalChip label="Recover" value={`${block.recover} sec`} />
          <IntervalChip label="Repeat" value={`×${block.repeat}`} />
        </div>
      )}
    </div>
  )
}

function Field({ label, value }) {
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={s.fieldLabel}>{label}</div>
      <div style={s.fieldValue}>{value}</div>
    </div>
  )
}

function IntervalChip({ label, value }) {
  return (
    <div style={s.chip}>
      <span style={s.chipLabel}>{label}</span>
      <span style={s.chipValue}>{value}</span>
    </div>
  )
}

const s = {
  card: {
    background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 'var(--card-radius)',
    padding: 'var(--card-padding-md)', marginBottom: 16,
  },
  eyebrow: {
    fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 10, letterSpacing: '0.1em',
    textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: 12,
  },
  row: { display: 'flex', gap: 16 },
  fieldLabel: {
    fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 10, letterSpacing: '0.08em',
    textTransform: 'uppercase', color: 'var(--color-text-subtle)', marginBottom: 4,
  },
  fieldValue: { fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)' },
  chip: {
    display: 'flex', alignItems: 'baseline', gap: 5, background: 'var(--color-action-secondary)',
    borderRadius: 'var(--radius-chip)', padding: '5px 10px',
  },
  chipLabel: {
    fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 9, letterSpacing: '0.06em',
    textTransform: 'uppercase', color: 'var(--color-text-muted)',
  },
  chipValue: { fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: 'var(--color-text-primary)' },
}
