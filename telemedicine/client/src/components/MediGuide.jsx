import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

// Quick reply suggestions per context
const SUGGESTIONS = {
  default: ['How do I book?', 'Show doctors', 'Video call help', 'Payment & refunds', 'Common symptoms'],
  booking: ['Choose a doctor', 'Select time slot', 'Pay for appointment', 'Cancel booking'],
  symptoms: ['Fever & cold', 'Headache', 'Stomach pain', 'Skin issues', 'Heart concern'],
  payment: ['How to pay?', 'Get a refund', 'Payment failed', 'Refund timeline'],
}

// Knowledge base responses
const KB = {
  greet: {
    triggers: ['hi','hello','hey','namaste','helo','hii'],
    response: "Hello! 👋 I'm **MediGuide**, your AI health assistant for LinkedMed.\n\nI can help you:\n• 📅 Book appointments\n• 👨‍⚕️ Find the right doctor\n• 💊 Understand symptoms\n• 💳 Payment & refunds\n• 📹 Video call guidance\n\nWhat can I help you with today?"
  },
  book: {
    triggers: ['book','appointment','consult','how do i book','schedule'],
    response: "📅 **How to Book an Appointment:**\n\n1. Go to **Doctors** page from the navbar\n2. Browse or search for your specialist\n3. Click **Book Appointment**\n4. Choose consultation type (Video/Audio/Chat)\n5. Select date & time slot\n6. Describe your symptoms\n7. Complete payment\n\n⚠️ Note: The doctor will **review and accept** your request. You'll see the status in your Dashboard.\n\nShall I take you to the Doctors page?",
    action: { label: '👨‍⚕️ Browse Doctors', path: '/doctors' }
  },
  doctors: {
    triggers: ['doctor','specialist','find doctor','show doctors','available doctors'],
    response: "👨‍⚕️ **Available Specialists on LinkedMed:**\n\n• 🏥 General Physician — Dr. Rajesh Sharma\n• ❤️ Cardiologist — Dr. Priya Verma\n• 🔬 Dermatologist — Dr. Anil Kumar\n• 👶 Pediatrician — Dr. Meena Patel\n\nAll doctors offer **Video, Audio & Chat** consultations.\n\nYou can search by name or filter by specialization on the Doctors page.",
    action: { label: '👨‍⚕️ See All Doctors', path: '/doctors' }
  },
  video: {
    triggers: ['video call','video','webrtc','call','how call works','join call'],
    response: "📹 **How Video Calls Work:**\n\n1. Book & pay for an appointment\n2. Wait for doctor to **accept** your request\n3. On appointment day, go to **Dashboard**\n4. Click the **📹 Join Call** button\n5. Allow camera & microphone access\n6. The doctor joins — call starts automatically!\n\n**During the call you can:**\n• Mute/unmute mic 🎙️\n• Turn camera on/off 📷\n• Send files & images 📎\n• Chat via text 💬\n\n💡 Tip: Open the call in two browser tabs to demo it!"
  },
  payment: {
    triggers: ['pay','payment','price','fee','cost','how to pay','stripe'],
    response: "💳 **Payment Information:**\n\n• Payment is collected **upfront** when booking\n• Powered by **Stripe** (secure)\n• Supported: Credit/Debit cards\n\n**Test Card for Demo:**\n```\nCard: 4242 4242 4242 4242\nExpiry: 12/26  CVV: 123\n```\n\n**Consultation Fees:**\n• General Physician: ₹500\n• Cardiologist: ₹1,200\n• Dermatologist: ₹700\n• Pediatrician: ₹600"
  },
  refund: {
    triggers: ['refund','money back','return money','refund policy','cancelled refund','rejected refund'],
    response: "💰 **Refund Policy:**\n\n✅ **Auto Refund** — If a doctor **rejects** your appointment, refund is automatically processed\n\n✅ **Manual Refund** — Go to Dashboard → find the appointment → click **💰 Request Refund**\n\n📋 **Refund Timeline:**\n• Demo mode: Instant\n• Real Stripe: 3–5 business days\n\n**Eligible for refund if:**\n• Doctor rejected your appointment\n• Doctor accepted but you want to cancel\n• Technical issues during consultation\n\nGo to your Dashboard to request a refund.",
    action: { label: '📊 Go to Dashboard', path: '/dashboard' }
  },
  fever: {
    triggers: ['fever','cold','cough','temperature','flu','viral'],
    response: "🌡️ **Fever & Cold Symptoms:**\n\nCommon causes:\n• Viral infection (common cold, flu)\n• Bacterial infection\n• COVID-19\n\n**Home remedies:**\n• Stay hydrated (water, ORS)\n• Rest adequately\n• Paracetamol for fever > 100°F\n• Steam inhalation for congestion\n\n⚠️ **See a doctor immediately if:**\n• Fever > 103°F (39.4°C)\n• Difficulty breathing\n• Fever lasting > 3 days\n\nWould you like to consult a General Physician?",
    action: { label: '🏥 Book General Physician', path: '/doctors' }
  },
  headache: {
    triggers: ['headache','head pain','migraine','head ache'],
    response: "🤕 **Headache Guidance:**\n\nCommon types:\n• Tension headache (stress-related)\n• Migraine (throbbing, one-sided)\n• Sinus headache (pressure around eyes)\n• Cluster headache (severe, around eye)\n\n**Quick relief:**\n• Drink water (dehydration is common cause)\n• Rest in a dark, quiet room\n• Cold/warm compress on forehead\n• Paracetamol or Ibuprofen\n\n⚠️ **Consult a doctor if:**\n• Sudden severe 'thunderclap' headache\n• Headache with fever & stiff neck\n• Frequent migraines affecting daily life",
    action: { label: '👨‍⚕️ Consult a Doctor', path: '/doctors' }
  },
  stomach: {
    triggers: ['stomach','stomach pain','vomiting','nausea','diarrhea','gas','acidity','digestion'],
    response: "🫁 **Stomach & Digestive Issues:**\n\nCommon causes:\n• Acidity / GERD\n• Food poisoning\n• Irritable Bowel Syndrome (IBS)\n• Gastroenteritis\n\n**Home care:**\n• Eat light — rice, banana, toast\n• Avoid spicy, oily food\n• Stay hydrated with ORS or coconut water\n• Antacids for acidity relief\n\n⚠️ **See a doctor if:**\n• Severe/persistent pain > 6 hours\n• Blood in stool or vomit\n• High fever with stomach pain",
    action: { label: '👨‍⚕️ Consult Physician', path: '/doctors' }
  },
  skin: {
    triggers: ['skin','rash','itching','acne','eczema','allergy','skin issue'],
    response: "🔬 **Skin Issues:**\n\nCommon conditions:\n• Acne — hormonal or bacterial\n• Eczema — dry, itchy patches\n• Fungal infection — ringworm, athlete's foot\n• Allergic rash — contact dermatitis\n• Psoriasis — scaly patches\n\n**General care:**\n• Keep skin clean and moisturized\n• Avoid scratching rashes\n• Use fragrance-free products\n• Antihistamines for allergic reactions\n\nOur **Dermatologist Dr. Anil Kumar** can help!",
    action: { label: '🔬 Book Dermatologist', path: '/doctors' }
  },
  heart: {
    triggers: ['heart','chest pain','chest','breathing','shortness of breath','cardiac','bp','blood pressure'],
    response: "❤️ **Heart & Chest Symptoms:**\n\n⚠️ **URGENT — Call emergency (112) immediately if:**\n• Crushing chest pain spreading to arm/jaw\n• Sudden difficulty breathing\n• Loss of consciousness\n\n**For mild symptoms consult a doctor:**\n• Palpitations (fast/irregular heartbeat)\n• Mild chest discomfort\n• High blood pressure\n• Shortness of breath on exertion\n\nOur **Cardiologist Dr. Priya Verma** (⭐ 4.9) specializes in heart conditions.",
    action: { label: '❤️ Book Cardiologist', path: '/doctors' }
  },
  register: {
    triggers: ['register','sign up','create account','new account','how to register'],
    response: "📝 **How to Register:**\n\n1. Click **Register** in the top navbar\n2. Fill in your name, email & password\n3. Add optional details (age, blood group)\n4. Click **Create Account**\n5. You're in! Start booking appointments.\n\n⚡ Registration is **free** and takes under 30 seconds.",
    action: { label: '📝 Register Now', path: '/register' }
  },
  login: {
    triggers: ['login','sign in','how to login','forgot password','cant login'],
    response: "🔐 **Login Help:**\n\n**Demo accounts you can use:**\n\n👑 Admin: vanshaj7770@gmail.com / Pfl@82732\n🧑 Patient: patient@demo.com / Patient@1234\n👨‍⚕️ Doctor: dr.sharma@telemedicine.com / Doctor@1234\n\nClick the quick login buttons on the Login page for instant access!",
    action: { label: '🔐 Go to Login', path: '/login' }
  },
  prescription: {
    triggers: ['prescription','medicine','medicines','rx','digital prescription'],
    response: "💊 **Digital Prescriptions:**\n\nAfter your consultation:\n1. Doctor writes a digital prescription\n2. It appears in your **Dashboard → Prescriptions** tab\n3. Contains: Diagnosis, Medicines, Instructions, Follow-up date\n\nAll prescriptions are stored securely in the cloud and accessible anytime from your Dashboard.",
    action: { label: '📊 View Dashboard', path: '/dashboard' }
  },
  emergency: {
    triggers: ['emergency','urgent','ambulance','112','critical','serious'],
    response: "🚨 **MEDICAL EMERGENCY:**\n\n**Call 112 immediately** for:\n• Heart attack symptoms\n• Stroke symptoms (face drooping, arm weakness, speech difficulty)\n• Severe breathing difficulty\n• Unconsciousness\n• Severe allergic reaction\n• Heavy bleeding\n\n📞 **Emergency Numbers (India):**\n• Medical Emergency: 112\n• Ambulance: 102\n• AIIMS Helpline: 1800-11-7911\n\n⚠️ TeleMed is for non-emergency consultations only."
  },
}

const FALLBACK = "I'm not sure about that, but I'm here to help! 😊\n\nYou can ask me about:\n• 📅 Booking appointments\n• 👨‍⚕️ Finding doctors\n• 💊 Symptoms guidance\n• 💳 Payments & refunds\n• 📹 Video call help"

function getBotResponse(input) {
  const lower = input.toLowerCase().trim()
  for (const [, entry] of Object.entries(KB)) {
    if (entry.triggers.some(t => lower.includes(t))) {
      return { text: entry.response, action: entry.action || null }
    }
  }
  return { text: FALLBACK, action: null }
}

function formatText(text) {
  return text.split('\n').map((line, i) => {
    // Bold
    line = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Code inline
    line = line.replace(/`(.*?)`/g, '<code style="background:rgba(255,255,255,0.15);padding:1px 5px;border-radius:4px;font-family:monospace">$1</code>')
    return <p key={i} dangerouslySetInnerHTML={{ __html: line || '&nbsp;' }} style={{ margin:'2px 0', lineHeight:'1.5' }} />
  })
}

export default function MediGuide() {
  const [open, setOpen] = useState(false)
  const [msgs, setMsgs] = useState([
    { from:'bot', text:"👋 Hi! I'm **MediGuide**, your AI health assistant.\n\nHow can I help you today?", time: new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}) }
  ])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const [suggestions, setSuggestions] = useState(SUGGESTIONS.default)
  const bottomRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior:'smooth' })
  }, [msgs, open])

  const sendMessage = async (text) => {
    if (!text.trim()) return
    const userMsg = { from:'user', text, time: new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}) }
    setMsgs(prev => [...prev, userMsg])
    setInput('')
    setTyping(true)

    // Simulate typing delay
    await new Promise(r => setTimeout(r, 700 + Math.random()*600))

    const { text: botText, action } = getBotResponse(text)
    const botMsg = { from:'bot', text: botText, action, time: new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}) }
    setMsgs(prev => [...prev, botMsg])
    setTyping(false)

    // Update suggestions based on topic
    const lower = text.toLowerCase()
    if (lower.includes('book') || lower.includes('appoint')) setSuggestions(SUGGESTIONS.booking)
    else if (lower.includes('symptom') || lower.includes('fever') || lower.includes('pain')) setSuggestions(SUGGESTIONS.symptoms)
    else if (lower.includes('pay') || lower.includes('refund')) setSuggestions(SUGGESTIONS.payment)
    else setSuggestions(SUGGESTIONS.default)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    sendMessage(input)
  }

  return (
    <>
      {/* ── Floating Button ── */}
      <button onClick={() => setOpen(o => !o)}
        style={{ position:'fixed', bottom:'28px', right:'28px', zIndex:9998, width:'60px', height:'60px', borderRadius:'50%', background:'linear-gradient(135deg,#0ea5e9,#0284c7)', border:'none', cursor:'pointer', boxShadow:'0 8px 24px rgba(14,165,233,0.5)', fontSize:'26px', display:'flex', alignItems:'center', justifyContent:'center', transition:'transform 0.2s', transform: open ? 'rotate(20deg)' : 'rotate(0)' }}
        title="MediGuide AI Assistant">
        {open ? '✕' : '🤖'}
      </button>

      {/* Pulse ring */}
      {!open && (
        <div style={{ position:'fixed', bottom:'28px', right:'28px', zIndex:9997, width:'60px', height:'60px', borderRadius:'50%', border:'2px solid rgba(14,165,233,0.4)', animation:'pulse 2s infinite', pointerEvents:'none' }} />
      )}

      {/* ── Chat Window ── */}
      {open && (
        <div style={{ position:'fixed', bottom:'100px', right:'28px', zIndex:9999, width:'360px', maxHeight:'540px', background:'#0f172a', borderRadius:'20px', boxShadow:'0 20px 60px rgba(0,0,0,0.4)', display:'flex', flexDirection:'column', border:'1px solid rgba(255,255,255,0.1)', overflow:'hidden' }}>

          {/* Header */}
          <div style={{ background:'linear-gradient(135deg,#0ea5e9,#0284c7)', padding:'16px 20px', display:'flex', alignItems:'center', gap:'12px' }}>
            <div style={{ width:'40px', height:'40px', background:'rgba(255,255,255,0.2)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px', flexShrink:0 }}>🤖</div>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:'800', color:'#fff', fontSize:'15px' }}>MediGuide</div>
              <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.8)', display:'flex', alignItems:'center', gap:'4px' }}>
                <span style={{ width:'7px', height:'7px', background:'#4ade80', borderRadius:'50%', display:'inline-block' }} />
                AI Health Assistant • Always Online
              </div>
            </div>
            <button onClick={() => setOpen(false)} style={{ background:'rgba(255,255,255,0.15)', border:'none', color:'#fff', width:'28px', height:'28px', borderRadius:'50%', cursor:'pointer', fontSize:'14px', display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
          </div>

          {/* Messages */}
          <div style={{ flex:1, overflowY:'auto', padding:'16px', display:'flex', flexDirection:'column', gap:'12px', maxHeight:'320px' }}>
            {msgs.map((m, i) => (
              <div key={i} style={{ display:'flex', flexDirection:'column', alignItems: m.from==='user' ? 'flex-end' : 'flex-start', gap:'4px' }}>
                <div style={{ maxWidth:'85%', background: m.from==='user' ? 'linear-gradient(135deg,#0ea5e9,#0284c7)' : 'rgba(255,255,255,0.07)', borderRadius: m.from==='user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px', padding:'10px 14px', color:'#e2e8f0', fontSize:'13px', border: m.from==='bot' ? '1px solid rgba(255,255,255,0.08)' : 'none' }}>
                  {formatText(m.text)}
                  {m.action && (
                    <button onClick={() => { navigate(m.action.path); setOpen(false) }}
                      style={{ marginTop:'10px', background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.25)', color:'#fff', padding:'6px 14px', borderRadius:'8px', fontSize:'12px', fontWeight:'600', cursor:'pointer', width:'100%' }}>
                      {m.action.label} →
                    </button>
                  )}
                </div>
                <span style={{ fontSize:'10px', color:'#475569' }}>{m.time}</span>
              </div>
            ))}

            {/* Typing indicator */}
            {typing && (
              <div style={{ display:'flex', alignItems:'flex-start', gap:'4px' }}>
                <div style={{ background:'rgba(255,255,255,0.07)', borderRadius:'16px 16px 16px 4px', padding:'10px 16px', border:'1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ display:'flex', gap:'4px', alignItems:'center' }}>
                    {[0,1,2].map(j => (
                      <div key={j} style={{ width:'6px', height:'6px', background:'#64748b', borderRadius:'50%', animation:`bounce 0.8s ${j*0.15}s infinite` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Suggestions */}
          <div style={{ padding:'8px 12px', display:'flex', gap:'6px', flexWrap:'wrap', borderTop:'1px solid rgba(255,255,255,0.06)' }}>
            {suggestions.slice(0,3).map((s, i) => (
              <button key={i} onClick={() => sendMessage(s)}
                style={{ background:'rgba(14,165,233,0.15)', border:'1px solid rgba(14,165,233,0.3)', color:'#38bdf8', padding:'5px 10px', borderRadius:'20px', fontSize:'11px', fontWeight:'500', cursor:'pointer', whiteSpace:'nowrap' }}>
                {s}
              </button>
            ))}
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} style={{ display:'flex', padding:'12px', gap:'8px', borderTop:'1px solid rgba(255,255,255,0.08)' }}>
            <input value={input} onChange={e => setInput(e.target.value)} placeholder="Ask MediGuide anything..."
              style={{ flex:1, background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:'10px', padding:'10px 14px', color:'#fff', fontSize:'13px', outline:'none', fontFamily:'inherit' }} />
            <button type="submit" disabled={!input.trim() || typing}
              style={{ background:'#0ea5e9', color:'#fff', border:'none', borderRadius:'10px', padding:'10px 14px', cursor:'pointer', fontWeight:'700', fontSize:'14px', opacity: (!input.trim()||typing) ? 0.5 : 1 }}>
              ➤
            </button>
          </form>
        </div>
      )}

      <style>{`
        @keyframes pulse { 0%,100%{transform:scale(1);opacity:0.6} 50%{transform:scale(1.3);opacity:0} }
        @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
      `}</style>
    </>
  )
}
