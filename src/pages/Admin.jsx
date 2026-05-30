import { useState, useEffect } from 'react'
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { FiUsers, FiMapPin, FiClock, FiLock } from 'react-icons/fi'

const ADMIN_PASSWORD = 'anubhav jagarwal'

function timeAgo(ts) {
  if (!ts) return '—'
  const secs = Math.floor((Date.now() - ts.toMillis()) / 1000)
  if (secs < 60)   return `${secs}s ago`
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`
  return `${Math.floor(secs / 86400)}d ago`
}

function today(ts) {
  if (!ts) return false
  const d = ts.toDate()
  const now = new Date()
  return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
}

export default function Admin() {
  const [authed, setAuthed]     = useState(() => sessionStorage.getItem('na-admin') === '1')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState(false)
  const [visitors, setVisitors] = useState([])
  const [search, setSearch]     = useState('')

  useEffect(() => {
    if (!authed) return
    const q = query(collection(db, 'visitors'), orderBy('joinedAt', 'desc'), limit(500))
    const unsub = onSnapshot(q, snap => {
      setVisitors(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    return unsub
  }, [authed])

  function handleLogin(e) {
    e.preventDefault()
    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem('na-admin', '1')
      setAuthed(true)
    } else {
      setError(true)
    }
  }

  if (!authed) {
    return (
      <div className="min-h-dvh bg-zinc-950 flex items-center justify-center px-5">
        <form onSubmit={handleLogin} className="w-full max-w-xs flex flex-col gap-4">
          <div className="flex items-center gap-2 mb-2">
            <FiLock className="text-emerald-400 text-xl" />
            <span className="text-white font-bold text-lg">NotAlone Admin</span>
          </div>
          <input
            autoFocus
            type="password"
            value={password}
            onChange={e => { setPassword(e.target.value); setError(false) }}
            placeholder="Password"
            className="w-full px-4 py-3 rounded-xl bg-zinc-800 text-white placeholder-zinc-500 border border-zinc-700 focus:outline-none focus:border-emerald-500/70 transition-all"
          />
          {error && <p className="text-red-400 text-sm">Wrong password.</p>}
          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold transition-all active:scale-95"
          >
            Enter
          </button>
        </form>
      </div>
    )
  }

  const todayCount   = visitors.filter(v => today(v.joinedAt)).length
  const filtered     = visitors.filter(v =>
    !search || [v.name, v.city, v.country, v.region].some(f => f?.toLowerCase().includes(search.toLowerCase()))
  )

  const topCountries = Object.entries(
    visitors.reduce((acc, v) => {
      if (v.country) acc[v.country] = (acc[v.country] || 0) + 1
      return acc
    }, {})
  ).sort((a, b) => b[1] - a[1]).slice(0, 5)

  return (
    <div className="min-h-dvh bg-zinc-950 text-white px-4 py-8 max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black">Not<span className="text-emerald-400">Alone</span> <span className="text-zinc-400 font-normal text-lg">Admin</span></h1>
          <p className="text-zinc-500 text-sm mt-0.5">Live visitor data</p>
        </div>
        <button
          onClick={() => { sessionStorage.removeItem('na-admin'); setAuthed(false) }}
          className="text-zinc-500 hover:text-white text-sm transition-colors"
        >
          Sign out
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
        <StatCard icon={<FiUsers />} label="Total visitors" value={visitors.length} />
        <StatCard icon={<FiClock />} label="Today"          value={todayCount} />
        <StatCard icon={<FiMapPin />} label="Countries"     value={new Set(visitors.map(v => v.country).filter(Boolean)).size} />
      </div>

      {/* Top countries */}
      {topCountries.length > 0 && (
        <div className="mb-6 p-4 rounded-2xl bg-zinc-900 border border-zinc-800">
          <p className="text-zinc-400 text-xs font-medium uppercase tracking-wider mb-3">Top countries</p>
          <div className="flex flex-wrap gap-2">
            {topCountries.map(([country, count]) => (
              <span key={country} className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
                {country} <span className="text-emerald-600">{count}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search by name, city, or country…"
        className="w-full mb-4 px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50 transition-all text-sm"
      />

      {/* Table */}
      <div className="rounded-2xl border border-zinc-800 overflow-hidden">
        <div className="grid grid-cols-4 px-4 py-2 bg-zinc-900 text-zinc-500 text-xs font-medium uppercase tracking-wider">
          <span>Name</span>
          <span>City</span>
          <span>Country</span>
          <span className="text-right">Joined</span>
        </div>
        {filtered.length === 0 ? (
          <div className="px-4 py-10 text-center text-zinc-600 text-sm">No visitors yet.</div>
        ) : (
          filtered.map(v => (
            <div key={v.id} className="grid grid-cols-4 px-4 py-3 border-t border-zinc-800/60 hover:bg-zinc-900/50 transition-colors text-sm">
              <span className="text-white font-medium truncate">{v.name || '—'}</span>
              <span className="text-zinc-400 truncate">{v.city || '—'}</span>
              <span className="text-zinc-400 truncate">{v.country || '—'}</span>
              <span className="text-zinc-500 text-right tabular-nums">{timeAgo(v.joinedAt)}</span>
            </div>
          ))
        )}
      </div>

      <p className="text-zinc-700 text-xs text-center mt-6">Showing {filtered.length} of {visitors.length} visitors</p>
    </div>
  )
}

function StatCard({ icon, label, value }) {
  return (
    <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800">
      <div className="text-emerald-400 mb-2">{icon}</div>
      <p className="text-2xl font-black text-white">{value}</p>
      <p className="text-zinc-500 text-xs mt-0.5">{label}</p>
    </div>
  )
}
