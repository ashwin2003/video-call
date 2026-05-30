import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from './firebase'

export async function logVisitor(name) {
  try {
    // Free IP geolocation — no API key needed, 1000 req/day
    const geo = await fetch('https://ipapi.co/json/').then(r => r.json()).catch(() => ({}))
    await addDoc(collection(db, 'visitors'), {
      name,
      country:   geo.country_name  ?? null,
      city:      geo.city          ?? null,
      region:    geo.region        ?? null,
      ip:        geo.ip            ?? null,
      joinedAt:  serverTimestamp(),
    })
  } catch {
    // Non-critical — never block the user flow
  }
}
