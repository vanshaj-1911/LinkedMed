// server/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

const authRoutes = require('./routes/auth');
const doctorRoutes = require('./routes/doctors');
const appointmentRoutes = require('./routes/appointments');
const prescriptionRoutes = require('./routes/prescriptions');
const paymentRoutes = require('./routes/payment');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Socket.IO for WebRTC signaling
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Track active rooms
const activeRooms = {};

io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);

  socket.on('join-room', ({ roomId, userId, userName }) => {
    socket.join(roomId);
    activeRooms[roomId] = activeRooms[roomId] || [];
    activeRooms[roomId].push({ socketId: socket.id, userId, userName });
    socket.to(roomId).emit('user-joined', { userId, userName, socketId: socket.id });
    const others = activeRooms[roomId].filter(u => u.socketId !== socket.id);
    socket.emit('existing-users', others);
  });

  socket.on('webrtc-offer', ({ offer, to }) => {
    io.to(to).emit('webrtc-offer', { offer, from: socket.id });
  });

  socket.on('webrtc-answer', ({ answer, to }) => {
    io.to(to).emit('webrtc-answer', { answer, from: socket.id });
  });

  socket.on('ice-candidate', ({ candidate, to }) => {
    io.to(to).emit('ice-candidate', { candidate, from: socket.id });
  });

  socket.on('chat-message', ({ roomId, message, senderName }) => {
    io.to(roomId).emit('chat-message', { message, senderName, time: new Date().toLocaleTimeString() });
  });

  socket.on('chat-file', ({ roomId, fileName, fileType, fileData, senderName }) => {
    socket.to(roomId).emit('chat-file', { fileName, fileType, fileData, senderName })
  })
  socket.on('leave-room', ({ roomId, userId }) => {
    socket.to(roomId).emit('user-left', { userId, socketId: socket.id });
    socket.leave(roomId);
    if (activeRooms[roomId]) {
      activeRooms[roomId] = activeRooms[roomId].filter(u => u.socketId !== socket.id);
    }
  });

  socket.on('disconnect', () => {
    Object.keys(activeRooms).forEach(roomId => {
      const user = activeRooms[roomId] && activeRooms[roomId].find(u => u.socketId === socket.id);
      if (user) {
        socket.to(roomId).emit('user-left', { socketId: socket.id });
        activeRooms[roomId] = activeRooms[roomId].filter(u => u.socketId !== socket.id);
      }
    });
  });
});

// Middleware
app.use(cors({ origin: ['http://localhost:3000', 'http://127.0.0.1:3000'], credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/payment', paymentRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Telemedicine API running', features: ['auth','doctors','appointments','prescriptions','payment','video-webrtc'], timestamp: new Date() });
});

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  app.get('*', (req, res) => res.sendFile(path.join(__dirname, '../client/build/index.html')));
}

server.listen(PORT, () => {
  console.log('\n Telemedicine Server: http://localhost:' + PORT);
  console.log(' WebRTC Signaling (Socket.IO): active');
  console.log(' Stripe Payment Gateway: active\n');
});
