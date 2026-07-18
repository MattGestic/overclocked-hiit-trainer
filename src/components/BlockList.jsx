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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {programme.blocks.map((block, blockIdx) => {
        const isCurrentBlock = engine.status !== 'idle' && engine.blockIndex === blockIdx
        const showStart = blockIdx === 0 && engine.status === 'idle' && onStart
        return (
          <div key={block.id} style={s.block}>
            <div style={s.blockHeader}>
              <div style={{ minWidth: 0 }}>
                <div style={s.blockName}>{block.name || `Block ${blockIdx + 1}`}</div>
                <div style={s.blockMeta}>{blockDurationMinutes(block)}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                {isCurrentBlock && <span style={s.runningBadge}>{engine.status === 'paused' ? 'PAUSED' : 'RUNNING'}</span>}
                {showStart && (
                  <button onClick={onStart} style={s.startBtn}>
                    <IconPlay size={12} /> Start
                  </button>
                )}
                <span style={s.repeatChip}><IconRepeat size={12} /> &times;{block.repeat}</span>
              </div>
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
  block: { background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 'var(--card-radius)', padding: 'var(--card-padding-md)' },
  blockHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10, gap: 8,
  },
  blockName: { fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)' },
  blockMeta: { fontWeight: 400, color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)', marginTop: 2 },
  runningBadge: {
    fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 9, letterSpacing: '0.1em',
    color: 'var(--color-timer-work)', border: '1px solid var(--color-timer-work)', borderRadius: 'var(--radius-chip)',
    padding: '2px 8px',
  },
  startBtn: {
    display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 10,
    letterSpacing: '0.08em', color: 'var(--color-timer-work)', border: '1px solid var(--color-timer-work)',
    borderRadius: 'var(--radius-chip)', padding: '3px 10px', background: 'none', cursor: 'pointer',
  },
  repeatChip: {
    display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 10,
    color: 'var(--color-text-muted)', background: 'var(--color-action-secondary)', borderRadius: 'var(--radius-chip)', padding: '3px 8px',
  },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' },
  th: { textAlign: 'left', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 10, letterSpacing: '0.08em', color: 'var(--color-text-muted)', padding: '4px 0' },
  td: { padding: '6px 0', color: 'var(--color-text-primary)', borderTop: '1px solid var(--card-border)' },
  trCurrent: { background: 'var(--color-success-bg)' },
  dot: { display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: 'var(--color-timer-work)', marginRight: 8 },
  position: { display: 'inline-block', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-text-subtle)', marginRight: 8, width: 14 },
}
