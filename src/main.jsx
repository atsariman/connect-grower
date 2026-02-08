import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
// Removed default index.css import as we import styles/index.css in App.jsx

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
