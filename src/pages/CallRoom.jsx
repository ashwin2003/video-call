import { useRef, useEffect, useState } from 'react'
import { FiMic, FiMicOff, FiVideo, FiVideoOff, FiSkipForward, FiPhoneOff } from 'react-icons/fi'
import { useWebRTC } from '../hooks/useWebRTC'

function formatDuration(secs) {
  const m = Math.floor(secs / 60).toString().padStart(2, '0')
  const s = (secs % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

export default function CallRoom({ roomId, isCaller, initialStream, onNext, onLeave }) {
  // ── All hooks must be declared before any conditional returns ──────────────
  const {
    localStream, remoteStream, remoteDisplayName,
    connectionState, isMuted, isCameraOff, mediaError,
    toggleMute, toggleCamera, hangUp,
  } = useWebRTC({ roomId, isCaller, initialStream })

  const localRef  = useRef(null)
  const remoteRef = useRef(null)
  const [duration, setDuration] = useState(0)

  useEffect(() => {
    if (localRef.current && localStream) localRef.current.srcObject = localStream
  }, [localStream])

  useEffect(() => {
    if (remoteRef.current && remoteStream) remoteRef.current.srcObject = remoteStream
  }, [remoteStream])

  useEffect(() => {
    if (connectionState !== 'connected' && connectionState !== 'completed') return
    setDuration(0)
    const id = setInterval(() => setDuration(d => d + 1), 1000)
    return () => clearInterval(id)
  }, [connectionState])
  // ──────────────────────────────────────────────────────────────────────────

  if (mediaError) {
    return (
      <div className="min-h-dvh bg-zinc-950 flex flex-col items-center justify-center gap-6 px-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-red-500/15 border border-red-500/20 flex items-center justify-center">
          <FiVideoOff className="text-red-400 text-2xl" />
        </div>
        <p className="text-zinc-300 max-w-xs text-sm leading-relaxed">
          We couldn't access your camera or mic. Please allow access in your browser and try again.
        </p>
        <button
          onClick={onLeave}
          className="px-6 py-3 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium transition-all active:scale-95"
        >
          Go back
        </button>
      </div>
    )
  }

  async function handleNext() { await hangUp(); onNext() }
  async function handleLeave() { await hangUp(); onLeave() }

  const isConnected  = connectionState === 'connected' || connectionState === 'completed'
  const isConnecting = !isConnected && connectionState !== 'disconnected' && connectionState !== 'failed' && connectionState !== 'closed'
  const remoteLost   = connectionState === 'disconnected' || connectionState === 'failed' || connectionState === 'closed'

  const initial = remoteDisplayName ? remoteDisplayName[0].toUpperCase() : '?'

  return (
    <div className="relative w-screen bg-zinc-950 overflow-hidden" style={{ height: '100dvh' }}>

      {/* ── Remote video ── */}
      <video
        ref={remoteRef}
        autoPlay
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Top gradient — for badge readability */}
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />

      {/* Bottom gradient — for controls readability */}
      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />

      {/* ── Connecting overlay ── */}
      {isConnecting && (
        <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm flex flex-col items-center justify-center gap-5">
          <div className="relative flex items-center justify-center">
            <span className="absolute w-20 h-20 rounded-full border border-emerald-500/20 animate-ping [animation-duration:1.6s]" />
            <div className="w-12 h-12 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
          </div>
          <p className="text-zinc-300 text-base font-light tracking-wide">Hang on, setting things up…</p>
        </div>
      )}

      {/* ── Remote disconnected overlay ── */}
      {remoteLost && (
        <div className="absolute inset-0 bg-zinc-950/85 backdrop-blur-sm flex flex-col items-center justify-center gap-6 px-6 text-center">
          <div className="w-16 h-16 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center">
            <FiPhoneOff className="text-zinc-400 text-2xl" />
          </div>
          <div className="space-y-1">
            <p className="text-white font-semibold">They had to go.</p>
            <p className="text-zinc-400 text-sm">That's okay. There's always someone else.</p>
          </div>
          <button
            onClick={handleNext}
            className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-semibold text-sm transition-all active:scale-95 shadow-lg shadow-emerald-900/40"
          >
            Talk to Someone Else
          </button>
        </div>
      )}

      {/* ── Remote name badge (top-left) ── */}
      {remoteDisplayName && isConnected && (
        <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-2 rounded-xl bg-black/40 backdrop-blur-md border border-white/10">
          <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center flex-shrink-0">
            <span className="text-emerald-400 text-xs font-bold">{initial}</span>
          </div>
          <span className="text-white text-sm font-medium">{remoteDisplayName}</span>
        </div>
      )}

      {/* ── Timer (top-right) ── */}
      {isConnected && (
        <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-black/40 backdrop-blur-md border border-white/10">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-white text-sm font-mono tabular-nums">{formatDuration(duration)}</span>
        </div>
      )}

      {/* ── Local PiP ── */}
      <div className="absolute bottom-28 right-3 md:bottom-32 md:right-5 w-24 h-32 md:w-36 md:h-48 rounded-2xl overflow-hidden border border-white/20 shadow-2xl bg-zinc-900 ring-1 ring-white/5">
        <video
          ref={localRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover scale-x-[-1]"
        />
        {isCameraOff && (
          <div className="absolute inset-0 bg-zinc-900 flex items-center justify-center">
            <FiVideoOff className="text-zinc-600 text-xl" />
          </div>
        )}
        {/* PiP "You" label */}
        <div className="absolute bottom-1.5 left-0 right-0 text-center">
          <span className="text-white/60 text-[10px] font-medium">You</span>
        </div>
      </div>

      {/* ── Control bar ── */}
      <div
        className="absolute bottom-0 left-0 right-0 flex justify-center pb-6"
        style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
      >
        <div className="bg-black/50 backdrop-blur-2xl border border-white/10 rounded-2xl px-5 py-3.5 flex items-center gap-3 md:gap-4 shadow-2xl">

          <CtrlBtn
            on={isMuted}
            onClass="bg-red-500/90 hover:bg-red-500 text-white"
            offClass="bg-white/10 hover:bg-white/20 text-white"
            onClick={toggleMute}
            label={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <FiMicOff className="text-lg" /> : <FiMic className="text-lg" />}
          </CtrlBtn>

          <CtrlBtn
            on={isCameraOff}
            onClass="bg-red-500/90 hover:bg-red-500 text-white"
            offClass="bg-white/10 hover:bg-white/20 text-white"
            onClick={toggleCamera}
            label={isCameraOff ? 'Show cam' : 'Camera'}
          >
            {isCameraOff ? <FiVideoOff className="text-lg" /> : <FiVideo className="text-lg" />}
          </CtrlBtn>

          {/* Next — primary action */}
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={handleNext}
              title="Next person"
              className="w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center bg-gradient-to-br from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 transition-all active:scale-95 shadow-lg shadow-emerald-900/50"
            >
              <FiSkipForward className="text-white text-xl" />
            </button>
            <span className="text-white/40 text-[10px] font-medium">Next</span>
          </div>

          <CtrlBtn
            on
            onClass="bg-red-600/80 hover:bg-red-600 text-white"
            offClass="bg-red-600/80 hover:bg-red-600 text-white"
            onClick={handleLeave}
            label="Leave"
          >
            <FiPhoneOff className="text-lg" />
          </CtrlBtn>

        </div>
      </div>
    </div>
  )
}

function CtrlBtn({ children, onClick, label, on, onClass, offClass }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <button
        onClick={onClick}
        className={`w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center transition-all active:scale-95 ${on ? onClass : offClass}`}
      >
        {children}
      </button>
      <span className="text-white/40 text-[10px] font-medium">{label}</span>
    </div>
  )
}
