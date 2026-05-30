import { useEffect, useRef, useState, useCallback } from 'react'
import { doc, onSnapshot, deleteDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { findOpenRoom, createWaitingRoom, claimRoom } from '../lib/matchmaking'

export default function Waiting({ displayName, onMatched, onLeave }) {
  const createdRoomId = useRef(null)
  const unsubRef      = useRef(null)
  const retryTimer    = useRef(null)
  const [error, setError] = useState(null)

  const handleCancel = useCallback(() => {
    clearTimeout(retryTimer.current)
    if (unsubRef.current) { unsubRef.current(); unsubRef.current = null }
    if (createdRoomId.current) {
      deleteDoc(doc(db, 'videoCalls', createdRoomId.current)).catch(() => {})
      createdRoomId.current = null
    }
    onLeave()
  }, [onLeave])

  useEffect(() => {
    let cancelled = false

    async function tryMatch() {
      setError(null)
      try {
        const existingId = await findOpenRoom()
        if (cancelled) return

        if (existingId) {
          try {
            await claimRoom(existingId, displayName)
            if (!cancelled) onMatched({ roomId: existingId, isCaller: false })
          } catch {
            if (!cancelled) tryMatch()
          }
          return
        }

        const newId = await createWaitingRoom(displayName)
        if (cancelled) { deleteDoc(doc(db, 'videoCalls', newId)).catch(() => {}); return }
        createdRoomId.current = newId

        const unsub = onSnapshot(doc(db, 'videoCalls', newId), snap => {
          if (!snap.exists()) return
          if (snap.data().status === 'active' && !cancelled) {
            unsub()
            createdRoomId.current = null
            onMatched({ roomId: newId, isCaller: true })
          }
        })
        unsubRef.current = unsub

      } catch (e) {
        if (cancelled) return
        const isPermission = e?.code === 'permission-denied' || e?.message?.includes('permissions')
        setError(isPermission ? 'Firestore rules not yet active. Retrying…' : 'Connection error. Retrying…')
        retryTimer.current = setTimeout(() => { if (!cancelled) tryMatch() }, 3000)
      }
    }

    tryMatch()

    return () => {
      cancelled = true
      clearTimeout(retryTimer.current)
      if (unsubRef.current) { unsubRef.current(); unsubRef.current = null }
    }
  }, [displayName, onMatched])

  const initial = displayName[0]?.toUpperCase() ?? '?'

  return (
    <div className="min-h-dvh bg-zinc-950 flex flex-col items-center justify-center px-5 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-emerald-500/8 blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center gap-8 text-center">
        <div className="relative flex items-center justify-center">
          <span className="absolute w-32 h-32 rounded-full border border-emerald-500/20 animate-ping [animation-duration:1.8s]" />
          <span className="absolute w-24 h-24 rounded-full border border-emerald-500/25 animate-ping [animation-duration:1.8s] [animation-delay:0.4s]" />
          <span className="absolute w-16 h-16 rounded-full border border-emerald-500/30 animate-ping [animation-duration:1.8s] [animation-delay:0.8s]" />
          <div className="relative w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center shadow-xl shadow-emerald-900/20">
            <span className="text-2xl font-black text-emerald-400">{initial}</span>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-white text-xl font-semibold">Hang tight, {displayName}.</p>
          {error ? (
            <p className="text-amber-400 text-sm max-w-xs">Having trouble connecting. Trying again…</p>
          ) : (
            <p className="text-zinc-400 text-sm leading-relaxed">
              A real person is on their way to you.<br />This might take a moment.
            </p>
          )}
        </div>

        {!error && (
          <div className="flex gap-1.5">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        )}

        <button
          onClick={handleCancel}
          className="mt-2 px-6 py-2.5 rounded-xl text-zinc-500 hover:text-white border border-zinc-800 hover:border-zinc-600 text-sm font-medium transition-all active:scale-95"
        >
          I'll come back later
        </button>
      </div>
    </div>
  )
}
