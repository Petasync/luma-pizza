'use client'
import { useEffect, useRef, useState } from 'react'

/** How often the alarm re-rings while orders stay unconfirmed. */
const ALARM_REPEAT_MS = 4000

/** One bell stroke. Triangle wave + high gain cuts through kitchen noise. */
function beep(ctx: AudioContext, freq: number, start: number, dur: number) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.type = 'triangle'
  osc.frequency.value = freq
  gain.gain.setValueAtTime(0.0001, start)
  gain.gain.exponentialRampToValueAtTime(0.6, start + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + dur)
  osc.start(start)
  osc.stop(start + dur)
  osc.onended = () => {
    osc.disconnect()
    gain.disconnect()
  }
}

/** Loud two-tone "ding-dong" alarm — much louder than the old single chime. */
function playAlarm(ctx: AudioContext) {
  const now = ctx.currentTime
  beep(ctx, 988, now, 0.2)
  beep(ctx, 784, now + 0.24, 0.32)
}

/**
 * Audible alarm for the restaurant terminal. Rings, and keeps re-ringing every
 * few seconds, while there is at least one unconfirmed ("pending") order — so a
 * busy kitchen cannot miss it. Browsers block audio until a user gesture, so the
 * AudioContext is only created via `enable()` (the dashboard shows a tap-once
 * banner). "Ton aus" mutes the current burst; a newly arriving order un-mutes.
 */
export function useOrderAlarm(pendingCount: number) {
  const [enabled, setEnabled] = useState(false)
  const [muted, setMuted] = useState(false)
  const ctxRef = useRef<AudioContext | null>(null)
  const prevPending = useRef(pendingCount)

  // A rise in pending orders means a new order arrived — re-arm the alarm.
  useEffect(() => {
    if (pendingCount > prevPending.current) setMuted(false)
    prevPending.current = pendingCount
  }, [pendingCount])

  function enable() {
    if (ctxRef.current) return
    try {
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      ctxRef.current = new Ctx()
      setEnabled(true)
    } catch {
      /* audio not available — leave disabled */
    }
  }

  useEffect(() => {
    if (!enabled || muted || pendingCount < 1) return
    const ctx = ctxRef.current
    if (!ctx) return

    let stopped = false
    const ring = () => {
      if (stopped) return
      // The context can get suspended (e.g. tab backgrounded) — wake it first.
      if (ctx.state === 'suspended') void ctx.resume()
      playAlarm(ctx)
    }
    ring()
    const id = setInterval(ring, ALARM_REPEAT_MS)
    return () => {
      stopped = true
      clearInterval(id)
    }
  }, [enabled, muted, pendingCount])

  return { enabled, enable, muted, setMuted }
}
