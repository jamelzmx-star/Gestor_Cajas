import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App.jsx'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import { AppProvider } from './context/AppContext.jsx'
import './index.css'

// Puente: toma el userId de AuthContext y lo pasa a AppProvider.
// La prop key={userId} hace que AppProvider se reinicie completamente
// al cambiar de usuario, cargando los datos correctos de localStorage.
function AppConUsuario() {
  const { user } = useAuth()
  return (
    <AppProvider key={user?.id ?? 'sin-sesion'} userId={user?.id}>
      <App />
    </AppProvider>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <AuthProvider>
        <AppConUsuario />
      </AuthProvider>
    </HashRouter>
  </React.StrictMode>,
)
