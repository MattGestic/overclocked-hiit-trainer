import { useState } from 'react'
import { nextIndices } from '../hooks/useTimerEngine'
import { useLayout } from '../hooks/useLayout'
import { useOffline } from '../hooks/useOffline'
import { setVolume, getVolume } from '../lib/audioEngine'
import { IconChevronDown, IconBolt, IconSquare, IconSpeaker, IconPause, IconPlay, IconSkip, IconRepeat, IconSettings } from './icons'

function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

function phaseColor(phase) {
  switch (phase) {
    case 'active': return 'var(--color-timer-work)'
    case 'recover': return 'var(--color-timer-rest)'
    case 'intro': return 'var(--color-timer-intro)'
    case 'complete': return 'var(--color-timer-complete)'
    default: return 'var(--color-text-muted)'
  }
}

function currentPhaseDuration(engine, programme) {
  if (engine.phase === 'intro') return programme.introSeconds
  const block = programme.blocks[engine.blockIndex]
  if (!block) return 0
  if (engine.phase === 'active') return block.active
  if (engine.phase === 'recover') return block.recover
  return 0
}

// NEXT + THEN preview — the two-tile lookahead the v2 reference shows
// instead of a single NEXT card. Colour-coded to whatever's coming (green =
// exercise, blue = recover), per user-testing markup, not to the current
// phase; carries the upcoming activity's reps/weight so the stat boxes
// during RECOVER show what's coming next, not what just finished.
function nextThenPreview(engine, programme) {
  const { phase, blockIndex, roundIndex, activityIndex } = engine
  if (phase === 'intro') {
    const block = programme.blocks[0]
    const a = block.activities[0]
    return {
      next: { name: a.name, seconds: block.active, type: 'active', reps: a.reps, weight: a.weight },
      then: { name: 'Recover', seconds: block.recover, type: 'recover' },
    }
  }
  if (phase === 'active') {
    const block = programme.blocks[blockIndex]
    const next = { name: 'Recover', seconds: block.recover, type: 'recover' }
    const after = nextIndices(programme, blockIndex, roundIndex, activityIndex)
    if (!after) return { next, then: { name: 'Finish', seconds: 0, type: 'complete' } }
    const nb = programme.blocks[after.blockIndex]
    const a = nb.activities[after.activityIndex]
    return { next, then: { name: a.name, seconds: nb.active, type: 'active', reps: a.reps, weight: a.weight } }
  }
  if (phase === 'recover') {
    const after = nextIndices(programme, blockIndex, roundIndex, activityIndex)
    if (!after) return { next: { name: 'Finish', seconds: 0, type: 'complete' }, then: null }
    const nb = programme.blocks[after.blockIndex]
    const a = nb.activities[after.activityIndex]
    const next = { name: a.name, seconds: nb.active, type: 'active', reps: a.reps, weight: a.weight }
    const after2 = nextIndices(programme, after.blockIndex, after.roundIndex, after.activityIndex)
    const then = after2 ? { name: 'Recover', seconds: nb.recover, type: 'recover' } : { name: 'Finish', seconds: 0, type: 'complete' }
    return { next, then }
  }
  return { next: null, then: null }
}

// Segmented round-progress indicator — how many activities are done in the
// current block, across rounds. Purely derived from engine state already
// on hand, no new data model concept.
function TickRow({ total, current, fg }) {
  const items = []
  for (let i = 0; i < total; i++) {
    const done = i < current - 1
    const active = i === current - 1
    items.push(
      <span
        key={i}
        style={{
          flex: 1, height: 14, borderRadius: 1,
          background: done || active ? 'var(--color-timer-work)' : fg,
          opacity: done || active ? 1 : 0.25,
          boxShadow: active ? '0 0 8px rgba(22,165,116,0.5)' : 'none',
        }}
      />
    )
  }
  return <div style={{ display: 'flex', gap: 2, width: '100%', maxWidth: 200 }}>{items}</div>
}

// Consolidates saturated/split/mute into one gear button + popover, instead
// of three separate always-visible header icons — matches the v2
// reference's SettingsFlyout. Purely a presentation change: same three
// pieces of state (saturated/manualSplit/muted) that already existed.
function SettingsFlyout({ saturated, setSaturated, splitMode, setSplitMode, muted, toggleMute, onClose }) {
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 20 }} />
      <div style={s.flyout}>
        <FlyoutRow label="Saturated mode" icon={<IconBolt size={15} />}>
          <MiniToggle value={saturated} onChange={setSaturated} />
        </FlyoutRow>
        <FlyoutRow label="Split screen" icon={<IconSquare size={15} />}>
          <MiniToggle value={splitMode} onChange={setSplitMode} />
        </FlyoutRow>
        <div style={{ height: 1, background: 'var(--card-border)' }} />
        <FlyoutRow label="Audio" icon={<IconSpeaker size={15} muted={muted} />}>
          <MiniToggle value={!muted} onChange={toggleMute} />
        </FlyoutRow>
      </div>
    </>
  )
}

function FlyoutRow({ label, icon, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ color: 'var(--color-text-secondary)' }}>{icon}</span>
      <span style={{ flex: 1, fontSize: 12.5, color: 'var(--color-text-primary)', fontWeight: 600 }}>{label}</span>
      {children}
    </div>
  )
}

function MiniToggle({ value, onChange }) {
  return (
    <button onClick={() => onChange(!value)} style={{
      width: 36, height: 20, borderRadius: 99, position: 'relative', flexShrink: 0, border: 'none', cursor: 'pointer',
      background: value ? 'var(--color-timer-work)' : 'var(--color-action-secondary)',
    }}>
      <span style={{ position: 'absolute', top: 2, left: value ? 18 : 2, width: 16, height: 16, borderRadius: 99, background: '#fff', transition: 'left 0.15s ease' }} />
    </button>
  )
}

// A read-only "check off as you go" list for the block currently running —
// separate from BlockList (which shows every block) because the split-
// screen reference view (refined-UI p.6) shows only the current one, with
// a per-exercise checkmark. Checked state is local/session-only, not
// persisted — it's a glance aid during the run, not a data model concept.
function CurrentBlockChecklist({ block, engine, checked, onToggle, fg, saturated }) {
  return (
    <div style={{ ...s.checklistCard, background: saturated ? 'var(--overlay-on-dark-2)' : 'var(--color-timer-paper-surface)' }}>
      <div style={{ ...s.checklistHeader, color: fg }}>{block.name || 'Block'}</div>
      <table style={s.checklistTable}>
        <thead>
          <tr>
            <th style={{ ...s.checklistTh, color: fg }}>Exercise</th>
            <th style={{ ...s.checklistTh, color: fg }}>Reps</th>
            <th style={{ ...s.checklistTh, color: fg }}>Weight</th>
            <th style={{ ...s.checklistTh, color: fg }}>Notes</th>
            <th style={s.checklistTh} />
          </tr>
        </thead>
        <tbody>
          {block.activities.map((activity, i) => {
            const isCurrent = engine.activityIndex === i
            return (
              <tr key={activity.id}>
                <td style={{ ...s.checklistTd, color: fg }}>
                  {isCurrent && <span style={s.checklistDot} />}
                  {activity.name}
                </td>
                <td style={{ ...s.checklistTd, color: fg }}>{activity.reps}</td>
                <td style={{ ...s.checklistTd, color: fg }}>{activity.weight}</td>
                <td style={{ ...s.checklistTd, color: fg, opacity: 0.7 }}>{activity.notes}</td>
                <td style={s.checklistTd}>
                  <button
                    onClick={() => onToggle(activity.id)}
                    aria-label={checked.has(activity.id) ? 'Mark not done' : 'Mark done'}
                    aria-pressed={checked.has(activity.id)}
                    style={{
                      ...s.checkBtn,
                      background: checked.has(activity.id) ? 'var(--color-timer-work)' : 'transparent',
                      borderColor: checked.has(activity.id) ? 'var(--color-timer-work)' : (saturated ? 'var(--overlay-on-dark-6)' : 'var(--color-timer-paper-border)'),
                    }}
                  >
                    {checked.has(activity.id) && <span style={{ color: '#fff', fontSize: 12 }}>&#10003;</span>}
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default function TimerRun({ engine, programme, onCollapse, onStop }) {
  const layout = useLayout()
  const offline = useOffline()
  const [saturated, setSaturated] = useState(false)
  const [manualSplit, setManualSplit] = useState(false)
  const [muted, setMuted] = useState(() => getVolume() === 0)
  const [checked, setChecked] = useState(() => new Set())
  const [settingsOpen, setSettingsOpen] = useState(false)
  const block = programme.blocks[engine.blockIndex]
  const activity = block?.activities[engine.activityIndex]
  const total = currentPhaseDuration(engine, programme)
  const elapsedPct = total > 0 ? Math.min(100, ((total - engine.timeLeft) / total) * 100) : 0
  const color = phaseColor(engine.phase)
  const { next, then } = engine.status !== 'complete' && engine.status !== 'idle'
    ? nextThenPreview(engine, programme)
    : { next: null, then: null }
  const nextColor = next ? phaseColor(next.type) : color
  const thenColor = then ? phaseColor(then.type) : color
  // The square header icon lets the user force the split/checklist view
  // open regardless of orientation (refined-UI p.6); a wide/landscape
  // viewport also gets it automatically without needing the toggle.
  const split = manualSplit || (layout.landscape && (layout.tablet || layout.wide))
  // RECOVER shows the upcoming exercise's target/weight, not the one just
  // finished — ACTIVE shows the exercise currently in progress.
  const statsSource = engine.phase === 'recover' ? next : activity
  const showStats = (engine.phase === 'active' || engine.phase === 'recover') && statsSource && (statsSource.reps || statsSource.weight)

  const phaseName = engine.phase === 'active' ? 'ACTIVE'
    : engine.phase === 'recover' ? 'RECOVER'
    : engine.phase === 'intro' ? 'INTRO'
    : 'DONE'

  const displayName = engine.phase === 'intro' ? 'GET READY'
    : engine.phase === 'complete' ? 'WORKOUT COMPLETE'
    : activity?.name ?? ''

  function toggleMute() {
    const willMute = !muted
    setVolume(willMute ? 0 : 0.8)
    setMuted(willMute)
  }

  function toggleChecked(activityId) {
    setChecked((prev) => {
      const next = new Set(prev)
      if (next.has(activityId)) next.delete(activityId)
      else next.add(activityId)
      return next
    })
  }

  const pageBg = engine.status === 'paused'
    ? (saturated ? 'var(--color-bg-app)' : 'var(--color-timer-paper)')
    : (saturated ? color : 'var(--color-timer-paper)')
  const fg = saturated ? '#ffffff' : 'var(--color-timer-paper-text)'

  const ringTrackColor = saturated ? 'var(--overlay-on-dark-5)' : 'var(--color-timer-paper-track)'
  const ringProgressColor = saturated ? '#ffffff' : color

  function renderRing(size, radius, strokeWidth) {
    const circumference = 2 * Math.PI * radius
    const center = size / 2
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={center} cy={center} r={radius} fill="none" stroke={ringTrackColor} strokeWidth={strokeWidth} />
        <circle
          cx={center} cy={center} r={radius} fill="none" stroke={ringProgressColor} strokeWidth={strokeWidth}
          strokeDasharray={circumference} strokeDashoffset={circumference * (1 - elapsedPct / 100)}
          strokeLinecap="round" transform={`rotate(-90 ${center} ${center})`} style={{ transition: 'stroke-dashoffset 1s linear' }}
        />
      </svg>
    )
  }

  const phaseBadge = (
    <div style={{ ...s.phaseBadge, background: saturated ? 'var(--overlay-on-dark-4)' : 'var(--color-timer-paper-surface)', border: saturated ? 'none' : `1px solid ${color}` }}>
      <span style={{ ...s.phaseDot, background: saturated ? '#fff' : color }} />
      {engine.status === 'paused' ? 'PAUSED' : phaseName}
    </div>
  )

  function previewTile(label, tileColor, tile) {
    if (!tile) return null
    return (
      <div style={{
        ...s.nextRow,
        borderColor: saturated ? 'var(--overlay-on-dark-6)' : tileColor,
        background: saturated ? 'var(--overlay-on-dark-2)' : 'var(--color-timer-paper-surface)',
      }}>
        <span style={{ ...s.nextLabel, color: saturated ? '#fff' : tileColor }}>{label}</span>
        <span style={{ color: fg }}>{tile.name}{tile.seconds ? ` · ${tile.seconds}s` : ''}</span>
      </div>
    )
  }

  const totalUnits = block ? block.activities.length * block.repeat : 0
  const doneUnits = block ? engine.roundIndex * block.activities.length + engine.activityIndex : 0

  return (
    <div style={{ ...s.page, background: pageBg, color: fg, transition: 'background 0.3s, color 0.3s' }}>
      {offline && (
        <div style={s.offlineBanner} role="status" aria-live="polite">
          OFFLINE — session protected
        </div>
      )}
      <div style={s.header}>
        <button onClick={onCollapse} style={s.iconBtn(saturated)} aria-label="Collapse">
          <IconChevronDown size={18} />
        </button>
        <div style={s.headerCenter}>
          <span style={s.blockRound}>
            {block && `BLOCK ${engine.blockIndex + 1} · ROUND ${engine.roundIndex + 1}/${block.repeat}`}
          </span>
          {block && totalUnits > 0 && <TickRow total={totalUnits} current={doneUnits + 1} fg={fg} />}
        </div>
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setSettingsOpen((v) => !v)}
            style={s.iconBtn(saturated, settingsOpen)}
            aria-label="Timer settings" aria-pressed={settingsOpen}
          >
            <IconSettings size={17} />
          </button>
          {settingsOpen && (
            <SettingsFlyout
              saturated={saturated} setSaturated={setSaturated}
              splitMode={manualSplit} setSplitMode={setManualSplit}
              muted={muted} toggleMute={toggleMute}
              onClose={() => setSettingsOpen(false)}
            />
          )}
        </div>
      </div>

      {split ? (
        <>
          <div style={s.splitTopRow}>
            <div style={s.miniRingWrap}>
              {renderRing(120, 50, 9)}
              <div style={s.miniRingCenter}>
                <div style={{ ...s.miniTimeText, color: fg }}>{formatTime(engine.timeLeft)}</div>
              </div>
            </div>
            <div style={s.splitInfo}>
              {phaseBadge}
              {next && (
                <div>
                  <div style={{ ...s.nextLabel, color: saturated ? '#fff' : nextColor, marginBottom: 2 }}>NEXT UP</div>
                  <div style={{ ...s.splitNextName, color: fg }}>{next.name}</div>
                  {next.seconds > 0 && <div style={{ fontSize: 10.5, color: fg, opacity: 0.6 }}>{next.seconds}s</div>}
                </div>
              )}
            </div>
          </div>

          {block && (
            <>
              <div style={s.currentBlockHeader}>
                <span style={{ color: fg, opacity: 0.7 }}>
                  CURRENT BLOCK &middot; ROUND {engine.roundIndex + 1}/{block.repeat}
                </span>
              </div>
              <CurrentBlockChecklist block={block} engine={engine} checked={checked} onToggle={toggleChecked} fg={fg} saturated={saturated} />
            </>
          )}
        </>
      ) : (
        <div style={s.center}>
          {phaseBadge}
          <div style={s.ringWrap}>
            {renderRing(280, 130, 12)}
            <div style={s.ringCenter}>
              <div style={{ ...s.exerciseName, color: fg }}>{displayName}</div>
              <div style={{ ...s.timeText, color: fg }}>{formatTime(engine.timeLeft)}</div>
            </div>
          </div>

          {showStats && (
            <div style={s.statRow}>
              {statsSource.reps && (
                <div style={{ ...s.statBox, background: saturated ? 'var(--overlay-on-dark-3)' : 'var(--color-timer-paper-surface)' }}>
                  <div style={s.statLabel}>Target</div>
                  <div style={{ ...s.statValue, color: fg }}>{statsSource.reps}</div>
                </div>
              )}
              {statsSource.weight && (
                <div style={{ ...s.statBox, background: saturated ? 'var(--overlay-on-dark-3)' : 'var(--color-timer-paper-surface)' }}>
                  <div style={s.statLabel}>Weight</div>
                  <div style={{ ...s.statValue, color: fg }}>{statsSource.weight}</div>
                </div>
              )}
            </div>
          )}

          <div style={s.previewStack}>
            {previewTile('NEXT', nextColor, next)}
            {previewTile('THEN', thenColor, then)}
          </div>
        </div>
      )}

      <div style={s.controls}>
        <button onClick={engine.togglePause} style={s.controlBtn(saturated)} disabled={engine.status === 'complete'}>
          {engine.status === 'running' ? <IconPause size={16} /> : <IconPlay size={16} />}
          {engine.status === 'running' ? 'Pause' : 'Resume'}
        </button>
        <button onClick={engine.skip} style={s.controlBtn(saturated)} disabled={engine.status !== 'running'}>
          <IconSkip size={16} /> Skip
        </button>
        <button onClick={onStop} style={{ ...s.controlBtn(saturated), ...s.stopBtn(saturated) }}>Stop</button>
      </div>
    </div>
  )
}

const s = {
  page: { minHeight: '100svh', display: 'flex', flexDirection: 'column', padding: '16px var(--shell-px-mobile) 32px', gap: 16 },
  header: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 },
  headerCenter: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, minWidth: 0 },
  iconBtn: (saturated, pressed) => ({
    width: 36, height: 36, borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: pressed ? (saturated ? 'var(--overlay-on-dark-5)' : 'var(--color-bg-inverse)') : (saturated ? 'var(--overlay-on-dark-3)' : 'var(--color-timer-paper-surface)'),
    color: pressed && !saturated ? 'var(--color-text-inverse)' : 'inherit',
    border: 'none', cursor: 'pointer', flexShrink: 0,
  }),
  flyout: {
    position: 'absolute', top: 44, right: 0, width: 200, zIndex: 21,
    padding: 12, display: 'flex', flexDirection: 'column', gap: 12,
    background: 'var(--dialog-bg)', border: '1px solid var(--dialog-border)', borderRadius: 'var(--radius-lg)',
    boxShadow: 'var(--shadow-lg)',
  },
  blockRound: { fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 11, letterSpacing: '0.12em', opacity: 0.85 },
  center: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18, padding: '24px 0' },
  phaseBadge: {
    display: 'flex', alignItems: 'center', gap: 6,
    fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12, letterSpacing: '0.16em',
    padding: '5px 14px', borderRadius: 'var(--radius-chip)', width: 'fit-content',
  },
  phaseDot: { width: 6, height: 6, borderRadius: '50%' },
  ringWrap: { position: 'relative', width: 280, height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  ringCenter: { position: 'absolute', textAlign: 'center', padding: '0 16px' },
  exerciseName: {
    fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--text-xl)', textTransform: 'uppercase',
    marginBottom: 8, letterSpacing: '0.02em',
  },
  timeText: {
    fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 56,
    fontVariantNumeric: 'tabular-nums',
  },
  statRow: { display: 'flex', gap: 10, width: '100%', maxWidth: 320 },
  statBox: { flex: 1, borderRadius: 'var(--radius-lg)', padding: '10px 4px', textAlign: 'center' },
  statLabel: { fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 9, letterSpacing: '0.12em', opacity: 0.65 },
  statValue: { fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--text-lg)', marginTop: 2 },
  previewStack: { display: 'flex', flexDirection: 'column', gap: 8, width: '100%', maxWidth: 320 },
  nextRow: {
    display: 'flex', alignItems: 'center', gap: 10, width: '100%',
    borderRadius: 'var(--radius-lg)', border: '1px solid', padding: '10px 14px',
    fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)',
  },
  nextLabel: { fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 9, letterSpacing: '0.14em', flexShrink: 0 },
  controls: { display: 'flex', gap: 12 },
  controlBtn: (saturated) => ({
    flex: 1, height: 'var(--btn-h-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    background: saturated ? 'var(--overlay-on-dark-3)' : 'var(--color-timer-paper-surface)',
    color: saturated ? '#fff' : 'var(--color-timer-paper-text)',
    border: saturated ? '1px solid var(--overlay-on-dark-6)' : '1px solid var(--color-timer-paper-border)',
    borderRadius: 'var(--btn-radius)', fontFamily: 'var(--btn-font)', fontWeight: 700, fontSize: 'var(--text-sm)',
    letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer',
  }),
  stopBtn: (saturated) => ({
    background: saturated ? 'var(--overlay-on-dark-3)' : 'transparent',
    color: saturated ? '#fff' : 'var(--color-action-danger)',
    border: `1px solid ${saturated ? 'var(--overlay-on-dark-6)' : 'var(--color-action-danger)'}`,
  }),
  offlineBanner: {
    margin: '-16px calc(-1 * var(--shell-px-mobile)) 12px',
    background: 'var(--color-action-danger, #dc2626)', color: '#fff',
    fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 11,
    letterSpacing: '0.12em', textTransform: 'uppercase', textAlign: 'center',
    padding: '6px 16px',
  },

  // Split-view specific (refined-UI p.6)
  splitTopRow: { display: 'flex', alignItems: 'center', gap: 16 },
  miniRingWrap: { position: 'relative', width: 120, height: 120, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  miniRingCenter: { position: 'absolute' },
  miniTimeText: { fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 28, fontVariantNumeric: 'tabular-nums' },
  splitInfo: { flex: 1, display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0 },
  splitNextName: { fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, letterSpacing: '0.03em' },
  currentBlockHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 10, letterSpacing: '0.1em',
  },
  checklistCard: { borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)', flex: 1, overflowY: 'auto' },
  checklistHeader: { fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--text-sm)', textTransform: 'uppercase', marginBottom: 10 },
  checklistTable: { width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' },
  checklistTh: { textAlign: 'left', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 10, letterSpacing: '0.06em', opacity: 0.6, padding: '4px 6px 4px 0' },
  checklistTd: { padding: '8px 6px 8px 0', borderTop: '1px solid rgba(128,128,128,0.15)' },
  checklistDot: { display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: 'var(--color-timer-work)', marginRight: 8 },
  checkBtn: {
    width: 24, height: 24, borderRadius: 6, border: '1.5px solid', display: 'flex', alignItems: 'center',
    justifyContent: 'center', cursor: 'pointer', background: 'transparent',
  },
}
