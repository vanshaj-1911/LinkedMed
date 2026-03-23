import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import api from '../api.js'

export default function Dashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [appointments, setAppointments] = useState([])
  const [prescriptions, setPrescriptions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    loadData()
  }, [user])

  const loadData = async () => {
    try {
      if (user.role === 'patient' || user.role === 'admin') {
        const [aRes, pRes] = await Promise.all([api.get('/appointments/my'), api.get('/prescriptions/my')])
        setAppointments(aRes.data)
        setPrescriptions(pRes.data)
      } else if (user.role === 'doctor') {
        const aRes = await api.get('/appointments/doctor')
        setAppointments(aRes.data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const cancelAppt = async (id) => {
    if (!window.confirm('Cancel this appointment?')) return
    await api.patch(`/appointments/${id}/status`, { status: 'cancelled' })
    loadData()
  }

  const statusColor = { pending:'#f59e0b', confirmed:'#0ea5e9', completed:'#22c55e', cancelled:'#ef4444' }
  const statusBg    = { pending:'#fef3c7', confirmed:'#e0f2fe', completed:'#dcfce7', cancelled:'#fef2f2' }

  if (!user) return null

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'#f8fafc' }}>

      {/* Sidebar */}
      <div style={{ width:'240px', background:'#1e293b', padding:'20px', display:'flex', flexDirection:'column', gap:'12px', flexShrink:0 }}>
        <div style={{ background:'rgba(255,255,255,0.07)', borderRadius:'12px', padding:'16px' }}>
          <div style={{ width:'44px', height:'44px', background:'#0ea5e9', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px', fontWeight:'700', color:'#fff', marginBottom:'10px' }}>
            {user.name ? user.name.charAt(0) : '?'}
          </div>
          <div style={{ fontWeight:'700', color:'#fff', fontSize:'14px' }}>{user.name}</div>
          <div style={{ fontSize:'11px', color:'#0ea5e9', fontWeight:'600', textTransform:'uppercase', background:'rgba(14,165,233,0.15)', padding:'2px 8px', borderRadius:'6px', display:'inline-block', margin:'4px 0' }}>{user.role}</div>
          <div style={{ fontSize:'11px', color:'#94a3b8', wordBreak:'break-all' }}>{user.email}</div>
        </div>
        <Link to="/doctors" style={{ color:'#94a3b8', padding:'10px 12px', borderRadius:'8px', fontSize:'14px', fontWeight:'500', textDecoration:'none', display:'block' }}>👨‍⚕️ Find Doctors</Link>
        <div style={{ flex:1 }} />
        <button onClick={() => { logout(); navigate('/') }}
          style={{ background:'rgba(239,68,68,0.15)', color:'#fca5a5', border:'none', padding:'10px 16px', borderRadius:'8px', cursor:'pointer', fontSize:'14px', fontWeight:'600', textAlign:'left' }}>
          🚪 Logout
        </button>
      </div>

      {/* Main */}
      <div style={{ flex:1, padding:'32px', overflowY:'auto' }}>
        <h1 style={{ fontSize:'30px', fontWeight:'800', color:'#1e293b', marginBottom:'4px' }}>
          {user.role === 'admin' ? '👑 Admin Dashboard' : user.role === 'doctor' ? '👨‍⚕️ Doctor Dashboard' : '🧑 Patient Dashboard'}
        </h1>
        <p style={{ fontSize:'16px', color:'#64748b', marginBottom:'28px' }}>Welcome back, {user.name ? user.name.split(' ')[0] : 'User'}!</p>

        {/* Stats */}
        <div style={{ display:'flex', gap:'16px', marginBottom:'28px', flexWrap:'wrap' }}>
          {[
            { num: appointments.length, label: 'Total Appointments' },
            { num: appointments.filter(a=>a.status==='confirmed').length, label: 'Confirmed' },
            { num: appointments.filter(a=>a.status==='completed').length, label: 'Completed' },
            ...(user.role==='patient' || user.role==='admin' ? [{ num: prescriptions.length, label: 'Prescriptions' }] : []),
          ].map((s,i) => (
            <div key={i} style={{ flex:1, minWidth:'140px', background:'#fff', borderRadius:'16px', padding:'24px', boxShadow:'0 2px 8px rgba(0,0,0,0.06)', textAlign:'center' }}>
              <div style={{ fontSize:'36px', fontWeight:'800', color:'#0ea5e9' }}>{s.num}</div>
              <div style={{ fontSize:'13px', color:'#64748b', fontWeight:'500', marginTop:'4px' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Admin panel */}
        {user.role === 'admin' && (
          <div style={{ background:'#fff', borderRadius:'16px', padding:'24px', marginBottom:'24px', boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
            <h3 style={{ fontSize:'18px', fontWeight:'700', color:'#1e293b', marginBottom:'12px' }}>🔐 Admin Control Panel</h3>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:'12px' }}>
              {[
                { icon:'👨‍⚕️', label:'Active Doctors', val:'4' },
                { icon:'🧑',   label:'Registered Patients', val:'2+' },
                { icon:'📊',   label:'Platform Status', val:'✅ Online' },
                { icon:'🔒',   label:'Security', val:'JWT + SSL' },
              ].map((item,i) => (
                <div key={i} style={{ display:'flex', gap:'12px', alignItems:'center', background:'#f8fafc', padding:'14px', borderRadius:'10px' }}>
                  <span style={{ fontSize:'24px' }}>{item.icon}</span>
                  <div>
                    <div style={{ fontSize:'12px', color:'#64748b' }}>{item.label}</div>
                    <div style={{ fontSize:'15px', fontWeight:'700', color:'#1e293b' }}>{item.val}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Appointments */}
        <div style={{ background:'#fff', borderRadius:'16px', padding:'24px', marginBottom:'24px', boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' }}>
            <h2 style={{ fontSize:'20px', fontWeight:'700', color:'#1e293b' }}>{user.role==='doctor' ? 'Patient Appointments' : 'My Appointments'}</h2>
            {user.role === 'patient' && <Link to="/doctors" style={{ background:'#0ea5e9', color:'#fff', padding:'8px 18px', borderRadius:'8px', textDecoration:'none', fontWeight:'600', fontSize:'14px' }}>+ Book New</Link>}
          </div>

          {loading ? <p style={{ textAlign:'center', color:'#64748b', padding:'32px' }}>⏳ Loading...</p>
          : appointments.length === 0 ? (
            <div style={{ textAlign:'center', padding:'40px', color:'#94a3b8' }}>
              <div style={{ fontSize:'48px', marginBottom:'12px' }}>📅</div>
              <p>No appointments yet.</p>
              {user.role==='patient' && <Link to="/doctors" style={{ color:'#0ea5e9', fontWeight:'600' }}>Book your first appointment →</Link>}
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
              {appointments.map(a => (
                <div key={a.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', padding:'16px', background:'#f8fafc', borderRadius:'12px', border:'1px solid #e2e8f0', flexWrap:'wrap', gap:'12px' }}>
                  <div style={{ display:'flex', gap:'14px', flex:1 }}>
                    <div style={{ fontSize:'28px', flexShrink:0 }}>{a.consultation_type==='video' ? '📹' : a.consultation_type==='audio' ? '🎙️' : '💬'}</div>
                    <div>
                      <div style={{ fontWeight:'700', color:'#1e293b', fontSize:'15px' }}>
                        {user.role==='doctor' ? `Patient: ${a.patient_name}` : `Dr. ${a.doctor_name}`}
                      </div>
                      <div style={{ fontSize:'13px', color:'#0ea5e9', fontWeight:'500', margin:'2px 0' }}>
                        {user.role==='doctor' ? `${a.gender || ''} • Age ${a.age || '?'}` : a.specialization}
                      </div>
                      <div style={{ fontSize:'13px', color:'#64748b' }}>📅 {a.appointment_date} at {a.appointment_time}</div>
                      {a.symptoms && <div style={{ fontSize:'13px', color:'#94a3b8', marginTop:'4px' }}>🩺 {a.symptoms}</div>}
                    </div>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap:'8px', alignItems:'flex-end' }}>
                    <span style={{ padding:'4px 12px', borderRadius:'20px', fontSize:'11px', fontWeight:'700', background: statusBg[a.status], color: statusColor[a.status] }}>
                      {a.status.toUpperCase()}
                    </span>
                    {a.status === 'confirmed' && (
                      <>
                        <button onClick={() => navigate(`/call/${a.id}`)}
                          style={{ background:'#0ea5e9', color:'#fff', border:'none', padding:'6px 14px', borderRadius:'8px', fontSize:'13px', fontWeight:'600', cursor:'pointer' }}>
                          📹 Join Call
                        </button>
                        {user.role==='patient' && (
                          <button onClick={() => cancelAppt(a.id)}
                            style={{ background:'#fef2f2', color:'#dc2626', border:'none', padding:'6px 12px', borderRadius:'6px', fontSize:'12px', fontWeight:'600', cursor:'pointer' }}>
                            Cancel
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Prescriptions */}
        {(user.role === 'patient' || user.role === 'admin') && (
          <div style={{ background:'#fff', borderRadius:'16px', padding:'24px', boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
            <h2 style={{ fontSize:'20px', fontWeight:'700', color:'#1e293b', marginBottom:'20px' }}>💊 My Prescriptions</h2>
            {prescriptions.length === 0 ? (
              <div style={{ textAlign:'center', padding:'40px', color:'#94a3b8' }}>
                <div style={{ fontSize:'48px', marginBottom:'12px' }}>💊</div>
                <p>No prescriptions yet.</p>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
                {prescriptions.map(p => (
                  <div key={p.id} style={{ border:'1.5px solid #e2e8f0', borderRadius:'12px', padding:'20px', display:'flex', flexDirection:'column', gap:'10px' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                      <div>
                        <div style={{ fontWeight:'700', fontSize:'16px', color:'#1e293b' }}>Dr. {p.doctor_name} — {p.specialization}</div>
                        <div style={{ fontSize:'13px', color:'#94a3b8', marginTop:'4px' }}>{new Date(p.created_at).toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' })}</div>
                      </div>
                      <div style={{ background:'#0ea5e9', color:'#fff', padding:'4px 12px', borderRadius:'8px', fontWeight:'800', fontSize:'16px', fontStyle:'italic' }}>Rx</div>
                    </div>
                    {p.diagnosis && <div style={{ background:'#fef3c7', padding:'8px 12px', borderRadius:'8px', fontSize:'14px', color:'#374151' }}>🩺 {p.diagnosis}</div>}
                    <div style={{ fontSize:'14px', fontWeight:'500', color:'#374151' }}>💊 {p.medicines}</div>
                    {p.instructions && <div style={{ fontSize:'13px', color:'#64748b' }}>📝 {p.instructions}</div>}
                    {p.follow_up_date && <div style={{ fontSize:'13px', color:'#0ea5e9', fontWeight:'600' }}>📅 Follow-up: {p.follow_up_date}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
