import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import api from '../api.js'

export default function Register() {
  const [form, setForm] = useState({ full_name:'', email:'', password:'', phone:'', age:'', gender:'', blood_group:'' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const f = (key, val) => setForm({ ...form, [key]: val })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return }
    setError(''); setLoading(true)
    try {
      const res = await api.post('/auth/register', { ...form, role: 'patient' })
      login(res.data.token, res.data.user)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const inp = { padding:'11px 14px', border:'1.5px solid #e2e8f0', borderRadius:'10px', fontSize:'14px', outline:'none', fontFamily:'inherit', width:'100%' }

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#e0f2fe,#f0f9ff)', display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' }}>
      <div style={{ background:'#fff', borderRadius:'24px', padding:'48px', width:'100%', maxWidth:'560px', boxShadow:'0 20px 60px rgba(14,165,233,0.15)' }}>
        <div style={{ textAlign:'center', marginBottom:'32px' }}>
          <div style={{ fontSize:'48px', marginBottom:'12px' }}>🏥</div>
          <h1 style={{ fontSize:'28px', fontWeight:'800', color:'#1e293b', marginBottom:'8px' }}>Create Account</h1>
          <p style={{ fontSize:'15px', color:'#64748b' }}>Register as a patient on LinkedMed</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
          {error && <div style={{ background:'#fef2f2', color:'#dc2626', padding:'12px 16px', borderRadius:'10px', fontSize:'14px', border:'1px solid #fecaca' }}>⚠️ {error}</div>}

          <div style={{ display:'flex', gap:'12px' }}>
            <div style={{ flex:1 }}>
              <label style={{ fontSize:'13px', fontWeight:'600', color:'#374151', display:'block', marginBottom:'6px' }}>Full Name *</label>
              <input style={inp} placeholder="Your full name" value={form.full_name} onChange={e => f('full_name', e.target.value)} required />
            </div>
            <div style={{ flex:1 }}>
              <label style={{ fontSize:'13px', fontWeight:'600', color:'#374151', display:'block', marginBottom:'6px' }}>Phone</label>
              <input style={inp} placeholder="Mobile number" value={form.phone} onChange={e => f('phone', e.target.value)} />
            </div>
          </div>

          <div>
            <label style={{ fontSize:'13px', fontWeight:'600', color:'#374151', display:'block', marginBottom:'6px' }}>Email Address *</label>
            <input style={inp} type="email" placeholder="your@email.com" value={form.email} onChange={e => f('email', e.target.value)} required />
          </div>

          <div>
            <label style={{ fontSize:'13px', fontWeight:'600', color:'#374151', display:'block', marginBottom:'6px' }}>Password *</label>
            <input style={inp} type="password" placeholder="Min 6 characters" value={form.password} onChange={e => f('password', e.target.value)} required />
          </div>

          <div style={{ display:'flex', gap:'12px' }}>
            <div style={{ flex:1 }}>
              <label style={{ fontSize:'13px', fontWeight:'600', color:'#374151', display:'block', marginBottom:'6px' }}>Age</label>
              <input style={inp} type="number" placeholder="Age" value={form.age} onChange={e => f('age', e.target.value)} min="1" max="120" />
            </div>
            <div style={{ flex:1 }}>
              <label style={{ fontSize:'13px', fontWeight:'600', color:'#374151', display:'block', marginBottom:'6px' }}>Gender</label>
              <select style={inp} value={form.gender} onChange={e => f('gender', e.target.value)}>
                <option value="">Select</option>
                <option>Male</option><option>Female</option><option>Other</option>
              </select>
            </div>
            <div style={{ flex:1 }}>
              <label style={{ fontSize:'13px', fontWeight:'600', color:'#374151', display:'block', marginBottom:'6px' }}>Blood Group</label>
              <select style={inp} value={form.blood_group} onChange={e => f('blood_group', e.target.value)}>
                <option value="">Select</option>
                {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(bg => <option key={bg}>{bg}</option>)}
              </select>
            </div>
          </div>

          <button type="submit" disabled={loading}
            style={{ background:'#0ea5e9', color:'#fff', border:'none', padding:'14px', borderRadius:'12px', fontSize:'16px', fontWeight:'700', cursor:'pointer', marginTop:'4px', opacity: loading ? 0.7 : 1 }}>
            {loading ? '⏳ Creating account...' : 'Create Account →'}
          </button>
        </form>

        <p style={{ textAlign:'center', marginTop:'24px', fontSize:'14px', color:'#64748b' }}>
          Already have an account? <Link to="/login" style={{ color:'#0ea5e9', fontWeight:'600', textDecoration:'none' }}>Sign in</Link>
        </p>
      </div>
    </div>
  )
}
