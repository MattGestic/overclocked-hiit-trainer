import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext(null)

export function ThemeProvider({ children, defaultDark = true }) {
  const [dark, setDark] = useState(() => {
    const stored = localStorage.getItem('theme')
    return stored ? stored === 'dark' : defaultDark
  })
  const [compact, setCompact] = useState(() => localStorage.getItem('density') === 'compact')

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light'
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark])

  useEffect(() => {
    document.documentElement.dataset.density = compact ? 'compact' : 'comfortable'
    localStorage.setItem('density', compact ? 'compact' : 'comfortable')
  }, [compact])

  return (
    <ThemeContext.Provider value={{
      dark, toggleTheme: () => setDark(d => !d),
      compact, toggleDensity: () => setCompact(c => !c),
    }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
