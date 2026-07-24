import { useRef, useCallback, useEffect } from 'react'

// A short silent WAV, generated at load time rather than embedded as a
// hand-typed base64 blob — a malformed literal would fail silently and be
// hard to catch. Playing it on loop keeps the tab's media session alive so
// Chrome doesn't throttle timers/audio once the screen locks.
function createSilentAudioUrl(durationSeconds = 1, sampleRate = 8000) {
  const numSamples = durationSeconds * sampleRate
  const buffer = new ArrayBuffer(44 + numSamples * 2)
  const view = new DataView(buffer)

  const writeString = (offset, str) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i))
  }

  writeString(0, 'RIFF')
  view.setUint32(4, 36 + numSamples * 2, true)
  writeString(8, 'WAVE')
  writeString(12, 'fmt ')
  view.setUint32(16, 16, true) // PCM chunk size
  view.setUint16(20, 1, true) // PCM format
  view.setUint16(22, 1, true) // mono
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * 2, true) // byte rate
  view.setUint16(32, 2, true) // block align
  view.setUint16(34, 16, true) // bits per sample
  writeString(36, 'data')
  view.setUint32(40, numSamples * 2, true)
  // sample bytes are left at 0 (silence) by the zero-initialized ArrayBuffer

  return URL.createObjectURL(new Blob([buffer], { type: 'audio/wav' }))
}

export function useAudioReliability() {
  const audioElRef = useRef(null)
  const urlRef = useRef(null)

  const getAudioEl = useCallback(() => {
    if (!audioElRef.current) {
      urlRef.current = createSilentAudioUrl()
      const el = new Audio(urlRef.current)
      el.loop = true
      el.preload = 'auto'
      audioElRef.current = el
    }
    return audioElRef.current
  }, [])

  const start = useCallback((programmeName, onTogglePause) => {
    const el = getAudioEl()
    el.play().catch((err) => console.warn('Silent keep-alive loop failed to start:', err.message))

    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: programmeName,
        artist: 'HIIT FIT',
      })
      navigator.mediaSession.setActionHandler('pause', onTogglePause)
      navigator.mediaSession.setActionHandler('play', onTogglePause)
    }
  }, [getAudioEl])

  const stop = useCallback(() => {
    const el = audioElRef.current
    if (el) {
      el.pause()
      el.currentTime = 0
    }
    if ('mediaSession' in navigator) {
      navigator.mediaSession.setActionHandler('pause', null)
      navigator.mediaSession.setActionHandler('play', null)
      navigator.mediaSession.metadata = null
    }
  }, [])

  useEffect(() => () => {
    stop()
    if (urlRef.current) URL.revokeObjectURL(urlRef.current)
  }, [stop])

  return { start, stop }
}
