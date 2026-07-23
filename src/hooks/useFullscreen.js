import { useCallback } from 'react'

// Fullscreen API wrapper. Not supported on iOS Safari in any context —
// degrades silently. Installed PWA (display:standalone) handles full-screen
// presentation at OS level on iOS without JS involvement.
export function useFullscreen() {
  const enter = useCallback(() => {
    if (!document.fullscreenEnabled) return
    const el = document.documentElement
    const fn = el.requestFullscreen || el.webkitRequestFullscreen || el.mozRequestFullscreen
    fn?.call(el).catch(() => {})
  }, [])

  const exit = useCallback(() => {
    if (!document.fullscreenElement) return
    const fn = document.exitFullscreen || document.webkitExitFullscreen
    fn?.call(document).catch(() => {})
  }, [])

  return { enter, exit }
}
