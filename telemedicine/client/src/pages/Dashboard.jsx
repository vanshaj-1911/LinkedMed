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
  const [actionLoading, setActionLoading] = useState(null)
  const [rejectModal, setRejectModal] = useState(null)   // appointmentId
  const [rejectNote, setRejectNote] = useState('')
  const [refundModal, setRefundModal] = useState(null)   // appointment object
  const [refundReason, setRefundReason] = useState('')
  const [toast, setToast] = useState(null)               // { msg, type }
  const [activeTab, setActiveTab] = useState('appointments')

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    loadData()
  }, [user])

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

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

  // ── Doctor: Accept appointment ──
  const acceptAppt = async (id) => {
    setActionLoading(id + '_accept')
    try {
      await api.patch(`/appointments/${id}/accept`, { doctor_note: 'Appointment confirmed by doctor' })
      showToast('✅ Appointment accepted successfully!')
      loadData()
    } catch (err) {
      showToast('❌ ' + (err.response?.data?.message || 'Failed to accept'), 'error')
    } finally {
      setActionLoading(null)
    }
  }

  // ── Doctor: Reject appointment ──
  const rejectAppt = async () => {
    if (!rejectModal) return
    setActionLoading(rejectModal + '_reject')
    try {
      await api.patch(`/appointments/${rejectModal}/reject`, { doctor_note: rejectNote || 'Doctor unavailable for this slot' })
      showToast('Appointment rejected. Refund will be initiated if payment was made.')
      setRejectModal(null)
      setRejectNote('')
      loadData()
    } catch (err) {
      showToast('❌ ' + (err.response?.data?.message || 'Failed to reject'), 'error')
    } finally {
      setActionLoading(null)
    }
  }

  // ── Patient: Cancel appointment ──
  const cancelAppt = async (id) => {
    if (!window.confirm('Cancel this appointment?')) return
    try {
      await api.patch(`/appointments/${id}/status`, { status: 'cancelled' })
      showToast('Appointment cancelled.')
      loadData()
    } catch (err) {
      showToast('❌ Failed to cancel', 'error')
    }
  }

  // ── Patient: Request refund ──
  const requestRefund = async () => {
    if (!refundModal) return
    setActionLoading(refundModal.id + '_refund')
    try {
      // First mark refund requested
      await api.post(`/appointments/${refundModal.id}/request-refund`, { reason: refundReason || 'Patient requested refund' })
      // Then process refund
      const res = await api.post('/payment/refund', { appointment_id: refundModal.id, reason: refundReason || 'Patient requested refund' })
      showToast(`🎉 ${res.data.message}`)
      setRefundModal(null)
      setRefundReason('')
      loadData()
    } catch (err) {
      showToast('❌ ' + (err.response?.data?.message || 'Refund failed'), 'error')
    } finally {
      setActionLoading(null)
    }
  }

  const statusColor = { pending_approval:'#f59e0b', confirmed:'#0ea5e9', completed:'#22c55e', cancelled:'#ef4444', rejected:'#dc2626', refund_requested:'#8b5cf6', refunded:'#059669' }
  const statusBg    = { pending_approval:'#fef3c7', confirmed:'#e0f2fe', completed:'#dcfce7', cancelled:'#fef2f2', rejected:'#fef2f2', refund_requested:'#ede9fe', refunded:'#dcfce7' }
  const statusLabel = { pending_approval:'⏳ PENDING APPROVAL', confirmed:'✅ CONFIRMED', completed:'🎉 COMPLETED', cancelled:'❌ CANCELLED', rejected:'🚫 REJECTED', refund_requested:'🔄 REFUND REQUESTED', refunded:'💚 REFUNDED' }

  if (!user) return null

  const pendingApprovals = appointments.filter(a => a.status === 'pending_approval')
  const otherAppts = appointments.filter(a => a.status !== 'pending_approval')

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'#f8fafc' }}>

      {/* ── TOAST ── */}
      {toast && (
        <div style={{ position:'fixed', top:'80px', right:'24px', zIndex:9999, background: toast.type==='error' ? '#fef2f2' : '#f0fdf4', border:`1px solid ${toast.type==='error' ? '#fecaca' : '#bbf7d0'}`, color: toast.type==='error' ? '#dc2626' : '#059669', padding:'14px 20px', borderRadius:'12px', fontWeight:'600', fontSize:'14px', boxShadow:'0 8px 24px rgba(0,0,0,0.1)', maxWidth:'360px' }}>
          {toast.msg}
        </div>
      )}

      {/* ── REJECT MODAL ── */}
      {rejectModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' }}>
          <div style={{ background:'#fff', borderRadius:'20px', padding:'32px', maxWidth:'440px', width:'100%', boxShadow:'0 20px 60px rgba(0,0,0,0.2)' }}>
            <h3 style={{ fontSize:'20px', fontWeight:'800', color:'#1e293b', marginBottom:'8px' }}>🚫 Reject Appointment</h3>
            <p style={{ fontSize:'14px', color:'#64748b', marginBottom:'20px' }}>Please provide a reason for rejection. The patient will be notified and refunded automatically.</p>
            <textarea rows={3} value={rejectNote} onChange={e => setRejectNote(e.target.value)}
              placeholder="e.g. I'm not available on this date. Please rebook for next week."
              style={{ width:'100%', padding:'12px', border:'1.5px solid #e2e8f0', borderRadius:'10px', fontSize:'14px', fontFamily:'inherit', outline:'none', resize:'vertical', marginBottom:'16px' }} />
            <div style={{ display:'flex', gap:'12px' }}>
              <button onClick={rejectAppt} disabled={actionLoading}
                style={{ flex:1, background:'#ef4444', color:'#fff', border:'none', padding:'12px', borderRadius:'10px', fontWeight:'700', fontSize:'15px', cursor:'pointer' }}>
                {actionLoading ? '⏳...' : '🚫 Confirm Reject'}
              </button>
              <button onClick={() => { setRejectModal(null); setRejectNote('') }}
                style={{ flex:1, background:'#f1f5f9', color:'#374151', border:'none', padding:'12px', borderRadius:'10px', fontWeight:'600', fontSize:'15px', cursor:'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── REFUND MODAL ── */}
      {refundModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' }}>
          <div style={{ background:'#fff', borderRadius:'20px', padding:'32px', maxWidth:'460px', width:'100%', boxShadow:'0 20px 60px rgba(0,0,0,0.2)' }}>
            <h3 style={{ fontSize:'20px', fontWeight:'800', color:'#1e293b', marginBottom:'8px' }}>💰 Request Refund</h3>
            <div style={{ background:'#f8fafc', borderRadius:'12px', padding:'16px', marginBottom:'16px' }}>
              <div style={{ fontSize:'14px', color:'#374151', display:'flex', flexDirection:'column', gap:'6px' }}>
                <div>Doctor: <strong>{refundModal.doctor_name}</strong></div>
                <div>Date: <strong>{refundModal.appointment_date}</strong></div>
                <div>Amount Paid: <strong style={{ color:'#059669' }}>₹{refundModal.payment_amount || refundModal.consultation_fee}</strong></div>
              </div>
            </div>
            <p style={{ fontSize:'14px', color:'#64748b', marginBottom:'16px' }}>
              Refund will be processed within <strong>3–5 business days</strong> to your original payment method.
            </p>
            <textarea rows={3} value={refundReason} onChange={e => setRefundReason(e.target.value)}
              placeholder="Reason for refund (optional)..."
              style={{ width:'100%', padding:'12px', border:'1.5px solid #e2e8f0', borderRadius:'10px', fontSize:'14px', fontFamily:'inherit', outline:'none', resize:'vertical', marginBottom:'16px' }} />
            <div style={{ display:'flex', gap:'12px' }}>
              <button onClick={requestRefund} disabled={actionLoading}
                style={{ flex:1, background:'linear-gradient(135deg,#0ea5e9,#0284c7)', color:'#fff', border:'none', padding:'12px', borderRadius:'10px', fontWeight:'700', fontSize:'15px', cursor:'pointer' }}>
                {actionLoading ? '⏳ Processing...' : '💰 Request Refund'}
              </button>
              <button onClick={() => { setRefundModal(null); setRefundReason('') }}
                style={{ flex:1, background:'#f1f5f9', color:'#374151', border:'none', padding:'12px', borderRadius:'10px', fontWeight:'600', fontSize:'15px', cursor:'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── SIDEBAR ── */}
      <div style={{ width:'240px', background:'#1e293b', padding:'20px', display:'flex', flexDirection:'column', gap:'12px', flexShrink:0 }}>
        <div style={{ background:'rgba(255,255,255,0.07)', borderRadius:'12px', padding:'16px' }}>
          <div style={{ width:'44px', height:'44px', background:'#0ea5e9', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px', fontWeight:'700', color:'#fff', marginBottom:'10px' }}>
            {user.name ? user.name.charAt(0) : '?'}
          </div>
          <div style={{ fontWeight:'700', color:'#fff', fontSize:'14px' }}>{user.name}</div>
          <div style={{ fontSize:'11px', color:'#0ea5e9', fontWeight:'600', textTransform:'uppercase', background:'rgba(14,165,233,0.15)', padding:'2px 8px', borderRadius:'6px', display:'inline-block', margin:'4px 0' }}>{user.role}</div>
          <div style={{ fontSize:'11px', color:'#94a3b8', wordBreak:'break-all' }}>{user.email}</div>
        </div>

        {[
          { icon:'📊', label:'Dashboard',    tab:'appointments' },
          { icon:'💊', label:'Prescriptions', tab:'prescriptions', hide: user.role==='doctor' },
          { icon:'💳', label:'Payment History', tab:'payments', hide: user.role==='doctor' },
        ].filter(i => !i.hide).map((item, i) => (
          <button key={i} onClick={() => setActiveTab(item.tab)}
            style={{ background: activeTab===item.tab ? 'rgba(14,165,233,0.2)' : 'transparent', color: activeTab===item.tab ? '#38bdf8' : '#94a3b8', border:'none', padding:'10px 12px', borderRadius:'8px', fontSize:'14px', fontWeight:'500', cursor:'pointer', textAlign:'left', display:'flex', gap:'8px', alignItems:'center' }}>
            {item.icon} {item.label}
            {item.tab==='appointments' && pendingApprovals.length > 0 && user.role==='doctor' && (
              <span style={{ background:'#ef4444', color:'#fff', fontSize:'10px', fontWeight:'800', padding:'2px 6px', borderRadius:'10px', marginLeft:'auto' }}>{pendingApprovals.length}</span>
            )}
          </button>
        ))}

        <Link to="/doctors" style={{ color:'#94a3b8', padding:'10px 12px', borderRadius:'8px', fontSize:'14px', fontWeight:'500', textDecoration:'none', display:'flex', gap:'8px', alignItems:'center' }}>
          👨‍⚕️ Find Doctors
        </Link>

        <div style={{ flex:1 }} />
        <button onClick={() => { logout(); navigate('/') }}
          style={{ background:'rgba(239,68,68,0.15)', color:'#fca5a5', border:'none', padding:'10px 16px', borderRadius:'8px', cursor:'pointer', fontSize:'14px', fontWeight:'600', textAlign:'left' }}>
          🚪 Logout
        </button>
      </div>

      {/* ── MAIN ── */}
      <div style={{ flex:1, padding:'32px', overflowY:'auto' }}>
        <h1 style={{ fontSize:'30px', fontWeight:'800', color:'#1e293b', marginBottom:'4px' }}>
          {user.role==='admin' ? '👑 Admin Dashboard' : user.role==='doctor' ? '👨‍⚕️ Doctor Dashboard' : '🧑 Patient Dashboard'}
        </h1>
        <p style={{ fontSize:'16px', color:'#64748b', marginBottom:'28px' }}>Welcome back, {user.name ? user.name.split(' ')[0] : 'User'}!</p>

        {/* Stats */}
        <div style={{ display:'flex', gap:'16px', marginBottom:'28px', flexWrap:'wrap' }}>
          {[
            { num: appointments.length, label: 'Total', color:'#0ea5e9' },
            { num: pendingApprovals.length, label: 'Pending Approval', color:'#f59e0b' },
            { num: appointments.filter(a=>a.status==='confirmed').length, label: 'Confirmed', color:'#22c55e' },
            { num: appointments.filter(a=>a.status==='completed').length, label: 'Completed', color:'#8b5cf6' },
            ...(user.role!=='doctor' ? [{ num: appointments.filter(a=>a.refund_status==='completed').length, label: 'Refunded', color:'#059669' }] : []),
          ].map((s,i) => (
            <div key={i} style={{ flex:1, minWidth:'120px', background:'#fff', borderRadius:'16px', padding:'20px', boxShadow:'0 2px 8px rgba(0,0,0,0.06)', textAlign:'center' }}>
              <div style={{ fontSize:'32px', fontWeight:'800', color: s.color }}>{s.num}</div>
              <div style={{ fontSize:'12px', color:'#64748b', fontWeight:'500', marginTop:'4px' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── APPOINTMENTS TAB ── */}
        {activeTab === 'appointments' && (
          <>
            {/* Doctor: Pending approvals section */}
            {user.role === 'doctor' && pendingApprovals.length > 0 && (
              <div style={{ background:'#fff', borderRadius:'16px', padding:'24px', marginBottom:'24px', boxShadow:'0 2px 8px rgba(0,0,0,0.06)', border:'2px solid #fef3c7' }}>
                <h2 style={{ fontSize:'18px', fontWeight:'700', color:'#1e293b', marginBottom:'16px', display:'flex', alignItems:'center', gap:'8px' }}>
                  ⏳ Pending Approvals
                  <span style={{ background:'#f59e0b', color:'#fff', fontSize:'12px', padding:'2px 10px', borderRadius:'20px' }}>{pendingApprovals.length} new</span>
                </h2>
                <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
                  {pendingApprovals.map(a => (
                    <div key={a.id} style={{ background:'#fffbeb', borderRadius:'12px', padding:'16px', border:'1.5px solid #fde68a', display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:'12px' }}>
                      <div style={{ display:'flex', gap:'14px', flex:1 }}>
                        <div style={{ fontSize:'28px' }}>{a.consultation_type==='video' ? '📹' : a.consultation_type==='audio' ? '🎙️' : '💬'}</div>
                        <div>
                          <div style={{ fontWeight:'700', color:'#1e293b', fontSize:'15px' }}>Patient: {a.patient_name}</div>
                          <div style={{ fontSize:'13px', color:'#64748b', margin:'2px 0' }}>{a.gender || 'N/A'} • Age {a.age || '?'} • {a.blood_group || 'N/A'}</div>
                          <div style={{ fontSize:'13px', color:'#64748b' }}>📅 {a.appointment_date} at {a.appointment_time}</div>
                          {a.symptoms && <div style={{ fontSize:'13px', color:'#94a3b8', marginTop:'4px' }}>🩺 {a.symptoms}</div>}
                        </div>
                      </div>
                      <div style={{ display:'flex', gap:'8px', alignItems:'center', flexWrap:'wrap' }}>
                        <button onClick={() => acceptAppt(a.id)} disabled={actionLoading === a.id+'_accept'}
                          style={{ background:'#22c55e', color:'#fff', border:'none', padding:'8px 18px', borderRadius:'8px', fontSize:'13px', fontWeight:'700', cursor:'pointer', opacity: actionLoading===a.id+'_accept' ? 0.7 : 1 }}>
                          {actionLoading===a.id+'_accept' ? '⏳' : '✅ Accept'}
                        </button>
                        <button onClick={() => { setRejectModal(a.id); setRejectNote('') }} disabled={!!actionLoading}
                          style={{ background:'#ef4444', color:'#fff', border:'none', padding:'8px 18px', borderRadius:'8px', fontSize:'13px', fontWeight:'700', cursor:'pointer' }}>
                          🚫 Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* All appointments */}
            <div style={{ background:'#fff', borderRadius:'16px', padding:'24px', boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' }}>
                <h2 style={{ fontSize:'20px', fontWeight:'700', color:'#1e293b' }}>
                  {user.role==='doctor' ? 'All Appointments' : 'My Appointments'}
                </h2>
                {user.role==='patient' && <Link to="/doctors" style={{ background:'#0ea5e9', color:'#fff', padding:'8px 18px', borderRadius:'8px', textDecoration:'none', fontWeight:'600', fontSize:'14px' }}>+ Book New</Link>}
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
                            {user.role==='doctor' ? `${a.gender||''} • Age ${a.age||'?'}` : a.specialization}
                          </div>
                          <div style={{ fontSize:'13px', color:'#64748b' }}>📅 {a.appointment_date} at {a.appointment_time}</div>
                          {a.symptoms && <div style={{ fontSize:'13px', color:'#94a3b8', marginTop:'4px' }}>🩺 {a.symptoms}</div>}
                          {a.doctor_note && a.status === 'rejected' && (
                            <div style={{ fontSize:'12px', color:'#dc2626', background:'#fef2f2', padding:'6px 10px', borderRadius:'6px', marginTop:'6px' }}>
                              💬 Doctor note: {a.doctor_note}
                            </div>
                          )}
                          {a.refund_status === 'completed' && (
                            <div style={{ fontSize:'12px', color:'#059669', background:'#dcfce7', padding:'6px 10px', borderRadius:'6px', marginTop:'6px' }}>
                              💚 Refund of ₹{a.payment_amount} processed
                            </div>
                          )}
                        </div>
                      </div>
                      <div style={{ display:'flex', flexDirection:'column', gap:'8px', alignItems:'flex-end' }}>
                        <span style={{ padding:'4px 12px', borderRadius:'20px', fontSize:'11px', fontWeight:'700', background: statusBg[a.status] || '#f1f5f9', color: statusColor[a.status] || '#64748b' }}>
                          {statusLabel[a.status] || a.status.toUpperCase()}
                        </span>

                        {/* Join call — confirmed only */}
                        {a.status === 'confirmed' && (
                          <button onClick={() => navigate(`/call/${a.id}`)}
                            style={{ background:'#0ea5e9', color:'#fff', border:'none', padding:'6px 14px', borderRadius:'8px', fontSize:'13px', fontWeight:'600', cursor:'pointer' }}>
                            📹 Join Call
                          </button>
                        )}

                        {/* Patient: cancel confirmed */}
                        {a.status === 'confirmed' && user.role==='patient' && (
                          <button onClick={() => cancelAppt(a.id)}
                            style={{ background:'#fef2f2', color:'#dc2626', border:'none', padding:'6px 12px', borderRadius:'6px', fontSize:'12px', fontWeight:'600', cursor:'pointer' }}>
                            Cancel
                          </button>
                        )}

                        {/* Patient: request refund (if paid + confirmed/rejected/cancelled) */}
                        {user.role==='patient' && a.payment_id && a.payment_status==='paid' && !['refunded','refund_requested'].includes(a.refund_status) && ['confirmed','rejected','cancelled'].includes(a.status) && (
                          <button onClick={() => setRefundModal(a)}
                            style={{ background:'#ede9fe', color:'#7c3aed', border:'none', padding:'6px 14px', borderRadius:'8px', fontSize:'12px', fontWeight:'700', cursor:'pointer' }}>
                            💰 Request Refund
                          </button>
                        )}

                        {/* Doctor: accept/reject on pending */}
                        {user.role==='doctor' && a.status==='pending_approval' && (
                          <div style={{ display:'flex', gap:'6px' }}>
                            <button onClick={() => acceptAppt(a.id)}
                              style={{ background:'#22c55e', color:'#fff', border:'none', padding:'6px 12px', borderRadius:'6px', fontSize:'12px', fontWeight:'700', cursor:'pointer' }}>
                              ✅ Accept
                            </button>
                            <button onClick={() => setRejectModal(a.id)}
                              style={{ background:'#ef4444', color:'#fff', border:'none', padding:'6px 12px', borderRadius:'6px', fontSize:'12px', fontWeight:'700', cursor:'pointer' }}>
                              🚫 Reject
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* ── PRESCRIPTIONS TAB ── */}
        {activeTab === 'prescriptions' && (user.role==='patient' || user.role==='admin') && (
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

        {/* ── PAYMENT HISTORY TAB ── */}
        {activeTab === 'payments' && user.role !== 'doctor' && (
          <PaymentHistory />
        )}
      </div>
    </div>
  )
}

// ── Payment History Component ──
function PaymentHistory() {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/payment/history').then(r => { setHistory(r.data); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  return (
    <div style={{ background:'#fff', borderRadius:'16px', padding:'24px', boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
      <h2 style={{ fontSize:'20px', fontWeight:'700', color:'#1e293b', marginBottom:'20px' }}>💳 Payment History</h2>
      {loading ? <p style={{ textAlign:'center', color:'#64748b', padding:'32px' }}>⏳ Loading...</p>
      : history.length === 0 ? (
        <div style={{ textAlign:'center', padding:'40px', color:'#94a3b8' }}>
          <div style={{ fontSize:'48px', marginBottom:'12px' }}>💳</div>
          <p>No payment records yet.</p>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
          {history.map((p, i) => (
            <div key={i} style={{ background:'#f8fafc', borderRadius:'12px', padding:'16px', border:'1px solid #e2e8f0', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'12px' }}>
              <div>
                <div style={{ fontWeight:'700', color:'#1e293b', fontSize:'15px' }}>Dr. {p.doctor_name}</div>
                <div style={{ fontSize:'13px', color:'#64748b', marginTop:'4px' }}>{p.specialization} • {p.appointment_date}</div>
                <div style={{ fontSize:'12px', color:'#94a3b8', marginTop:'2px' }}>ID: {p.payment_id?.substring(0,20)}...</div>
              </div>
              <div style={{ textAlign:'right' }}>
                <div style={{ fontSize:'20px', fontWeight:'800', color: p.payment_status==='refunded' ? '#059669' : '#1e293b' }}>
                  {p.payment_status==='refunded' ? '↩️' : ''} ₹{p.payment_amount}
                </div>
                <span style={{ fontSize:'11px', fontWeight:'700', padding:'3px 10px', borderRadius:'20px', background: p.payment_status==='paid' ? '#dcfce7' : p.payment_status==='refunded' ? '#e0f2fe' : '#fef3c7', color: p.payment_status==='paid' ? '#059669' : p.payment_status==='refunded' ? '#0284c7' : '#d97706' }}>
                  {p.payment_status?.toUpperCase()}
                </span>
                {p.refund_status === 'completed' && <div style={{ fontSize:'11px', color:'#059669', marginTop:'4px' }}>✅ Refund processed</div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
