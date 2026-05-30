import { useState } from 'react'
import { FiVideo, FiZap, FiShield, FiUsers } from 'react-icons/fi'

export default function Landing({ onStart }) {
  const [name, setName] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    const trimmed = name.trim()
    if (trimmed) onStart(trimmed)
  }

  return (
    <div className="min-h-dvh bg-zinc-950 flex flex-col items-center justify-center px-5 py-12 relative overflow-hidden">

      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-emerald-500/6 blur-3xl pointer-events-none" />
      {/* Dot-grid background */}
      <div
        className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle, #10b981 1px, transparent 1px)', backgroundSize: '28px 28px' }}
      />

      <div className="relative z-10 w-full max-w-xs text-center flex flex-col gap-8">

        {/* Logo */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/25 flex items-center justify-center shadow-xl shadow-emerald-900/30">
              <FiVideo className="text-emerald-400 text-[2rem]" />
            </div>
            {/* Live dot */}
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-50" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </span>
          </div>

          <div>
            <h1 className="text-5xl font-black tracking-tight text-white leading-none">
              Video<span className="text-emerald-400">Chat</span>
            </h1>
            <p className="text-zinc-400 mt-2 text-sm tracking-wide">Meet someone new, instantly.</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            autoFocus
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Enter your name"
            maxLength={30}
            className="w-full px-5 py-4 rounded-2xl bg-zinc-800/80 text-white placeholder-zinc-500 border border-zinc-700/80 focus:outline-none focus:border-emerald-500/70 focus:ring-2 focus:ring-emerald-500/10 transition-all text-center text-base"
          />
          <button
            type="submit"
            disabled={!name.trim()}
            className="w-full py-4 rounded-2xl font-bold text-base transition-all disabled:opacity-30 disabled:cursor-not-allowed bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white shadow-lg shadow-emerald-900/40 active:scale-[0.98]"
          >
            Start Chatting →
          </button>
        </form>

        {/* Feature pills */}
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {[
            { icon: <FiShield className="text-xs" />, label: 'Private' },
            { icon: <FiZap className="text-xs" />, label: 'Instant' },
            { icon: <FiUsers className="text-xs" />, label: 'Random Match' },
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
