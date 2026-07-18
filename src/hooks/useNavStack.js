import { useCallback, useEffect, useRef, useState } from 'react'

// Lean in-app navigation via the History API — no router library needed for
// this few a screens. Forward navigation (navigate) pushes a new state so
// the browser/PWA back button steps back through app screens instead of
// leaving the app; goBack() defers to the real browser back button so both
// paths converge on the same popstate handler instead of drifting apart.
export function useNavStack(initialView) {
  const [view, setView] = useState(initialView)
  const stackRef = useRef([initialView])

  useEffect(() => {
    // Anchor the stack to the entry URL so the very first popstate has
    // something defined to land on.
    window.history.replaceState({ hiitNavDepth: 0 }, '')
  }, [])

  useEffect(() => {
    function onPopState() {
      if (stackRef.current.length > 1) stackRef.current.pop()
      setView(stackRef.current[stackRef.current.length - 1])
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  const navigate = useCallback((next) => {
    stackRef.current.push(next)
    window.history.pushState({ hiitNavDepth: stackRef.current.length - 1 }, '')
    setView(next)
  }, [])

  const goBack = useCallback(() => {
    if (stackRef.current.length > 1) window.history.back()
  }, [])

  return { view, navigate, goBack }
}
