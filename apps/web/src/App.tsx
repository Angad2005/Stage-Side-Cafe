import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import { ExplorePage } from './pages/explore/ExplorePage'
import { ViewerPage } from './pages/viewer/ViewerPage'
import { StudioPage } from './pages/studio/StudioPage'
import { CommunitiesPage } from './pages/communities/CommunitiesPage'
import { ProfilePage } from './pages/profile/ProfilePage'
import { LoginPage } from './pages/auth/LoginPage'
import { CallbackPage } from './pages/auth/CallbackPage'

export function App() {
  return (
    <Routes>
      <Route path="/" element={<AppLayout />}>
        <Route index element={<ExplorePage />} />
        <Route path="watch/:streamId" element={<ViewerPage />} />
        <Route path="studio" element={<StudioPage />} />
        <Route path="communities" element={<CommunitiesPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/auth/callback" element={<CallbackPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
