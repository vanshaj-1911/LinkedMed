import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import Navbar from './components/Navbar.jsx'
import MediGuide from './components/MediGuide.jsx'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import Doctors from './pages/Doctors.jsx'
import BookAppointment from './pages/BookAppointment.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Payment from './pages/Payment.jsx'
import VideoCall from './pages/VideoCall.jsx'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div style={{ textAlign:'center', padding:'80px', fontSize:'20px' }}>⏳ Loading...</div>
  return user ? children : <Navigate to="/login" replace />
}

function WithNav({ children }) {
  return (
    <>
      <Navbar />
      {children}
      <MediGuide />
    </>
  )
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/"          element={<WithNav><Home /></WithNav>} />
      <Route path="/login"     element={<WithNav><Login /></WithNav>} />
      <Route path="/register"  element={<WithNav><Register /></WithNav>} />
      <Route path="/doctors"   element={<WithNav><Doctors /></WithNav>} />
      <Route path="/book/:id"  element={<WithNav><BookAppointment /></WithNav>} />
      <Route path="/payment"   element={<WithNav><PrivateRoute><Payment /></PrivateRoute></WithNav>} />
      <Route path="/dashboard" element={<WithNav><PrivateRoute><Dashboard /></PrivateRoute></WithNav>} />
      {/* Video call is full screen — no Navbar, no MediGuide */}
      <Route path="/call/:appointmentId" element={<PrivateRoute><VideoCall /></PrivateRoute>} />
      <Route path="*"          element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  )
}
