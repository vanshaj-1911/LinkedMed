import React, { useState } from 'react'
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import api from '../api.js'

export default function BookAppointment() {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const doctor = location.state?.doctor

  const [form, setForm] = useState({ appointment_date:'', appointment_time:'', consultation_type:'video', symptoms:'' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const slots = ['09:00','10:00','11:00','12:00','14:00','15:00','16:00','17:00']
  const types = [
    { val:'video', label:'📹 Video Call', desc:'HD video consultation' },
    { val:'audio', label:'🎙️ Audio Call', desc:'Voice-only call' },
    { val:'chat',  label:'💬 Chat',       desc:'Text-based' },
  ]
  const minDate = new Date().toISOString().split('T')[0]

  const handleBook = async (e) => {
    e.preventDefault()
    if (!user) { navigate('/login'); return }
    if (!form.appointment_time) { setError('Please select a time slot'); return }
    setError(''); setLoading(true)
    try {
      const res = await api.post('/appointments', { doctor_id: id, ...form })
      navigate('/payment', { state: { doctor, appointmentData: form, appointmentId: res.data.id } })
    } catch (err) {
      setError(err.response?.data?.message || 'Booking failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!doctor) return (
    <div style={{ textAlign:'center', padding:'80px', color:'#64748b' }}>
      <p>No doctor selected.</p><br />
      <Link to="/doctors" style={{ color:'#0ea5e9' }}>← Browse Doctors</Link>
    </div>
  )

  return (
    <div style={{ minHeight:'100vh', background:'#f8fafc', padding:'40px 24px' }}>
      <div style={{ maxWidth:'660px', margin:'0 auto', display:'flex', flexDirection:'column', gap:'24px' }}>

        {/* Doctor card */}
        <div style={{ background:'#fff', borderRadius:'20px', padding:'24px', display:'flex', gap:'20px', alignItems:'center', boxShadow:'0 4px 16px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize:'48px', background:'#e0f2fe', borderRadius:'16px', padding:'12px', lineHeight:'1' }}>👨‍⚕️</div>
          <div>
            <h2 style={{ fontSize:'22px', fontWeight:'700', color:'#1e293b' }}>{doctor.full_name}</h2>
            <p style={{ fontSize:'14px', color:'#64748b', margin:'4px 0' }}>{doctor.specialization} • {doctor.experience_years} yrs exp</p>
            <p style={{ fontSize:'14px', fontWeight:'700', color:'#059669' }}>💰 ₹{doctor.consultation_fee} / session &nbsp; ⭐ {doctor.rating}</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleBook} style={{ background:'#fff', borderRadius:'20px', padding:'32px', boxShadow:'0 4px 16px rgba(0,0,0,0.06)', display:'flex', flexDirection:'column', gap:'24px' }}>
          <h2 style={{ fontSize:'22px', fontWeight:'700', color:'#1e293b' }}>Book Your Appointment</h2>

          {error && <div style={{ background:'#fef2f2', color:'#dc2626', padding:'12px', borderRadius:'10px', fontSize:'14px', border:'1px solid #fecaca' }}>⚠️ {error}</div>}
          {!user && <div style={{ background:'#fff7ed', color:'#c2410c', padding:'12px', borderRadius:'10px', fontSize:'14px' }}>⚠️ Please <Link to="/login">login</Link> to book.</div>}

          {/* Consultation type */}
          <div>
            <label style={{ fontSize:'14px', fontWeight:'600', color:'#374151', display:'block', marginBottom:'10px' }}>Consultation Type</label>
            <div style={{ display:'flex', gap:'12px', flexWrap:'wrap' }}>
              {types.map(t => (
                <div key={t.val} onClick={() => setForm({...form, consultation_type:t.val})}
                  style={{ flex:1, minWidth:'120px', padding:'14px', border:`2px solid ${form.consultation_type===t.val ? '#0ea5e9' : '#e2e8f0'}`, borderRadius:'12px', cursor:'pointer', textAlign:'center', background: form.consultation_type===t.val ? '#e0f2fe' : '#fff' }}>
                  <div style={{ fontSize:'15px', fontWeight:'600', color:'#1e293b' }}>{t.label}</div>
                  <div style={{ fontSize:'12px', color:'#94a3b8', marginTop:'4px' }}>{t.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Date */}
          <div>
            <label style={{ fontSize:'14px', fontWeight:'600', color:'#374151', display:'block', marginBottom:'8px' }}>Appointment Date</label>
            <input type="date" min={minDate} value={form.appointment_date} onChange={e => setForm({...form, appointment_date:e.target.value})}
              style={{ padding:'12px 16px', border:'1.5px solid #e2e8f0', borderRadius:'10px', fontSize:'15px', outline:'none', fontFamily:'inherit', width:'100%' }} required />
          </div>

          {/* Time slots */}
          <div>
            <label style={{ fontSize:'14px', fontWeight:'600', color:'#374151', display:'block', marginBottom:'10px' }}>Select Time Slot</label>
            <div style={{ display:'flex', flexWrap:'wrap', gap:'10px' }}>
              {slots.map(s => (
                <button key={s} type="button" onClick={() => setForm({...form, appointment_time:s})}
                  style={{ padding:'10px 18px', border:`1.5px solid ${form.appointment_time===s ? '#0ea5e9' : '#e2e8f0'}`, borderRadius:'8px', background: form.appointment_time===s ? '#0ea5e9' : '#fff', color: form.appointment_time===s ? '#fff' : '#374151', cursor:'pointer', fontSize:'14px', fontWeight:'500' }}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Symptoms */}
          <div>
            <label style={{ fontSize:'14px', fontWeight:'600', color:'#374151', display:'block', marginBottom:'8px' }}>Symptoms / Reason</label>
            <textarea rows={3} value={form.symptoms} onChange={e => setForm({...form, symptoms:e.target.value})}
              placeholder="Describe your symptoms..."
              style={{ padding:'12px 16px', border:'1.5px solid #e2e8f0', borderRadius:'10px', fontSize:'14px', outline:'none', fontFamily:'inherit', width:'100%', resize:'vertical' }} />
          </div>

          <button type="submit" disabled={loading || !user}
            style={{ background:'#0ea5e9', color:'#fff', border:'none', padding:'16px', borderRadius:'12px', fontSize:'16px', fontWeight:'700', cursor:'pointer', opacity: (loading||!user) ? 0.7 : 1 }}>
            {loading ? '⏳ Processing...' : '✅ Confirm & Proceed to Payment'}
          </button>
        </form>
      </div>
    </div>
  )
}
