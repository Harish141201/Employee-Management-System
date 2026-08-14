
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-icons/font/bootstrap-icons.css';
import './style/app-theme.css'

const storedTheme = localStorage.getItem('peoplehub_theme') || 'light'
document.documentElement.dataset.theme = storedTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : storedTheme

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
