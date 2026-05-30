# NotAlone

> *You don't have to be alone right now.*

A real-time random video chat app built for people who are feeling lonely. Connect instantly with a real human — no sign-up, no algorithm, no dating. Just a genuine conversation.

Built with WebRTC + Firebase Firestore as the signaling layer. No backend required.

![NotAlone](https://img.shields.io/badge/WebRTC-P2P_Video-10b981?style=flat-square) ![Firebase](https://img.shields.io/badge/Firebase-Firestore-FF6F00?style=flat-square&logo=firebase) ![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react) ![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite)

---

## Features

- **Random matching** — instantly paired with a real person who's also looking to connect
- **P2P video + audio** via WebRTC (no media server, direct peer connection)
- **Next** — skip to a new person without going back to the home screen
- **Mute / Camera toggle** — control your own stream mid-call
- **Live call timer** — shows how long you've been connected
- **Dark, mobile-first UI** — works on phones and desktops
- **Auto-cleanup** — Firestore rooms are deleted when either user leaves
- **Not a dating app** — purely for human connection and conversation

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| UI | React 19 + Tailwind CSS v3 |
| Bundler | Vite 8 |
| P2P Video | WebRTC `RTCPeerConnection` |
| Signaling | Firebase Firestore (offer/answer/ICE exchange) |
| STUN | Google's free STUN servers |

---

## How It Works

```
User A                    Firestore                    User B
  │                          │                            │
  │── createWaitingRoom ────► │                            │
  │                          │ ◄── findOpenRoom ───────── │
  │                          │ ◄── claimRoom ──────────── │
  │ ◄── status: active ───── │                            │
  │                          │                            │
  │── setLocalDescription ──►│                            │
  │── write offer ──────────►│                            │
  │                          │── read offer ─────────────►│
  │                          │                            │── setRemoteDescription
  │                          │                            │── createAnswer
  │                          │◄── write answer ───────────│
  │◄── read answer ──────────│                            │
  │                          │                            │
  │◄════════ ICE candidates exchanged via Firestore ══════│
  │                          │                            │
  │◄══════════════ Direct P2P WebRTC connection ══════════│
```

---

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/ashwin2003/video-call.git
cd video-call
npm install
```

### 2. Set up Firebase

Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com), enable **Firestore**, then copy your config:

```bash
cp .env.example .env
# fill in your Firebase values in .env
```

### 3. Add Firestore security rules

In the Firebase Console → **Firestore → Rules**, add:

```
match /videoCalls/{roomId} {
  allow read, write: if true;
  match /callerCandidates/{id} {
    allow read, write: if true;
  }
  match /calleeCandidates/{id} {
    allow read, write: if true;
  }
}
```

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in two browser tabs (or two devices on the same network) to test.

---

## Project Structure

```
src/
├── lib/
│   ├── firebase.js        # Firestore init
│   └── matchmaking.js     # findOpenRoom / createWaitingRoom / claimRoom / deleteRoom
├── hooks/
│   └── useWebRTC.js       # RTCPeerConnection + Firestore signaling hook
├── pages/
│   ├── Landing.jsx        # Name entry screen
│   ├── Waiting.jsx        # Matchmaking spinner
│   └── CallRoom.jsx       # Call UI (video, controls, timer)
└── VideoApp.jsx           # State machine: landing → waiting → call
```

---

## Environment Variables

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=
```

---

## License

MIT
