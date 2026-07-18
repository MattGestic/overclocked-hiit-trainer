import TabBar from '../shared-ui/components/TabBar'
import { IconGrid, IconClock, IconBolt } from './icons'

// Contextual tab set (refined-UI p.1/p.2): LIBRARY + HISTORY always; a third
// RUNNING tab (with a live dot) only appears while a workout is in progress,
// matching the reference exactly rather than always reserving the slot.
export default function AppTabBar({ active, running, onNavigate }) {
  const tabs = [
    { id: 'library', label: 'Library', icon: IconGrid },
    ...(running ? [{ id: 'running', label: 'Running', icon: RunningIcon }] : []),
    { id: 'history', label: 'History', icon: IconClock },
  ]

  return (
    <TabBar
      tabs={tabs}
      active={active}
      onNavigate={onNavigate}
      activeColor="var(--color-timer-work)"
    />
  )
}

function RunningIcon({ size, color }) {
  return (
    <span style={{ position: 'relative', display: 'inline-flex' }}>
      <IconBolt size={size} color={color} />
      <span style={{
        position: 'absolute', top: -1, right: -1, width: 7, height: 7, borderRadius: '50%',
        background: 'var(--color-timer-work)', border: '1.5px solid var(--color-bg-app)',
      }} />
    </span>
  )
}
