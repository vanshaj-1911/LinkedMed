import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import api from '../api.js'

export default function Payment() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { doctor, appointmentData, appointmentId } = location.state || {}

  const [step, setStep] = useState('summary') // summary | paying | success | failed
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [card, setCard] = useState({ number:'', expiry:'', cvv:'', name:'' })

  useEffect(() => { if (!user || !doctor) navigate('/doctors') }, [user, doctor])

  const fmtCard   = v => v.replace(/\D/g,'').replace(/(.{4})/g,'$1 ').trim().slice(0,19)
  const fmtExpiry = v => v.replace(/\D/g,'').replace(/(\d{2})(\d)/,'$1/$2').slice(0,5)

  const handlePay = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      // Step 1: Create payment intent
      const intentRes = await api.post('/payment/create-intent', {
        doctor_id: doctor.id,
        consultation_fee: doctor.consultation_fee,
        doctor_name: doctor.full_name,
        consultation_type: appointmentData?.consultation_type || 'video'
      })

      const paymentIntentId = intentRes.data.paymentIntentId
      const isDemo = intentRes.data.demo

      // Step 2: Confirm payment
      await api.post('/payment/confirm', {
        payment_intent_id: paymentIntentId,
        appointment_id: appointmentId || null,
        amount: parseFloat(doctor.consultation_fee),
        doctor_name: doctor.full_name,
        is_demo: isDemo
      })

      setStep('success')
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Payment failed. Please try again.'
      setError(msg)
      setStep('failed')
    } finally {
      setLoading(false)
    }
  }

  if (!doctor) return null

  if (step === 'success') return (
    <div style={{ minHeight:'100vh', background:'#f8fafc', display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' }}>
      <div style={{ background:'#fff', borderRadius:'24px', padding:'48px', maxWidth:'460px', width:'100%', textAlign:'center', boxShadow:'0 20px 60px rgba(0,0,0,0.08)' }}>
        <div style={{ fontSize:'72px', marginBottom:'8px' }}>🎉</div>
        <h2 style={{ fontSize:'28px', fontWeight:'800', color:'#1e293b', marginBottom:'12px' }}>Payment Successful!</h2>
        <p style={{ color:'#64748b', marginBottom:'24px' }}>Your consultation with <strong>{doctor.full_name}</strong> is confirmed.</p>
        <div style={{ background:'#f8fafc', borderRadius:'12px', padding:'20px', marginBottom:'24px', textAlign:'left', display:'flex', flexDirection:'column', gap:'10px' }}>
          {[
            ['Doctor', doctor.full_name],
            ['Date', appointmentData?.appointment_date],
            ['Time', appointmentData?.appointment_time],
            ['Type', appointmentData?.consultation_type],
            ['Amount Paid', `₹${doctor.consultation_fee}`],
          ].map(([k,v],i) => (
            <div key={i} style={{ display:'flex', justifyContent:'space-between', fontSize:'14px', color:'#374151' }}>
              <span>{k}</span><strong style={k==='Amount Paid' ? {color:'#059669',fontSize:'18px'} : {}}>{v}</strong>
            </div>
          ))}
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
          {appointmentId && (
            <button onClick={() => navigate(`/call/${appointmentId}`)}
              style={{ background:'#0ea5e9', color:'#fff', border:'none', padding:'14px', borderRadius:'12px', fontWeight:'700', fontSize:'15px', cursor:'pointer' }}>
              📹 Join Video Call Now
            </button>
          )}
          <button onClick={() => navigate('/dashboard')}
            style={{ background:'#f1f5f9', color:'#374151', border:'none', padding:'14px', borderRadius:'12px', fontWeight:'600', fontSize:'15px', cursor:'pointer' }}>
            View Dashboard
          </button>
        </div>
      </div>
    </div>
  )

  if (step === 'failed') return (
    <div style={{ minHeight:'100vh', background:'#f8fafc', display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' }}>
      <div style={{ background:'#fff', borderRadius:'24px', padding:'48px', maxWidth:'400px', width:'100%', textAlign:'center', boxShadow:'0 20px 60px rgba(0,0,0,0.08)' }}>
        <div style={{ fontSize:'64px', marginBottom:'16px' }}>❌</div>
        <h2 style={{ fontSize:'24px', fontWeight:'800', color:'#dc2626', marginBottom:'12px' }}>Payment Failed</h2>
        <p style={{ color:'#64748b', marginBottom:'24px' }}>{error}</p>
        <div style={{ display:'flex', gap:'12px', justifyContent:'center' }}>
          <button onClick={() => setStep('summary')} style={{ background:'#0ea5e9', color:'#fff', border:'none', padding:'12px 24px', borderRadius:'10px', cursor:'pointer', fontWeight:'700' }}>Try Again</button>
          <button onClick={() => navigate('/doctors')} style={{ background:'#f1f5f9', color:'#374151', border:'none', padding:'12px 24px', borderRadius:'10px', cursor:'pointer', fontWeight:'600' }}>Go Back</button>
        </div>
      </div>
    </div>
  )

  // Summary page
  if (step === 'summary') return (
    <div style={{ minHeight:'100vh', background:'#f8fafc', padding:'40px 24px' }}>
      <div style={{ maxWidth:'540px', margin:'0 auto', display:'flex', flexDirection:'column', gap:'20px' }}>
        <h1 style={{ fontSize:'28px', fontWeight:'800', color:'#1e293b', textAlign:'center' }}>💳 Payment Summary</h1>

        <div style={{ background:'#fff', borderRadius:'20px', padding:'28px', boxShadow:'0 4px 16px rgba(0,0,0,0.06)' }}>
          <div style={{ display:'flex', gap:'16px', alignItems:'center', paddingBottom:'20px', borderBottom:'1px solid #f1f5f9', marginBottom:'16px' }}>
            <div style={{ fontSize:'40px', background:'#e0f2fe', borderRadius:'12px', padding:'10px', lineHeight:'1' }}>👨‍⚕️</div>
            <div>
              <div style={{ fontSize:'18px', fontWeight:'700', color:'#1e293b' }}>{doctor.full_name}</div>
              <div style={{ fontSize:'13px', color:'#64748b', margin:'4px 0' }}>{doctor.specialization} • {doctor.experience_years} yrs exp</div>
              <div style={{ fontSize:'13px', fontWeight:'600', color:'#f59e0b' }}>⭐ {doctor.rating}</div>
            </div>
          </div>
          {[
            ['📅 Date', appointmentData?.appointment_date],
            ['⏰ Time', appointmentData?.appointment_time],
            ['📹 Type', appointmentData?.consultation_type],
          ].map(([k,v],i) => (
            <div key={i} style={{ display:'flex', justifyContent:'space-between', fontSize:'14px', color:'#374151', padding:'8px 0', borderBottom:'1px solid #f8fafc' }}>
              <span>{k}</span><strong>{v}</strong>
            </div>
          ))}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:'16px', paddingTop:'16px', borderTop:'2px dashed #e2e8f0' }}>
            <span style={{ fontSize:'16px', fontWeight:'700', color:'#1e293b' }}>Total Amount</span>
            <span style={{ fontSize:'28px', fontWeight:'800', color:'#059669' }}>₹{doctor.consultation_fee}</span>
          </div>
          <p style={{ fontSize:'12px', color:'#94a3b8', marginTop:'8px' }}>* Inclusive of all taxes. Secure payment powered by Stripe.</p>
        </div>

        <div style={{ display:'flex', gap:'10px', justifyContent:'center', flexWrap:'wrap' }}>
          {['🔒 SSL Encrypted','💳 Stripe Secured','✅ 100% Secure'].map((b,i) => (
            <span key={i} style={{ background:'#f0fdf4', color:'#16a34a', padding:'6px 14px', borderRadius:'20px', fontSize:'13px', fontWeight:'600' }}>{b}</span>
          ))}
        </div>

        <button onClick={() => setStep('paying')}
          style={{ background:'linear-gradient(135deg,#0ea5e9,#0284c7)', color:'#fff', border:'none', padding:'16px', borderRadius:'14px', fontSize:'16px', fontWeight:'700', cursor:'pointer', boxShadow:'0 4px 14px rgba(14,165,233,0.4)' }}>
          💳 Proceed to Pay ₹{doctor.consultation_fee}
        </button>
        <button onClick={() => navigate(-1)}
          style={{ background:'transparent', color:'#64748b', border:'none', padding:'12px', borderRadius:'10px', fontSize:'15px', cursor:'pointer' }}>
          ← Go Back
        </button>
      </div>
    </div>
  )

  // Payment form
  return (
    <div style={{ minHeight:'100vh', background:'#f8fafc', padding:'40px 24px' }}>
      <div style={{ maxWidth:'500px', margin:'0 auto', display:'flex', flexDirection:'column', gap:'20px' }}>
        <h1 style={{ fontSize:'28px', fontWeight:'800', color:'#1e293b', textAlign:'center' }}>💳 Enter Card Details</h1>

        <div style={{ background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:'12px', padding:'14px 18px', fontSize:'14px', color:'#1d4ed8' }}>
          💡 <strong>Test Card:</strong> Use <code>4242 4242 4242 4242</code> | Expiry: <code>12/26</code> | CVV: <code>123</code>
        </div>

        <div style={{ background:'#fff', borderRadius:'20px', padding:'28px', boxShadow:'0 4px 16px rgba(0,0,0,0.06)' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', background:'#f8fafc', padding:'12px 16px', borderRadius:'10px', marginBottom:'24px' }}>
            <span style={{ fontSize:'15px', color:'#374151' }}>Paying to: <strong>{doctor.full_name}</strong></span>
            <span style={{ fontWeight:'800', fontSize:'20px', color:'#059669' }}>₹{doctor.consultation_fee}</span>
          </div>

          <form onSubmit={handlePay} style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
            {error && <div style={{ background:'#fef2f2', color:'#dc2626', padding:'12px', borderRadius:'10px', fontSize:'14px', border:'1px solid #fecaca' }}>⚠️ {error}</div>}

            {[
              { label:'Cardholder Name', placeholder:'Name on card', key:'name', type:'text' },
              { label:'Card Number', placeholder:'1234 5678 9012 3456', key:'number', type:'text', maxLen:19 },
            ].map(f => (
              <div key={f.key}>
                <label style={{ fontSize:'13px', fontWeight:'600', color:'#374151', display:'block', marginBottom:'6px' }}>{f.label}</label>
                <input type={f.type} placeholder={f.placeholder} value={card[f.key]} maxLength={f.maxLen}
                  onChange={e => setCard({...card, [f.key]: f.key==='number' ? fmtCard(e.target.value) : e.target.value})}
                  style={{ padding:'12px 16px', border:'1.5px solid #e2e8f0', borderRadius:'10px', fontSize:'15px', outline:'none', fontFamily:'inherit', width:'100%' }} />
              </div>
            ))}

            <div style={{ display:'flex', gap:'12px' }}>
              <div style={{ flex:1 }}>
                <label style={{ fontSize:'13px', fontWeight:'600', color:'#374151', display:'block', marginBottom:'6px' }}>Expiry</label>
                <input placeholder="MM/YY" value={card.expiry} maxLength={5}
                  onChange={e => setCard({...card, expiry: fmtExpiry(e.target.value)})}
                  style={{ padding:'12px 16px', border:'1.5px solid #e2e8f0', borderRadius:'10px', fontSize:'15px', outline:'none', fontFamily:'inherit', width:'100%' }} />
              </div>
              <div style={{ flex:1 }}>
                <label style={{ fontSize:'13px', fontWeight:'600', color:'#374151', display:'block', marginBottom:'6px' }}>CVV</label>
                <input type="password" placeholder="123" value={card.cvv} maxLength={4}
                  onChange={e => setCard({...card, cvv: e.target.value.replace(/\D/g,'').slice(0,4)})}
                  style={{ padding:'12px 16px', border:'1.5px solid #e2e8f0', borderRadius:'10px', fontSize:'15px', outline:'none', fontFamily:'inherit', width:'100%' }} />
              </div>
            </div>

            <button type="submit" disabled={loading}
              style={{ background:'linear-gradient(135deg,#0ea5e9,#0284c7)', color:'#fff', border:'none', padding:'16px', borderRadius:'12px', fontSize:'16px', fontWeight:'700', cursor:'pointer', opacity: loading ? 0.7 : 1, boxShadow:'0 4px 14px rgba(14,165,233,0.4)' }}>
              {loading ? '⏳ Processing...' : `🔒 Pay ₹${doctor.consultation_fee} Securely`}
            </button>
          </form>

          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'6px', marginTop:'20px', fontSize:'13px', color:'#94a3b8' }}>
            🔒 Secured by <strong style={{ color:'#635bff' }}>Stripe</strong> • SSL • PCI DSS Compliant
          </div>
        </div>
      </div>
    </div>
  )
}
