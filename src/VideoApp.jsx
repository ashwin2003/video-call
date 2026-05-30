import { useState, useRef } from 'react'
import Landing  from './pages/Landing'
import Waiting  from './pages/Waiting'
import CallRoom from './pages/CallRoom'
import { logVisitor } from './lib/analytics'

export default function VideoApp() {
  const [phase, setPhase]             = useState('landing')
  const [displayName, setDisplayName] = useState('')
  const [roomId, setRoomId]           = useState(null)
  const [isCaller, setIsCaller]       = useState(false)
  const preloadedStreamRef            = useRef(null)

  // Called directly from the button tap — getUserMedia here triggers the
  // permission prompt while we're still inside a user gesture on mobile.
  async function handleStart(name) {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    preloadedStreamRef.current = stream
    logVisitor(name) // fire-and-forget, never blocks
    setDisplayName(name)
    setPhase('waiting')
  }

  function handleMatched({ roomId: id, isCaller: caller }) {
    setRoomId(id)
    setIsCaller(caller)
    setPhase('call')
  }

  function handleNext() {
    preloadedStreamRef.current = null
    setRoomId(null)
    setPhase('waiting')
  }

  function handleLeave() {
    preloadedStreamRef.current = null
    setRoomId(null)
    setDisplayName('')
    setPhase('landing')
  }

  if (phase === 'landing') return <Landing onStart={handleStart} />
  if (phase === 'waiting') return (
    <Waiting displayName={displayName} onMatched={handleMatched} onLeave={handleLeave} />
  )
  if (phase === 'call') return (
    <CallRoom
      roomId={roomId}
      isCaller={isCaller}
      displayName={displayName}
      initialStream={preloadedStreamRef.current}
      onNext={handleNext}
      onLeave={handleLeave}
    />
  )
  return null
}
