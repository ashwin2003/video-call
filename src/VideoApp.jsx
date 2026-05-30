import { useState } from 'react'
import Landing  from './pages/Landing'
import Waiting  from './pages/Waiting'
import CallRoom from './pages/CallRoom'

export default function VideoApp() {
  const [phase, setPhase]             = useState('landing')
  const [displayName, setDisplayName] = useState('')
  const [roomId, setRoomId]           = useState(null)
  const [isCaller, setIsCaller]       = useState(false)

  function handleStart(name) {
    setDisplayName(name)
    setPhase('waiting')
  }

  function handleMatched({ roomId: id, isCaller: caller }) {
    setRoomId(id)
    setIsCaller(caller)
    setPhase('call')
  }

  function handleNext() {
    setRoomId(null)
    setPhase('waiting')
  }

  function handleLeave() {
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
      onNext={handleNext}
      onLeave={handleLeave}
    />
  )
  return null
}
