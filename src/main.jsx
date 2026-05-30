import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import VideoApp from './VideoApp'
import Admin from './pages/Admin'

const isAdmin = window.location.pathname === '/admin'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {isAdmin ? <Admin /> : <VideoApp />}
  </StrictMode>
)
