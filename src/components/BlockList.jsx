// Shared between ActiveWorkout's overview and TimerRun's landscape split
// layout, so the block/exercise table with current-activity highlighting
// only exists in one place.
export default function BlockList({ programme, engine }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {programme.blocks.map((block, blockIdx) => {
        const isCurrentBlock = engine.status !== 'idle' && engine.blockIndex === blockIdx
        return (
          <div key={block.id} style={s.block}>
            <div style={s.blockHeader}>
              <span>
                {block.name || `Block ${blockIdx + 1}`}
                <span style={s.blockMeta}> &middot; {block.repeat} round{block.repeat === 1 ? '' : 's'}</span>
              </span>
              {isCurrentBlock && <span style={s.runningBadge}>{engine.status === 'paused' ? 'PAUSED' : 'RUNNING'}</span>}
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
                      <td style={s.td}>{isCurrent && <span style={s.dot} />}{activity.name}</td>
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
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10,
    fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)',
  },
  blockMeta: { fontWeight: 400, color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)' },
  runningBadge: {
    fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 9, letterSpacing: '0.1em',
    color: 'var(--color-timer-work)', border: '1px solid var(--color-timer-work)', borderRadius: 'var(--radius-chip)',
    padding: '2px 8px',
  },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' },
  th: { textAlign: 'left', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 10, letterSpacing: '0.08em', color: 'var(--color-text-muted)', padding: '4px 0' },
  td: { padding: '6px 0', color: 'var(--color-text-primary)', borderTop: '1px solid var(--card-border)' },
  trCurrent: { background: 'var(--color-success-bg)' },
  dot: { display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: 'var(--color-timer-work)', marginRight: 8 },
}
