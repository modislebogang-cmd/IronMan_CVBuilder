import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import TopBar from './components/TopBar'
import BottomNav from './components/BottomNav'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import Builder from './pages/Builder'
import Pricing from './pages/Pricing'
import Account from './pages/Account'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <Splash />
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return <>{children}</>
}

function Splash() {
  return (
    <div className="splash">
      <div className="reactor" />
      <p>Powering up…</p>
    </div>
  )
}

export default function App() {
  return (
    <div className="app-shell">
      <TopBar />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/builder"
            element={
              <RequireAuth>
                <Builder />
              </RequireAuth>
            }
          />
          <Route path="/pricing" element={<Pricing />} />
          <Route
            path="/account"
            element={
              <RequireAuth>
                <Account />
              </RequireAuth>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <BottomNav />
    </div>
  )
}
