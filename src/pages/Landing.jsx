import { useState } from 'react'
import { FiLock, FiHeart, FiCheck, FiVideoOff } from 'react-icons/fi'

export default function Landing({ onStart }) {
  const [name, setName]           = useState('')
  const [loading, setLoading]     = useState(false)
  const [camError, setCamError]   = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed || loading) return
    setCamError(false)
    setLoading(true)
    try {
      await onStart(trimmed)
    } catch {
      // getUserMedia was denied — don't enter matchmaking
      setCamError(true)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-dvh bg-zinc-950 flex flex-col items-center justify-center px-5 py-12 relative overflow-hidden">

      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-emerald-500/6 blur-3xl pointer-events-none" />
      {/* Dot-grid */}
      <div
        className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle, #10b981 1px, transparent 1px)', backgroundSize: '28px 28px' }}
      />

      <div className="relative z-10 w-full max-w-xs text-center flex flex-col gap-8">

        {/* Logo */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/25 flex items-center justify-center shadow-xl shadow-emerald-900/30">
              {/* Heart icon */}
              <svg viewBox="0 0 24 24" className="w-9 h-9" fill="none">
                <path d="M12 21C12 21 3 15 3 9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 6-9 12-9 12z" fill="#10b981" />
              </svg>
            </div>
            {/* Live dot */}
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-50" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </span>
          </div>

          <div>
            <h1 className="text-5xl font-black tracking-tight text-white leading-none">
              Not<span className="text-emerald-400">Alone</span>
            </h1>
          </div>
        </div>

        {/* Headline + sub */}
        <div className="space-y-2">
          <p className="text-white text-2xl font-semibold leading-snug tracking-tight">
            You don't have to be<br />alone right now.
          </p>
          <p className="text-zinc-400 text-sm leading-relaxed">
            A real person is waiting. No sign-up,<br />no algorithm — just a human conversation.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            autoFocus
            type="text"
            value={name}
            onChange={e => { setName(e.target.value); setCamError(false) }}
            placeholder="What should we call you?"
            maxLength={30}
            disabled={loading}
            className="w-full px-5 py-4 rounded-2xl bg-zinc-800/80 text-white placeholder-zinc-500 border border-zinc-700/80 focus:outline-none focus:border-emerald-500/70 focus:ring-2 focus:ring-emerald-500/10 transition-all text-center text-base disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!name.trim() || loading}
            className="w-full py-4 rounded-2xl font-bold text-base transition-all disabled:opacity-30 disabled:cursor-not-allowed bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white shadow-lg shadow-emerald-900/40 active:scale-[0.98]"
          >
            {loading ? 'Allow camera & mic…' : 'Talk to Someone'}
          </button>
          {camError && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20">
              <FiVideoOff className="text-red-400 flex-shrink-0" />
              <p className="text-red-400 text-sm">Camera or mic access was denied. Please allow it in your browser settings and try again.</p>
            </div>
          )}
        </form>

        {/* Reassurance pills */}
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {[
            { icon: <FiLock className="text-xs" />,   label: 'Anonymous' },
            { icon: <FiCheck className="text-xs" />,  label: 'No sign-up' },
            { icon: <FiHeart className="text-xs" />,  label: 'Real humans only' },
          ].map(({ icon, label }) => (
            <span key={label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-800/70 border border-zinc-700/60 text-zinc-400 text-xs font-medium">
              {icon}{label}
            </span>
          ))}
        </div>

      </div>
    </div>
  )
}
