import {
  collection, doc, addDoc, updateDoc, getDocs, deleteDoc,
  query, where, limit, serverTimestamp, runTransaction,
} from 'firebase/firestore'
import { db } from './firebase'

const videoCallsCol = collection(db, 'videoCalls')

export async function findOpenRoom() {
  const q = query(videoCallsCol, where('status', '==', 'waiting'), limit(10))
  const snap = await getDocs(q)
  if (snap.empty) return null

  const fiveMinutesAgo = Date.now() - 5 * 60 * 1000
  const fresh = snap.docs.filter(d => {
    const ms = d.data().createdAt?.toMillis?.()
    return !ms || ms > fiveMinutesAgo
  })
  if (fresh.length === 0) return null
  return fresh[Math.floor(Math.random() * fresh.length)].id
}

export async function createWaitingRoom(callerName) {
  const ref = await addDoc(videoCallsCol, {
    callerName,
    calleeName: null,
    status: 'waiting',
    offer: null,
    answer: null,
    createdAt: serverTimestamp(),
  })
  return ref.id
}

export async function claimRoom(roomId, calleeName) {
  const roomRef = doc(db, 'videoCalls', roomId)
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(roomRef)
    if (!snap.exists() || snap.data().status !== 'waiting') {
      throw new Error('ROOM_TAKEN')
    }
    tx.update(roomRef, { calleeName, status: 'active' })
  })
}

export async function deleteRoom(roomId) {
  const [callerSnap, calleeSnap] = await Promise.all([
    getDocs(collection(db, 'videoCalls', roomId, 'callerCandidates')),
    getDocs(collection(db, 'videoCalls', roomId, 'calleeCandidates')),
  ])
  const deletes = []
  callerSnap.forEach(d => deletes.push(deleteDoc(d.ref)))
  calleeSnap.forEach(d => deletes.push(deleteDoc(d.ref)))
  await Promise.all(deletes)
  await deleteDoc(doc(db, 'videoCalls', roomId)).catch(() => {})
}
