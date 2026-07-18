export default function TabBar({ tabs, active, onNavigate, activeColor = 'var(--color-action-primary)' }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 flex justify-center" style={{ background: 'var(--color-bg-app)', zIndex: 40 }}>
      <div
        className="flex w-full"
        style={{ maxWidth: 'var(--shell-max-mobile)', borderTop: '1px solid var(--color-border-subtle)' }}
      >
        {tabs.map(tab => {
          const isActive = active === tab.id
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => onNavigate(tab.id)}
              className="flex-1 py-3 pb-6 flex flex-col items-center gap-1 transition-colors"
              style={{ background: 'none', border: 'none', cursor: 'pointer', minHeight: 44 }}
            >
              <Icon size={20} color={isActive ? activeColor : 'var(--color-text-muted)'} />
              <span
                style={{
                  color: isActive ? activeColor : 'var(--color-text-muted)',
                  letterSpacing: '0.18em', fontSize: 8,
                  fontFamily: 'var(--font-display)', fontWeight: 800,
                }}
              >
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
