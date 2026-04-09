import React from 'react'
import { Link } from 'react-router-dom'

export default function Home() {
  const features = [
    { icon: '📹', title: 'Video Consultation', desc: 'HD video calls with adaptive quality for low-bandwidth areas' },
    { icon: '🤖', title: 'AI Symptom Check', desc: 'Pre-assessment helps understand your condition before booking' },
    { icon: '📋', title: 'Digital Prescriptions', desc: 'Encrypted digital prescriptions stored securely in the cloud' },
    { icon: '🗂️', title: 'Medical Records', desc: 'Complete consultation history and EHR management' },
    { icon: '📅', title: 'Easy Booking', desc: 'Book appointments in seconds with any specialist' },
    { icon: '🔒', title: 'Secure & Private', desc: 'SSL encryption, JWT authentication, full data privacy' },
  ]

  const stats = [
    { number: '500+', label: 'Doctors Available' },
    { number: '10K+', label: 'Consultations Done' },
    { number: '28', label: 'Specializations' },
    { number: '4.8★', label: 'Average Rating' },
  ]

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh' }}>

      {/* HERO */}
      <div style={{ background: 'linear-gradient(135deg,#0ea5e9,#0284c7,#075985)', padding: '80px 60px', display: 'flex', gap: '60px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: '300px' }}>
          <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.15)', color: '#fff', padding: '6px 16px', borderRadius: '20px', fontSize: '13px', marginBottom: '20px' }}>
            B.Tech. Final Year Project
          </div>
          <h1 style={{ fontSize: '52px', fontWeight: '800', color: '#fff', lineHeight: '1.1', marginBottom: '20px' }}>
            Healthcare at Your<br /><span style={{ color: '#bae6fd' }}>Fingertips</span>
          </h1>
          <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.85)', lineHeight: '1.7', marginBottom: '32px', maxWidth: '480px' }}>
            Consult expert doctors via video, audio, or chat — from anywhere in India. Book appointments, get digital prescriptions, and manage health records securely.
          </p>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '24px' }}>
            <Link to="/register" style={{ background: '#fff', color: '#0ea5e9', padding: '14px 28px', borderRadius: '12px', textDecoration: 'none', fontWeight: '700', fontSize: '16px' }}>
              Get Started Free →
            </Link>
            <Link to="/doctors" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', padding: '14px 28px', borderRadius: '12px', textDecoration: 'none', fontWeight: '600', fontSize: '16px', border: '1px solid rgba(255,255,255,0.3)' }}>
              Browse Doctors
            </Link>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0,0,0,0.2)', padding: '10px 16px', borderRadius: '10px', color: '#bae6fd', fontSize: '13px', flexWrap: 'wrap' }}>
            <span>🔑 Demo Admin Login:</span>
            <code style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '4px' }}>vanshaj7770@gmail.com</code>
            <span>/</span>
            <code style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '4px' }}>Pfl@82732</code>
          </div>
        </div>
        <div style={{ flex: 1, minWidth: '260px', display: 'flex', justifyContent: 'center' }}>
          <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: '20px', padding: '24px', maxWidth: '300px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', gap: '14px', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ fontSize: '40px', background: '#e0f2fe', borderRadius: '50%', padding: '10px', width: '64px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>👨‍⚕️</div>
              <div>
                <div style={{ fontWeight: '700', color: '#1e293b' }}>Dr. Rajesh Sharma</div>
                <div style={{ fontSize: '13px', color: '#64748b' }}>General Physician • 12 yrs</div>
                <div style={{ fontSize: '13px', color: '#22c55e', fontWeight: '600' }}>🟢 Available Now</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <span style={{ background: '#e0f2fe', color: '#0284c7', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '600' }}>📹 Video</span>
              <span style={{ background: '#f0fdf4', color: '#059669', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '600' }}>🎙️ Audio</span>
              <span style={{ background: '#fef3c7', color: '#d97706', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '600' }}>💬 Chat</span>
            </div>
          </div>
        </div>
      </div>

      {/* STATS */}
      <div style={{ display: 'flex', justifyContent: 'space-around', background: '#fff', padding: '32px', boxShadow: '0 1px 0 #e2e8f0', flexWrap: 'wrap', gap: '20px' }}>
        {stats.map((s, i) => (
          <div key={i} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '36px', fontWeight: '800', color: '#0ea5e9' }}>{s.number}</div>
            <div style={{ fontSize: '14px', color: '#64748b', fontWeight: '500' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* FEATURES */}
      <div style={{ padding: '80px 60px', maxWidth: '1200px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '36px', fontWeight: '800', color: '#1e293b', textAlign: 'center', marginBottom: '12px' }}>Key Innovations</h2>
        <p style={{ fontSize: '16px', color: '#64748b', textAlign: 'center', marginBottom: '48px' }}>Built for India's healthcare needs</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: '24px' }}>
          {features.map((f, i) => (
            <div key={i} style={{ background: '#fff', padding: '28px', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9' }}>
              <div style={{ fontSize: '36px', marginBottom: '16px' }}>{f.icon}</div>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b', marginBottom: '8px' }}>{f.title}</h3>
              <p style={{ fontSize: '14px', color: '#64748b', lineHeight: '1.6' }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* TECH STACK */}
      <div style={{ background: '#fff', padding: '60px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '28px', fontWeight: '800', color: '#1e293b', marginBottom: '32px' }}>Technology Stack</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center' }}>
          {['React.js','Node.js','PostgreSQL','Neon DB','WebRTC','JWT Auth','Express.js','Socket.IO','Stripe'].map((t, i) => (
            <span key={i} style={{ background: '#e0f2fe', color: '#0284c7', padding: '10px 20px', borderRadius: '24px', fontSize: '14px', fontWeight: '600' }}>{t}</span>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div style={{ background: 'linear-gradient(135deg,#1e293b,#0f172a)', padding: '80px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '36px', fontWeight: '800', color: '#fff', marginBottom: '16px' }}>Ready to consult a doctor online?</h2>
        <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.7)', marginBottom: '32px' }}>Join thousands getting quality healthcare from home.</p>
        <Link to="/register" style={{ background: '#0ea5e9', color: '#fff', padding: '16px 36px', borderRadius: '12px', textDecoration: 'none', fontWeight: '700', fontSize: '16px' }}>
          Create Free Account →
        </Link>
      </div>

      {/* FOOTER */}
      <div style={{ background: '#0f172a', color: 'rgba(255,255,255,0.5)', padding: '24px', textAlign: 'center', fontSize: '13px', lineHeight: '1.8' }}>
        <p>Telemedicine Platform For Remote Consultation</p>
        <p>Kritika Sharma • Saket Juneja • Vanshaj Goel | SRMS College, Bareilly</p>
      </div>
    </div>
  )
}
