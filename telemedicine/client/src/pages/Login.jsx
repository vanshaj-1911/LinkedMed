import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import api from '../api.js'

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const fill = (email, password) => setForm({ email, password })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.post('/auth/login', form)
      login(res.data.token, res.data.user)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#e0f2fe,#f0f9ff)', display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' }}>
      <div style={{ background:'#fff', borderRadius:'24px', padding:'48px', width:'100%', maxWidth:'440px', boxShadow:'0 20px 60px rgba(14,165,233,0.15)' }}>
        <div style={{ textAlign:'center', marginBottom:'32px' }}>
          <div style={{ fontSize:'48px', marginBottom:'12px' }}>🏥</div>
          <h1 style={{ fontSize:'28px', fontWeight:'800', color:'#1e293b', marginBottom:'8px' }}>Welcome Back</h1>
          <p style={{ fontSize:'15px', color:'#64748b' }}>Sign in to your LinkedMed account</p>
        </div>

        {/* Quick Login */}
        <div style={{ background:'#f8fafc', borderRadius:'12px', padding:'16px', marginBottom:'24px' }}>
          <p style={{ fontSize:'11px', color:'#94a3b8', fontWeight:'700', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:'10px' }}>Quick Demo Login</p>
          <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
            {[
              { label:'👑 Admin', email:'vanshaj7770@gmail.com', pass:'Pfl@82732' },
              { label:'🧑 Patient', email:'patient@demo.com', pass:'Patient@1234' },
              { label:'👨‍⚕️ Doctor', email:'dr.sharma@telemedicine.com', pass:'Doctor@1234' },
            ].map((q, i) => (
              <button key={i} onClick={() => fill(q.email, q.pass)}
                style={{ flex:1, minWidth:'80px', background:'#e0f2fe', color:'#0284c7', border:'none', padding:'8px 10px', borderRadius:'8px', fontSize:'12px', fontWeight:'600', cursor:'pointer' }}>
                {q.label}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'18px' }}>
          {error && <div style={{ background:'#fef2f2', color:'#dc2626', padding:'12px 16px', borderRadius:'10px', fontSize:'14px', border:'1px solid #fecaca' }}>⚠️ {error}</div>}
          <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
            <label style={{ fontSize:'14px', fontWeight:'600', color:'#374151' }}>Email Address</label>
            <input type="email" value={form.email} onChange={e => setForm({...form, email:e.target.value})}
              style={{ padding:'12px 16px', border:'1.5px solid #e2e8f0', borderRadius:'10px', fontSize:'15px', outline:'none', fontFamily:'inherit' }}
              placeholder="your@email.com" required />
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
            <label style={{ fontSize:'14px', fontWeight:'600', color:'#374151' }}>Password</label>
            <input type="password" value={form.password} onChange={e => setForm({...form, password:e.target.value})}
              style={{ padding:'12px 16px', border:'1.5px solid #e2e8f0', borderRadius:'10px', fontSize:'15px', outline:'none', fontFamily:'inherit' }}
              placeholder="••••••••" required />
          </div>
          <button type="submit" disabled={loading}
            style={{ background:'#0ea5e9', color:'#fff', border:'none', padding:'14px', borderRadius:'12px', fontSize:'16px', fontWeight:'700', cursor:'pointer', opacity: loading ? 0.7 : 1 }}>
            {loading ? '⏳ Signing in...' : 'Sign In →'}
          </button>
        </form>

        <p style={{ textAlign:'center', marginTop:'24px', fontSize:'14px', color:'#64748b' }}>
          No account? <Link to="/register" style={{ color:'#0ea5e9', fontWeight:'600', textDecoration:'none' }}>Register here</Link>
        </p>
      </div>
    </div>
  )
}
