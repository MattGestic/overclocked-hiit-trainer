import { useRef, useCallback, useEffect } from 'react'

export function useWakeLock() {
  const sentinelRef = useRef(null)

  const acquire = useCallback(async () => {
    try {
      sentinelRef.current = await navigator.wakeLock.request('screen')
    } catch (err) {
      console.warn('Wake lock failed:', err.message) // degrade silently, timer still runs
    }
  }, [])

  const release = useCallback(() => {
    sentinelRef.current?.release()
    sentinelRef.current = null
  }, [])

  // Safety net: release if the component unmounts while a lock is still
  // held (e.g. navigating away mid-workout) rather than leaking it.
  useEffect(() => () => release(), [release])

  return { acquire, release }
}
