import express from 'express';
import http from 'http';
import cors from 'cors';
import mongoose from 'mongoose';
import { Server } from 'socket.io';

// Import Models
// import RoomUser from './models/roomUser.model.js'; // Assuming you kept your existing file
import LiveSession from '../models/liveSession.model.js'; // The new file created above

// Initialize App
const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

// --- EXISTING MODELS (Kept for compatibility) ---
const Message = mongoose.model('Message', new mongoose.Schema({
  text: String, from: String, to: String,
  room: String, timestamp: String, private: Boolean
}));

const RoomUser = mongoose.model('RoomUser', new mongoose.Schema({
  room: String, username: String
}));
// --- STATE MANAGEMENT ---
// Note: In production, use Redis for this. Memory is fine for MVP.
const users = {}; // socket.id -> { username, room/session }
const usernameToSocket = {}; 
const onlineStatus = {};

// ==========================================
// 🚀 REST API: SESSION MANAGEMENT
// ==========================================

// 1. Create a new Live Session
// In server.js

// 1. Create a new Live Session
app.post('/api/sessions', async (req, res) => {
  try {
    console.log("📥 Receiving Session Data:", req.body); // DEBUG LOG

    const { title, description, host, scheduledAt, participants } = req.body;

    // 1. Validation: Check for required fields
    if (!title || !host || !scheduledAt) {
      console.error("❌ Missing Fields:", { title, host, scheduledAt });
      return res.status(400).json({ message: "Missing required fields (title, host, or scheduledAt)" });
    }

    // 2. Create Session
    const session = await LiveSession.create({ 
      title, 
      description, 
      host, 
      scheduledAt,
      participants: participants || [] // Ensure it's an array
    });

    console.log("✅ Session Created:", session._id);
    res.status(201).json(session);
  } catch (error) {
    console.error("🔥 SERVER ERROR:", error); // This shows the real error in terminal
    res.status(500).json({ error: error.message });
  }
});

// 2. Get All Sessions (Upcoming & Live)
app.get('/api/sessions', async (req, res) => {
  try {
    const sessions = await LiveSession.find({ status: { $ne: 'ende' } })
      .sort({ scheduledAt: 1 });
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Get Specific Session
app.get('/api/sessions/:id', async (req, res) => {
  try {
    const session = await LiveSession.findById(req.params.id);
    if (!session) return res.status(404).json({ message: "Session not found" });
    res.json(session);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Update Session Status (Start/End)
app.put('/api/sessions/:id/status', async (req, res) => {
  try {
    const { status } = req.body; // 'live' or 'ended'
    const session = await LiveSession.findByIdAndUpdate(
      req.params.id, 
      { status }, 
      { new: true }
    );
    
    // If going live, notify everyone in chat (Optional feature)
    if(status === 'live'){
        io.emit('session_live_announcement', { 
            message: `Session "${session.title}" is now Live!`, 
            sessionId: session._id 
        });
    }

    res.json(session);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 5. Your Existing Chat History Endpoint
app.post('/private_history', async (req, res) => {
  const { userA, userB } = req.body.between;
  const history = await Message.find({
    private: true,
    $or: [
      { from: userA, to: userB },
      { from: userB, to: userA }
    ]
  }).sort({ _id: 1 });
  res.json(history);
});


// ==========================================
// 🔌 SOCKET.IO: SIGNALING & CHAT
// ==========================================

io.on('connection', (socket) => {
  console.log('🟢', socket.id, 'connected');

  // --- EXISTING CHAT LOGIC (Preserved) ---
  socket.on('join_room', async ({ username, room }) => {
    users[socket.id] = { username, room };
    usernameToSocket[username] = socket.id;
    onlineStatus[username] = true;

    await RoomUser.updateOne({ room, username }, { room, username }, { upsert: true });

    socket.join(room);
    socket.to(room).emit('user_joined', `${username} joined ${room}`);

    const roomUsers = await RoomUser.find({ room }).distinct('username');
    io.to(room).emit('update_user_list', { users: roomUsers, onlineStatus });

    const history = await Message.find({ room, private: false }).sort({ _id: -1 }).limit(20);
    socket.emit('load_history', history.reverse());
  });

  socket.on('send_message', async ({ text }) => {
    const u = users[socket.id];
    if (!u) return;

    const msg = {
      text, from: u.username, room: u.room,
      timestamp: new Date().toLocaleTimeString(),
      private: false
    };
    await Message.create(msg);
    io.to(u.room).emit('receive_message', msg);
  });
  socket.on('private_message', async ({ from, to, text }) => {
    const ts = new Date().toLocaleTimeString();
    const msg = { text, from, to, timestamp: ts, private: true };
    await Message.create(msg);

    const dest = usernameToSocket[to];
    if (dest) io.to(dest).emit('receive_private_message', msg);
  });

  socket.on('typing', () => {
    const u = users[socket.id];
    if (u) socket.to(u.room).emit('show_typing', `${u.username} is typing...`);
  });

  socket.on('stop_typing', () => {
    const u = users[socket.id];
    if (u) socket.to(u.room).emit('hide_typing');
  });

  // ==========================================
  // 🎥 NEW: WEBRTC SIGNALING LOGIC
  // ==========================================

  // 1. Join Video Session
  socket.on('join_video_session', async ({ sessionId, username }) => {
    users[socket.id] = { username, room: sessionId }; // Reuse user tracking
    socket.join(sessionId);

    // Add user to DB participant list (optional)
    await LiveSession.findByIdAndUpdate(sessionId, { $addToSet: { participants: username }});

    // Notify others in session that a new user joined
    // They will initiate the WebRTC Offer
    socket.to(sessionId).emit('user_joined_video', { socketId: socket.id, username });
    
    // Send list of existing users to the new joiner (so they know who to expect)
    const socketsInRoom = await io.in(sessionId).fetchSockets();
    const existingUsers = socketsInRoom
        .map(s => ({ socketId: s.id, username: users[s.id]?.username }))
        .filter(u => u.socketId !== socket.id); // Exclude self

    socket.emit('all_participants', existingUsers);
  });

  // 2. Offer (Step A: Caller sends offer)
  socket.on('offer', (payload) => {
    // payload: { targetSocketId, sdp, callerUsername }
    io.to(payload.targetSocketId).emit('offer', {
      sdp: payload.sdp,
      callerSocketId: socket.id,
      callerUsername: users[socket.id]?.username
    });
  });

  // 3. Answer (Step B: Receiver sends answer)
  socket.on('answer', (payload) => {
    // payload: { targetSocketId, sdp }
    io.to(payload.targetSocketId).emit('answer', {
      sdp: payload.sdp,
      senderSocketId: socket.id
    });
  });

  // 4. ICE Candidate (Step C: Exchange network details)
  socket.on('ice-candidate', (payload) => {
    // payload: { targetSocketId, candidate }
    io.to(payload.targetSocketId).emit('ice-candidate', {
      candidate: payload.candidate,
      senderSocketId: socket.id
    });
  });

  // 5. Toggle Audio/Video Status (User muted mic/cam)
  socket.on('media_status_change', ({ type, status, sessionId }) => {
      socket.to(sessionId).emit('on_media_status_change', {
          socketId: socket.id,
          type, // 'audio' or 'video'
          status // true (on) or false (off)
      });
  });

  // 6. Leave Session
  socket.on('leave_video_session', ({ sessionId }) => {
      handleDisconnect(socket);
  });

  // --- DISCONNECT HANDLING ---
  socket.on('disconnect', () => {
    handleDisconnect(socket);
  });
});

// Helper function to handle cleanups
async function handleDisconnect(socket) {
    const u = users[socket.id];
    if (!u) return;

    // Remove from memory
    delete users[socket.id];
    delete usernameToSocket[u.username];
    onlineStatus[u.username] = false;

    // Notify Chat Room
    io.to(u.room).emit('user_left', `${u.username} left`);
    
    // Notify Video Session (Crucial for closing Peer Connections)
    io.to(u.room).emit('user_left_video', { socketId: socket.id });

    // Update list for chat
    // Note: Assuming 'room' implies either chat room or session ID here
    const roomUsers = await RoomUser.find({ room: u.room }).distinct('username');
    io.to(u.room).emit('update_user_list', { users: roomUsers, onlineStatus });
}

export { io, server, app };
export default RoomUser;