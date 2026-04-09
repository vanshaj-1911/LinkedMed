import React, { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ]
}

// Allowed file types & max size
const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
]
const MAX_MB = 5

export default function VideoCall() {
  const { appointmentId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const localVideoRef  = useRef(null)
  const remoteVideoRef = useRef(null)
  const pcRef          = useRef(null)
  const socketRef      = useRef(null)
  const streamRef      = useRef(null)
  const timerRef       = useRef(null)
  const fileInputRef   = useRef(null)   // ← new: hidden file input
  const chatBottomRef  = useRef(null)   // ← new: auto-scroll anchor

  const [callState, setCallState]           = useState('connecting')
  const [isMuted, setIsMuted]               = useState(false)
  const [isVideoOff, setIsVideoOff]         = useState(false)
  const [remoteUser, setRemoteUser]         = useState('')
  const [remoteSocketId, setRemoteSocketId] = useState(null)
  const [duration, setDuration]             = useState(0)
  const [chatMsgs, setChatMsgs]             = useState([])
  const [chatInput, setChatInput]           = useState('')
  const [showChat, setShowChat]             = useState(false)
  const [camError, setCamError]             = useState('')
  const [fileError, setFileError]           = useState('')  // ← new
  const [uploading, setUploading]           = useState(false) // ← new

  const startTimer = useCallback(() => {
    timerRef.current = setInterval(() => setDuration(d => d + 1), 1000)
  }, [])

  const fmt = s => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`

  // ── Auto-scroll chat to bottom on new message ──
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMsgs])

  const cleanup = useCallback(() => {
    clearInterval(timerRef.current)
    streamRef.current?.getTracks().forEach(t => t.stop())
    pcRef.current?.close()
    if (socketRef.current) {
      socketRef.current.emit('leave-room', { roomId: appointmentId, userId: user?.id })
      socketRef.current.disconnect()
    }
  }, [appointmentId, user])

  const createPC = useCallback((targetSocketId) => {
    const pc = new RTCPeerConnection(ICE_SERVERS)
    pcRef.current = pc
    streamRef.current?.getTracks().forEach(t => pc.addTrack(t, streamRef.current))
    pc.ontrack = e => {
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = e.streams[0]
      setCallState('inCall')
      startTimer()
    }
    pc.onicecandidate = e => {
      if (e.candidate && socketRef.current)
        socketRef.current.emit('ice-candidate', { candidate: e.candidate, to: targetSocketId })
    }
    return pc
  }, [startTimer])

  useEffect(() => {
    if (!user) { navigate('/login'); return }

    let mounted = true

    const init = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        if (!mounted) { stream.getTracks().forEach(t => t.stop()); return }
        streamRef.current = stream
        if (localVideoRef.current) localVideoRef.current.srcObject = stream
      } catch (err) {
        setCamError('Cannot access camera/microphone. Check browser permissions.')
        setCallState('waiting')
        return
      }

      let io
      try {
        const mod = await import('socket.io-client')
        io = mod.io || mod.default
      } catch (err) {
        setCamError('Socket connection failed. Make sure the backend server is running.')
        return
      }

      if (!mounted) return

      const socket = io('http://localhost:5000', { transports: ['websocket', 'polling'] })
      socketRef.current = socket

      socket.on('connect', () => {
        socket.emit('join-room', { roomId: appointmentId, userId: user.id, userName: user.name })
        setCallState('waiting')
      })

      socket.on('connect_error', () => {
        setCamError('Cannot connect to server. Make sure the backend is running on port 5000.')
      })

      socket.on('existing-users', async (users) => {
        if (!mounted || users.length === 0) return
        const target = users[0]
        setRemoteUser(target.userName)
        setRemoteSocketId(target.socketId)
        const pc = createPC(target.socketId)
        const offer = await pc.createOffer()
        await pc.setLocalDescription(offer)
        socket.emit('webrtc-offer', { offer, to: target.socketId })
      })

      socket.on('user-joined', ({ userName, socketId }) => {
        if (!mounted) return
        setRemoteUser(userName)
        setRemoteSocketId(socketId)
      })

      socket.on('webrtc-offer', async ({ offer, from }) => {
        if (!mounted) return
        setRemoteSocketId(from)
        const pc = createPC(from)
        await pc.setRemoteDescription(new RTCSessionDescription(offer))
        const answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)
        socket.emit('webrtc-answer', { answer, to: from })
        setCallState('inCall')
        startTimer()
      })

      socket.on('webrtc-answer', async ({ answer }) => {
        if (pcRef.current && mounted)
          await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer))
      })

      socket.on('ice-candidate', async ({ candidate }) => {
        if (pcRef.current && mounted) {
          try { await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate)) } catch {}
        }
      })

      socket.on('user-left', () => {
        if (!mounted) return
        setCallState('ended')
        clearInterval(timerRef.current)
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null
      })

      // ── Receive text message ──
      socket.on('chat-message', msg => {
        if (mounted) setChatMsgs(prev => [...prev, { ...msg, type: 'text' }])
      })

      // ── Receive file from other participant ──
      socket.on('chat-file', ({ fileName, fileType, fileData, senderName }) => {
        if (mounted) {
          setChatMsgs(prev => [...prev, {
            type: 'file',
            fileName,
            fileType,
            fileData,
            senderName,
            time: new Date().toLocaleTimeString()
          }])
        }
      })
    }

    init()
    return () => { mounted = false; cleanup() }
  }, [appointmentId, user, navigate, createPC, startTimer, cleanup])

  const toggleMute = () => {
    streamRef.current?.getAudioTracks().forEach(t => { t.enabled = !t.enabled })
    setIsMuted(m => !m)
  }

  const toggleVideo = () => {
    streamRef.current?.getVideoTracks().forEach(t => { t.enabled = !t.enabled })
    setIsVideoOff(v => !v)
  }

  const endCall = () => {
    cleanup()
    setCallState('ended')
  }

  // ── Send text message ──
  const sendChat = (e) => {
    e.preventDefault()
    if (!chatInput.trim() || !socketRef.current) return
    socketRef.current.emit('chat-message', { roomId: appointmentId, message: chatInput, senderName: user.name })
    setChatMsgs(prev => [...prev, { type: 'text', message: chatInput, senderName: 'You', time: new Date().toLocaleTimeString() }])
    setChatInput('')
  }

  // ── Handle file selection ──
  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setFileError('')

    // Validate type
    if (!ALLOWED_TYPES.includes(file.type)) {
      setFileError('Only images (JPG/PNG/GIF/WEBP) and documents (PDF/DOC/DOCX) allowed.')
      e.target.value = ''
      return
    }

    // Validate size
    if (file.size > MAX_MB * 1024 * 1024) {
      setFileError(`File too large. Max allowed size is ${MAX_MB}MB.`)
      e.target.value = ''
      return
    }

    setUploading(true)

    const reader = new FileReader()
    reader.onload = (ev) => {
      const base64 = ev.target.result // full base64 data URL

      // Send to other participant via socket
      if (socketRef.current) {
        socketRef.current.emit('chat-file', {
          roomId: appointmentId,
          fileName: file.name,
          fileType: file.type,
          fileData: base64,
          senderName: user.name
        })
      }

      // Show in own chat immediately
      setChatMsgs(prev => [...prev, {
        type: 'file',
        fileName: file.name,
        fileType: file.type,
        fileData: base64,
        senderName: 'You',
        time: new Date().toLocaleTimeString()
      }])

      setUploading(false)
    }
    reader.onerror = () => {
      setFileError('Failed to read file. Please try again.')
      setUploading(false)
    }
    reader.readAsDataURL(file)
    e.target.value = '' // reset so same file can be re-sent
  }

  // ── Download a received file ──
  const downloadFile = (fileData, fileName) => {
    const a = document.createElement('a')
    a.href = fileData
    a.download = fileName
    a.click()
  }

  // ── Render individual chat bubble ──
  const renderMsg = (m, i) => {
    const isSelf = m.senderName === 'You'
    const bubble = {
      background: isSelf ? 'rgba(14,165,233,0.25)' : 'rgba(255,255,255,0.07)',
      borderRadius: '10px',
      padding: '10px',
      display: 'flex',
      flexDirection: 'column',
      gap: '6px',
      wordBreak: 'break-word'
    }

    if (m.type === 'file') {
      const isImage = m.fileType?.startsWith('image/')
      return (
        <div key={i} style={bubble}>
          <span style={{ fontSize:'11px', color:'#38bdf8', fontWeight:'700' }}>{m.senderName}</span>

          {isImage ? (
            // Image preview — click to download
            <div>
              <img
                src={m.fileData}
                alt={m.fileName}
                onClick={() => downloadFile(m.fileData, m.fileName)}
                title="Click to download"
                style={{ maxWidth:'100%', maxHeight:'180px', borderRadius:'8px', objectFit:'cover', cursor:'pointer', display:'block', border:'1px solid rgba(255,255,255,0.1)' }}
              />
              <div style={{ fontSize:'11px', color:'#94a3b8', marginTop:'4px' }}>🖼️ {m.fileName}</div>
            </div>
          ) : (
            // Document download card
            <div
              onClick={() => downloadFile(m.fileData, m.fileName)}
              style={{ display:'flex', alignItems:'center', gap:'10px', background:'rgba(255,255,255,0.08)', padding:'10px 14px', borderRadius:'8px', cursor:'pointer', border:'1px solid rgba(255,255,255,0.1)' }}
            >
              <span style={{ fontSize:'28px' }}>
                {m.fileType === 'application/pdf' ? '📄' : '📝'}
              </span>
              <div>
                <div style={{ fontSize:'13px', color:'#e2e8f0', fontWeight:'600' }}>{m.fileName}</div>
                <div style={{ fontSize:'11px', color:'#38bdf8' }}>⬇️ Click to download</div>
              </div>
            </div>
          )}

          <span style={{ fontSize:'10px', color:'#475569' }}>{m.time}</span>
        </div>
      )
    }

    // Plain text bubble
    return (
      <div key={i} style={bubble}>
        <span style={{ fontSize:'11px', color:'#38bdf8', fontWeight:'700' }}>{m.senderName}</span>
        <span style={{ fontSize:'14px', color:'#e2e8f0' }}>{m.message}</span>
        <span style={{ fontSize:'10px', color:'#475569' }}>{m.time}</span>
      </div>
    )
  }

  // ── ENDED SCREEN ──
  if (callState === 'ended') return (
    <div style={{ minHeight:'100vh', background:'#0f172a', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ background:'#1e293b', borderRadius:'24px', padding:'48px', textAlign:'center', maxWidth:'400px' }}>
        <div style={{ fontSize:'64px', marginBottom:'16px' }}>📵</div>
        <h2 style={{ fontSize:'28px', fontWeight:'800', color:'#fff', marginBottom:'8px' }}>Call Ended</h2>
        <p style={{ color:'#94a3b8', marginBottom:'8px' }}>Duration: {fmt(duration)}</p>
        <p style={{ color:'#64748b', marginBottom:'32px' }}>Your consultation has ended.</p>
        <div style={{ display:'flex', gap:'12px', justifyContent:'center' }}>
          <button onClick={() => navigate('/dashboard')} style={{ background:'#0ea5e9', color:'#fff', border:'none', padding:'12px 24px', borderRadius:'10px', cursor:'pointer', fontWeight:'700', fontSize:'15px' }}>
            Go to Dashboard
          </button>
          <button onClick={() => navigate('/doctors')} style={{ background:'rgba(255,255,255,0.1)', color:'#fff', border:'none', padding:'12px 24px', borderRadius:'10px', cursor:'pointer', fontWeight:'600', fontSize:'15px' }}>
            Book Another
          </button>
        </div>
      </div>
    </div>
  )

  // ── MAIN CALL SCREEN ──
  return (
    <div style={{ height:'100vh', display:'flex', flexDirection:'column', background:'#0f172a', color:'#fff' }}>

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 24px', background:'rgba(0,0,0,0.4)', borderBottom:'1px solid rgba(255,255,255,0.1)', flexWrap:'wrap', gap:'8px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'14px', flexWrap:'wrap' }}>
          <span style={{ fontSize:'18px', fontWeight:'800', color:'#38bdf8' }}>LinkedMed</span>
          <span style={{ fontSize:'13px', fontWeight:'600', background:'rgba(255,255,255,0.1)', padding:'4px 12px', borderRadius:'20px' }}>
            {callState==='connecting' && '🟡 Connecting...'}
            {callState==='waiting'    && '🟡 Waiting for participant...'}
            {callState==='inCall'     && `🟢 In Call — ${fmt(duration)}`}
          </span>
          {remoteUser && <span style={{ fontSize:'13px', color:'#94a3b8' }}>with {remoteUser}</span>}
        </div>
        <span style={{ fontSize:'11px', color:'#475569', background:'rgba(255,255,255,0.05)', padding:'4px 10px', borderRadius:'8px' }}>
          Room: {appointmentId?.substring(0,8)}...
        </span>
      </div>

      {/* Video area */}
      <div style={{ flex:1, position:'relative', overflow:'hidden', background:'#1e293b' }}>

        {/* Remote video */}
        <video ref={remoteVideoRef} autoPlay playsInline style={{ width:'100%', height:'100%', objectFit:'cover' }} />

        {/* Overlay when not in call */}
        {callState !== 'inCall' && (
          <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'rgba(15,23,42,0.9)', gap:'16px', textAlign:'center', padding:'20px' }}>
            {camError ? (
              <>
                <div style={{ fontSize:'48px' }}>⚠️</div>
                <p style={{ fontSize:'18px', fontWeight:'600', color:'#fca5a5' }}>{camError}</p>
                <p style={{ fontSize:'14px', color:'#64748b' }}>Make sure the backend server is running:<br /><code style={{ color:'#38bdf8' }}>node server/index.js</code></p>
              </>
            ) : (
              <>
                <div style={{ fontSize:'48px' }}>⏳</div>
                <p style={{ fontSize:'20px', fontWeight:'600', color:'#e2e8f0' }}>
                  {callState==='connecting' ? 'Setting up your camera...' : 'Waiting for the other participant...'}
                </p>
                <p style={{ fontSize:'14px', color:'#94a3b8' }}>Share your Appointment ID: <strong style={{ color:'#38bdf8' }}>{appointmentId?.substring(0,8)}</strong></p>
              </>
            )}
          </div>
        )}

        {/* Remote user name tag */}
        {callState==='inCall' && remoteUser && (
          <div style={{ position:'absolute', bottom:'12px', left:'12px', background:'rgba(0,0,0,0.6)', color:'#fff', padding:'4px 12px', borderRadius:'8px', fontSize:'13px', fontWeight:'600' }}>
            {remoteUser}
          </div>
        )}

        {/* Local video PIP */}
        <div style={{ position:'absolute', top:'16px', right: showChat ? '296px' : '16px', width:'200px', height:'150px', borderRadius:'14px', overflow:'hidden', border:'2px solid rgba(255,255,255,0.2)', boxShadow:'0 8px 32px rgba(0,0,0,0.5)', transition:'right 0.3s' }}>
          <video ref={localVideoRef} autoPlay playsInline muted style={{ width:'100%', height:'100%', objectFit:'cover', transform:'scaleX(-1)' }} />
          {isVideoOff && (
            <div style={{ position:'absolute', inset:0, background:'#1e293b', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'13px', color:'#94a3b8' }}>📷 Off</div>
          )}
          <div style={{ position:'absolute', bottom:'4px', left:'6px', fontSize:'10px', color:'#fff', background:'rgba(0,0,0,0.5)', padding:'2px 6px', borderRadius:'4px' }}>
            You
          </div>
        </div>

        {/* ── CHAT PANEL ── */}
        {showChat && (
          <div style={{ position:'absolute', top:0, right:0, width:'280px', height:'100%', background:'rgba(15,23,42,0.97)', display:'flex', flexDirection:'column', borderLeft:'1px solid rgba(255,255,255,0.1)' }}>

            {/* Chat header */}
            <div style={{ padding:'14px 16px', fontWeight:'700', fontSize:'15px', borderBottom:'1px solid rgba(255,255,255,0.1)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span>💬 In-Call Chat</span>
              <span style={{ fontSize:'11px', color:'#64748b', fontWeight:'400' }}>Max {MAX_MB}MB</span>
            </div>

            {/* Messages list */}
            <div style={{ flex:1, overflowY:'auto', padding:'12px', display:'flex', flexDirection:'column', gap:'10px' }}>
              {chatMsgs.length === 0 && (
                <p style={{ color:'#475569', fontSize:'13px', textAlign:'center', marginTop:'20px', lineHeight:'1.6' }}>
                  No messages yet.<br />Send text, images or documents below.
                </p>
              )}
              {chatMsgs.map((m, i) => renderMsg(m, i))}
              {/* Auto-scroll anchor */}
              <div ref={chatBottomRef} />
            </div>

            {/* File error */}
            {fileError && (
              <div style={{ margin:'0 12px', background:'rgba(239,68,68,0.15)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:'8px', padding:'8px 12px', fontSize:'12px', color:'#fca5a5' }}>
                ⚠️ {fileError}
                <button onClick={() => setFileError('')} style={{ float:'right', background:'none', border:'none', color:'#fca5a5', cursor:'pointer', fontSize:'14px', lineHeight:'1' }}>×</button>
              </div>
            )}

            {/* Uploading indicator */}
            {uploading && (
              <div style={{ margin:'0 12px', background:'rgba(14,165,233,0.15)', borderRadius:'8px', padding:'8px 12px', fontSize:'12px', color:'#38bdf8', textAlign:'center' }}>
                ⏳ Sending file...
              </div>
            )}

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={handleFileSelect}
              style={{ display:'none' }}
            />

            {/* Chat input bar */}
            <form onSubmit={sendChat} style={{ display:'flex', padding:'10px 12px', gap:'6px', borderTop:'1px solid rgba(255,255,255,0.1)', alignItems:'center' }}>

              {/* Attach file button */}
              <button
                type="button"
                onClick={() => { setFileError(''); fileInputRef.current?.click() }}
                disabled={uploading}
                title="Attach image or document"
                style={{ background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:'8px', padding:'8px 10px', cursor:'pointer', fontSize:'16px', color:'#94a3b8', flexShrink:0, opacity: uploading ? 0.5 : 1 }}
              >
                📎
              </button>

              {/* Text input */}
              <input
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                placeholder="Type a message..."
                style={{ flex:1, background:'rgba(255,255,255,0.1)', border:'none', borderRadius:'8px', padding:'8px 12px', color:'#fff', fontSize:'13px', outline:'none', fontFamily:'inherit' }}
              />

              {/* Send button */}
              <button
                type="submit"
                style={{ background:'#0ea5e9', color:'#fff', border:'none', borderRadius:'8px', padding:'8px 12px', cursor:'pointer', fontWeight:'600', fontSize:'13px', flexShrink:0 }}
              >
                Send
              </button>
            </form>

            {/* File type hint */}
            <div style={{ padding:'6px 12px 10px', fontSize:'11px', color:'#334155', textAlign:'center' }}>
              📎 Supports JPG · PNG · GIF · PDF · DOC · DOCX
            </div>

          </div>
        )}
      </div>

      {/* Controls */}
      <div style={{ display:'flex', justifyContent:'center', gap:'16px', padding:'16px', background:'rgba(0,0,0,0.5)', borderTop:'1px solid rgba(255,255,255,0.1)', flexWrap:'wrap' }}>
        {[
          { icon: isMuted ? '🔇' : '🎙️', label: isMuted ? 'Unmute' : 'Mute', action: toggleMute, active: isMuted },
          { icon: isVideoOff ? '📷' : '📹', label: isVideoOff ? 'Start Video' : 'Stop Video', action: toggleVideo, active: isVideoOff },
          { icon: '💬', label: 'Chat', action: () => setShowChat(c => !c), active: showChat },
        ].map((btn, i) => (
          <button key={i} onClick={btn.action}
            style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'4px', background: btn.active ? '#0ea5e9' : 'rgba(255,255,255,0.1)', border:'none', borderRadius:'14px', padding:'12px 20px', cursor:'pointer', color:'#fff', fontSize:'22px', minWidth:'68px' }}>
            {btn.icon}
            <span style={{ fontSize:'11px', color:'#94a3b8' }}>{btn.label}</span>
          </button>
        ))}
        <button onClick={endCall}
          style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'4px', background:'#ef4444', border:'none', borderRadius:'14px', padding:'12px 24px', cursor:'pointer', color:'#fff', fontSize:'22px', minWidth:'68px' }}>
          📵
          <span style={{ fontSize:'11px', color:'#fecaca' }}>End Call</span>
        </button>
      </div>
    </div>
  )
}
