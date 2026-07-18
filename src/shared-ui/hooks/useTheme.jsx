import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext(null)

export function ThemeProvider({ children, defaultDark = true }) {
  const [dark, setDark] = useState(() => {
    const stored = localStorage.getItem('theme')
    return stored ? stored === 'dark' : defaultDark
  })

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light'
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark])

  return (
    <ThemeContext.Provider value={{ dark, toggleTheme: () => setDark(d => !d) }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
