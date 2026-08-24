import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { MainLayout } from './layouts/MainLayout'
import { AuthLayout } from './layouts/AuthLayout'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { Dashboard } from './pages/Dashboard'
import { Assessment } from './pages/Assessment'
import { HealthProfile } from './pages/HealthProfile'
import { History } from './pages/History'
import { HealthCard } from './pages/HealthCard'
import { Profile } from './pages/Profile'
import { Login } from './pages/Login'
import { Signup } from './pages/Signup'
import { PublicHealthCard } from './pages/PublicHealthCard'
import { NotFound } from './pages/NotFound'

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Health Card Emergency View (QR Scans) */}
        <Route path="/health-card/:token" element={<PublicHealthCard />} />

        {/* Public Authentication routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/login/*" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/signup/*" element={<Signup />} />
        </Route>

        {/* Protected Application routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/health-profile" element={<HealthProfile />} />
            <Route path="/assessment" element={<Assessment />} />
            <Route path="/history" element={<History />} />
            <Route path="/health-card" element={<HealthCard />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
        </Route>

        {/* Catch all */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
