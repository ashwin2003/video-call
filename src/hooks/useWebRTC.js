import { useEffect, useRef, useState, useCallback } from 'react'
import {
  doc, collection, addDoc, onSnapshot, setDoc,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import { deleteRoom } from '../lib/matchmaking'

const TURN_USER = import.meta.env.VITE_TURN_USERNAME
const TURN_CRED = import.meta.env.VITE_TURN_CREDENTIAL

const STUN_SERVERS = {
  iceServers: [
    { urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'] },
    { urls: 'turn:relay.metered.ca:80',                    username: TURN_USER, credential: TURN_CRED },
    { urls: 'turn:relay.metered.ca:80?transport=tcp',      username: TURN_USER, credential: TURN_CRED },
    { urls: 'turn:relay.metered.ca:443',                   username: TURN_USER, credential: TURN_CRED },
    { urls: 'turn:relay.metered.ca:443?transport=tcp',     username: TURN_USER, credential: TURN_CRED },
    { urls: 'turns:relay.metered.ca:443?transport=tcp',    username: TURN_USER, credential: TURN_CRED },
  ],
}

export function useWebRTC({ roomId, isCaller }) {
  const [localStream, setLocalStream]             = useState(null)
  const [remoteStream, setRemoteStream]           = useState(null)
  const [remoteDisplayName, setRemoteDisplayName] = useState('')
  const [connectionState, setConnectionState]     = useState('new')
  const [isMuted, setIsMuted]                     = useState(false)
  const [isCameraOff, setIsCameraOff]             = useState(false)
  const [mediaError, setMediaError]               = useState(null)

  const pcRef          = useRef(null)
  const localStreamRef = useRef(null)
  const unsubsRef      = useRef([])
  const isHungUp       = useRef(false)

  const cleanupLocal = useCallback(() => {
    unsubsRef.current.forEach(u => u())
    unsubsRef.current = []
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop())
      localStreamRef.current = null
    }
    if (pcRef.current) {
      pcRef.current.close()
      pcRef.current = null
    }
  }, [])

  const hangUp = useCallback(async () => {
    if (isHungUp.current) return
    isHungUp.current = true
    cleanupLocal()
    if (roomId) await deleteRoom(roomId)
  }, [roomId, cleanupLocal])

  useEffect(() => {
    if (!roomId) return
    isHungUp.current = false

    let cancelled = false
    const pendingCandidates = []

    async function flushCandidates(pc) {
      while (pendingCandidates.length) {
        await pc.addIceCandidate(pendingCandidates.shift()).catch(() => {})
      }
    }

    async function init() {
      let stream
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      } catch (err) {
        if (!cancelled) setMediaError(
          err.name === 'NotAllowedError'
            ? 'Camera/mic access denied. Please allow it in your browser and refresh.'
            : `Could not access camera: ${err.message}`
        )
        return
      }
      if (cancelled) { stream.getTracks().forEach(t => t.stop()); return }

      localStreamRef.current = stream
      setLocalStream(stream)

      const pc = new RTCPeerConnection(STUN_SERVERS)
      pcRef.current = pc

      stream.getTracks().forEach(track => pc.addTrack(track, stream))

      const remStream = new MediaStream()
      setRemoteStream(remStream)
      pc.ontrack = ({ streams }) =>
        streams[0].getTracks().forEach(t => remStream.addTrack(t))

      pc.onconnectionstatechange = () => {
        if (!cancelled) setConnectionState(pc.connectionState)
      }

      const roomRef = doc(db, 'videoCalls', roomId)

      if (isCaller) {
        const callerCandCol = collection(db, 'videoCalls', roomId, 'callerCandidates')
        pc.onicecandidate = ({ candidate }) => {
          if (candidate) addDoc(callerCandCol, candidate.toJSON()).catch(() => {})
        }

        const offer = await pc.createOffer()
        await pc.setLocalDescription(offer)
        await setDoc(roomRef, { offer: { type: offer.type, sdp: offer.sdp } }, { merge: true })

        const unsubRoom = onSnapshot(roomRef, async snap => {
          if (!snap.exists()) return
          const data = snap.data()
          if (data.calleeName) setRemoteDisplayName(data.calleeName)
          if (data.answer && !pc.currentRemoteDescription) {
            await pc.setRemoteDescription(new RTCSessionDescription(data.answer))
            await flushCandidates(pc)
          }
        })
        unsubsRef.current.push(unsubRoom)

        const calleeCandCol = collection(db, 'videoCalls', roomId, 'calleeCandidates')
        const unsubCallee = onSnapshot(calleeCandCol, snap => {
          snap.docChanges().forEach(({ type, doc: d }) => {
            if (type !== 'added') return
            const c = new RTCIceCandidate(d.data())
            pc.currentRemoteDescription
              ? pc.addIceCandidate(c).catch(() => {})
              : pendingCandidates.push(c)
          })
        })
        unsubsRef.current.push(unsubCallee)

      } else {
        const calleeCandCol = collection(db, 'videoCalls', roomId, 'calleeCandidates')
        pc.onicecandidate = ({ candidate }) => {
          if (candidate) addDoc(calleeCandCol, candidate.toJSON()).catch(() => {})
        }

        const unsubRoom = onSnapshot(roomRef, async snap => {
          if (!snap.exists()) return
          const data = snap.data()
          if (data.callerName) setRemoteDisplayName(data.callerName)
          if (data.offer && !pc.currentRemoteDescription) {
            await pc.setRemoteDescription(new RTCSessionDescription(data.offer))
            const answer = await pc.createAnswer()
            await pc.setLocalDescription(answer)
            await setDoc(roomRef, { answer: { type: answer.type, sdp: answer.sdp } }, { merge: true })
            await flushCandidates(pc)
          }
        })
        unsubsRef.current.push(unsubRoom)

        const callerCandCol = collection(db, 'videoCalls', roomId, 'callerCandidates')
        const unsubCaller = onSnapshot(callerCandCol, snap => {
          snap.docChanges().forEach(({ type, doc: d }) => {
            if (type !== 'added') return
            const c = new RTCIceCandidate(d.data())
            pc.currentRemoteDescription
              ? pc.addIceCandidate(c).catch(() => {})
              : pendingCandidates.push(c)
          })
        })
        unsubsRef.current.push(unsubCaller)
      }
    }

    init().catch(console.error)

    return () => {
      cancelled = true
      cleanupLocal()
    }
  }, [roomId, isCaller, cleanupLocal])

  const toggleMute = useCallback(() => {
    if (!localStreamRef.current) return
    localStreamRef.current.getAudioTracks().forEach(t => { t.enabled = !t.enabled })
    setIsMuted(v => !v)
  }, [])

  const toggleCamera = useCallback(() => {
    if (!localStreamRef.current) return
    localStreamRef.current.getVideoTracks().forEach(t => { t.enabled = !t.enabled })
    setIsCameraOff(v => !v)
  }, [])

  return {
    localStream, remoteStream, remoteDisplayName,
    connectionState, isMuted, isCameraOff, mediaError,
    toggleMute, toggleCamera, hangUp,
  }
}
