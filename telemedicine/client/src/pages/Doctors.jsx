import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api.js'

export default function Doctors() {
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('All')

  useEffect(() => {
    api.get('/doctors')
      .then(r => { setDoctors(r.data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const specs = ['All', ...new Set(doctors.map(d => d.specialization))]
  const filtered = doctors.filter(d => {
    const q = search.toLowerCase()
    const matchSearch = d.full_name.toLowerCase().includes(q) || d.specialization.toLowerCase().includes(q)
    const matchFilter = filter === 'All' || d.specialization === filter
    return matchSearch && matchFilter
  })

  return (
    <div style={{ maxWidth:'1200px', margin:'0 auto', padding:'40px 24px' }}>
      <div style={{ textAlign:'center', marginBottom:'40px' }}>
        <h1 style={{ fontSize:'40px', fontWeight:'800', color:'#1e293b', marginBottom:'8px' }}>Our Doctors</h1>
        <p style={{ fontSize:'16px', color:'#64748b', marginBottom:'28px' }}>Expert doctors available for online consultation</p>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="🔍 Search by name or specialization..."
          style={{ width:'100%', maxWidth:'480px', padding:'12px 20px', border:'1.5px solid #e2e8f0', borderRadius:'12px', fontSize:'15px', outline:'none', fontFamily:'inherit', display:'block', margin:'0 auto 16px' }} />
        <div style={{ display:'flex', gap:'8px', flexWrap:'wrap', justifyContent:'center' }}>
          {specs.map(s => (
            <button key={s} onClick={() => setFilter(s)}
              style={{ background: filter===s ? '#0ea5e9' : '#f1f5f9', color: filter===s ? '#fff' : '#64748b', border:'none', padding:'8px 16px', borderRadius:'20px', fontSize:'13px', fontWeight:'500', cursor:'pointer' }}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p style={{ textAlign:'center', padding:'80px', color:'#64748b', fontSize:'18px' }}>⏳ Loading doctors...</p>
      ) : filtered.length === 0 ? (
        <p style={{ textAlign:'center', padding:'80px', color:'#64748b' }}>No doctors found.</p>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:'24px' }}>
          {filtered.map(doc => (
            <div key={doc.id} style={{ background:'#fff', borderRadius:'20px', padding:'28px', boxShadow:'0 4px 16px rgba(0,0,0,0.06)', border:'1px solid #f1f5f9', display:'flex', flexDirection:'column', gap:'12px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                <div style={{ fontSize:'36px', background:'#e0f2fe', borderRadius:'12px', padding:'8px', lineHeight:'1', width:'52px', height:'52px', display:'flex', alignItems:'center', justifyContent:'center' }}>👨‍⚕️</div>
                <span style={{ background:'#dcfce7', color:'#16a34a', padding:'4px 10px', borderRadius:'20px', fontSize:'12px', fontWeight:'600' }}>🟢 Available</span>
              </div>
              <h3 style={{ fontSize:'20px', fontWeight:'700', color:'#1e293b' }}>{doc.full_name}</h3>
              <p style={{ fontSize:'14px', fontWeight:'600', color:'#0ea5e9' }}>{doc.specialization}</p>
              <p style={{ fontSize:'13px', color:'#94a3b8' }}>{doc.qualification}</p>
              <div style={{ display:'flex', borderTop:'1px solid #f1f5f9', borderBottom:'1px solid #f1f5f9', padding:'12px 0' }}>
                {[
                  { val: doc.experience_years + 'yr', label: 'Experience' },
                  { val: '⭐' + doc.rating, label: 'Rating' },
                  { val: doc.total_consultations + '+', label: 'Patients' },
                ].map((s,i) => (
                  <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:'2px', borderRight: i<2 ? '1px solid #f1f5f9' : 'none' }}>
                    <span style={{ fontSize:'15px', fontWeight:'700', color:'#1e293b' }}>{s.val}</span>
                    <span style={{ fontSize:'11px', color:'#94a3b8' }}>{s.label}</span>
                  </div>
                ))}
              </div>
              <p style={{ fontSize:'15px', fontWeight:'700', color:'#059669' }}>💰 ₹{doc.consultation_fee} / session</p>
              <Link to={`/book/${doc.id}`} state={{ doctor: doc }}
                style={{ background:'#0ea5e9', color:'#fff', textDecoration:'none', textAlign:'center', padding:'12px', borderRadius:'12px', fontWeight:'700', fontSize:'15px' }}>
                Book Appointment →
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
