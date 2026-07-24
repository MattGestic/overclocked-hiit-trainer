import { useEffect, useState } from 'react'

const BREAKPOINTS = { md: 640, lg: 1024, xl: 1440 }

function computeLayout() {
  const w = window.innerWidth
  const h = window.innerHeight
  let bp = 'sm'
  if (w >= BREAKPOINTS.xl) bp = 'xl'
  else if (w >= BREAKPOINTS.lg) bp = 'lg'
  else if (w >= BREAKPOINTS.md) bp = 'md'

  return {
    bp,
    landscape: w > h,
    w,
    h,
    wide: bp === 'lg' || bp === 'xl',
    tablet: bp === 'md',
  }
}

export function useLayout() {
  const [layout, setLayout] = useState(computeLayout)

  useEffect(() => {
    let orientationTimer

    function handleResize() {
      setLayout(computeLayout())
    }

    // Debounced separately from resize: orientationchange fires before the
    // browser has finished resizing the viewport on some mobile browsers,
    // so an immediate read can be stale.
    function handleOrientationChange() {
      clearTimeout(orientationTimer)
      orientationTimer = setTimeout(() => setLayout(computeLayout()), 150)
    }

    window.addEventListener('resize', handleResize)
    window.addEventListener('orientationchange', handleOrientationChange)
    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('orientationchange', handleOrientationChange)
      clearTimeout(orientationTimer)
    }
  }, [])

  return layout
}
