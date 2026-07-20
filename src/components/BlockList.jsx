import { IconRepeat, IconPlay } from './icons'

function blockDurationMinutes(block) {
  const seconds = block.repeat * block.activities.length * (block.active + block.recover)
  const minutes = seconds / 60
  return minutes % 1 === 0 ? `${minutes} min` : `${minutes.toFixed(1)} min`
}

// Shared between ActiveWorkout's overview and TimerRun's landscape split
// layout, so the block/exercise table with current-activity highlighting
// only exists in one place. `onStart` is only offered on block 1 — the
// engine always runs a programme start-to-finish in order, there's no
// jump-to-block-N control, so a per-block Start button on any later block
// would be misleading.
export default function BlockList({ programme, engine, onStart }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {programme.blocks.map((block, blockIdx) => {
        const isCurrentBlock = engine.status !== 'idle' && engine.blockIndex === blockIdx
        const showStart = blockIdx === 0 && engine.status === 'idle' && onStart
        return (
          <div key={block.id}>
            <div style={s.metaRow}>
              <div style={{ ...s.blockOrder, color: isCurrentBlock ? 'var(--color-timer-work)' : 'var(--color-text-primary)' }}>
                {block.name || `BLOCK ${blockIdx + 1}`}
              </div>
              <span style={s.blockMeta}>{blockDurationMinutes(block)}</span>
              <div style={{ flex: 1 }} />
              {isCurrentBlock ? (
                <span style={s.runningBadge}>{engine.status === 'paused' ? 'PAUSED' : 'RUNNING'}</span>
              ) : showStart && (
                <button onClick={onStart} style={s.startBtn}>
                  <IconPlay size={11} /> Start
                </button>
              )}
            </div>
            <div style={s.blockHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
                {isCurrentBlock && <span style={s.liveDot} />}
                <div style={s.blockName}>{(block.name || `Block ${blockIdx + 1}`).toUpperCase()}</div>
              </div>
              <span style={s.repeatChip}><IconRepeat size={11} /> &times;{block.repeat}</span>
            </div>
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>Exercise</th>
                  <th style={s.th}>Reps</th>
                  <th style={s.th}>Weight</th>
                </tr>
              </thead>
              <tbody>
                {block.activities.map((activity, activityIdx) => {
                  const isCurrent = isCurrentBlock && engine.activityIndex === activityIdx
                  return (
                    <tr key={activity.id} style={isCurrent ? s.trCurrent : undefined}>
                      <td style={s.td}>
                        {isCurrent ? <span style={s.dot} /> : <span style={s.position}>{String(activityIdx + 1).padStart(2, '0')}</span>}
                        {activity.name}
                      </td>
                      <td style={s.td}>{activity.reps}</td>
                      <td style={s.td}>{activity.weight}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )
      })}
    </div>
  )
}

const s = {
  metaRow: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, padding: '0 2px' },
  blockOrder: { fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, letterSpacing: '0.16em', whiteSpace: 'nowrap' },
  blockMeta: { fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-text-muted)', whiteSpace: 'nowrap' },
  runningBadge: {
    fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 10, letterSpacing: '0.18em',
    color: 'var(--color-timer-work)', whiteSpace: 'nowrap',
  },
  startBtn: {
    display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 10.5,
    letterSpacing: '0.08em', color: 'var(--color-timer-work)', boxShadow: 'inset 0 0 0 1.5px var(--color-timer-work)',
    borderRadius: 'var(--radius-chip)', padding: '6px 12px', background: 'none', border: 'none', cursor: 'pointer',
  },
  blockHeader: {
    background: 'var(--color-bg-inverse)', color: 'var(--color-text-inverse)',
    borderRadius: 'var(--card-radius) var(--card-radius) 0 0',
    padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
  },
  liveDot: {
    width: 8, height: 8, borderRadius: '50%', background: 'var(--color-timer-work)', flexShrink: 0,
    boxShadow: '0 0 12px rgba(22,165,116,0.6)',
  },
  blockName: {
    fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, letterSpacing: '0.04em',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
  repeatChip: {
    display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 10,
    color: 'var(--color-text-on-primary)', background: 'rgba(255,255,255,0.12)', borderRadius: 'var(--radius-chip)',
    padding: '4px 8px', flexShrink: 0,
  },
  table: {
    width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)',
    background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderTop: 'none',
    borderRadius: '0 0 var(--card-radius) var(--card-radius)',
  },
  th: { textAlign: 'left', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 10, letterSpacing: '0.08em', color: 'var(--color-text-muted)', padding: '10px 12px 6px' },
  td: { padding: '8px 12px', color: 'var(--color-text-primary)', borderTop: '1px solid var(--card-border)' },
  trCurrent: { background: 'var(--color-success-bg)' },
  dot: { display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: 'var(--color-timer-work)', marginRight: 8 },
  position: { display: 'inline-block', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-text-subtle)', marginRight: 8, width: 14 },
}
