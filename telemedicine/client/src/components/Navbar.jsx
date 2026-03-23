import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const s = {
    nav: { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 32px', height:'64px', background:'#0ea5e9', boxShadow:'0 2px 12px rgba(14,165,233,0.3)', position:'sticky', top:0, zIndex:100 },
    brand: { display:'flex', alignItems:'center', gap:'8px' },
    logo: { fontSize:'24px' },
    brandText: { fontSize:'22px', fontWeight:'800', color:'#fff', textDecoration:'none' },
    subtitle: { fontSize:'11px', color:'rgba(255,255,255,0.8)', background:'rgba(255,255,255,0.15)', padding:'2px 8px', borderRadius:'12px' },
    links: { display:'flex', alignItems:'center', gap:'8px' },
    link: { color:'rgba(255,255,255,0.9)', textDecoration:'none', padding:'6px 14px', borderRadius:'8px', fontSize:'14px', fontWeight:'500' },
    registerBtn: { background:'#fff', color:'#0ea5e9', textDecoration:'none', padding:'7px 18px', borderRadius:'8px', fontSize:'14px', fontWeight:'700' },
    userBadge: { background:'rgba(255,255,255,0.2)', color:'#fff', padding:'5px 12px', borderRadius:'20px', fontSize:'13px', fontWeight:'600' },
    logoutBtn: { background:'rgba(255,255,255,0.15)', color:'#fff', border:'1px solid rgba(255,255,255,0.3)', padding:'6px 16px', borderRadius:'8px', fontSize:'14px', cursor:'pointer' }
  }

  return (
    <nav style={s.nav}>
      <div style={s.brand}>
        <span style={s.logo}>🏥</span>
        <Link to="/" style={s.brandText}>LinkedMed</Link>
        <span style={s.subtitle}>INDIA</span>
      </div>
      <div style={s.links}>
        <Link to="/" style={s.link}>Home</Link>
        <Link to="/doctors" style={s.link}>Doctors</Link>
        {user ? (
          <>
            <Link to="/dashboard" style={s.link}>Dashboard</Link>
            <span style={s.userBadge}>{user.name ? user.name.split(' ')[0] : 'User'}</span>
            <button onClick={handleLogout} style={s.logoutBtn}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login" style={s.link}>Login</Link>
            <Link to="/register" style={s.registerBtn}>Register</Link>
          </>
        )}
      </div>
    </nav>
  )
}
