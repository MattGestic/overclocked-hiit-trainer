import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext(null)

function persisted(key, fallback) {
  return localStorage.getItem(key) || fallback
}

export function ThemeProvider({ children, defaultDark = true }) {
  const [dark, setDark] = useState(() => {
    const stored = localStorage.getItem('theme')
    return stored ? stored === 'dark' : defaultDark
  })
  // 'compact' | 'regular' | 'comfy' — regular is the base --space-* scale
  // defined in tokens.css, the other two are [data-density] overrides.
  const [density, setDensity] = useState(() => persisted('density', 'regular'))
  // 'cream' | 'paper' | 'steel' — only meaningful alongside the light
  // theme; paper is the light theme's own default values (no override
  // block needed), cream/steel are [data-theme="light"][data-palette] overrides.
  const [palette, setPalette] = useState(() => persisted('palette', 'paper'))
  // 'oswald' | 'barlow' | 'bebas' | 'anton' — oswald is --font-display's
  // own default, the others are [data-font] overrides.
  const [font, setFont] = useState(() => persisted('font', 'oswald'))

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light'
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark])

  useEffect(() => {
    document.documentElement.dataset.density = density
    localStorage.setItem('density', density)
  }, [density])

  useEffect(() => {
    document.documentElement.dataset.palette = palette
    localStorage.setItem('palette', palette)
  }, [palette])

  useEffect(() => {
    document.documentElement.dataset.font = font
    localStorage.setItem('font', font)
  }, [font])

  return (
    <ThemeContext.Provider value={{
      dark, toggleTheme: () => setDark((d) => !d),
      density, setDensity,
      palette, setPalette,
      font, setFont,
    }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
