import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import React from 'react'
import './index.css'
import App from './App.jsx'
import { registerServiceWorker } from './registerServiceWorker.js'
import { startAppVersionChecks } from './utils/appVersion.js'

registerServiceWorker()
startAppVersionChecks()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
