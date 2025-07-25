import { useState, useEffect, useRef } from 'react';
import socket from '@/socket.js';
import PrivateChat from './PrivateChat.jsx';
import JoinRoomForm from './JoinRoomForm.jsx';
import {
  Box, Typography, TextField, Button, IconButton, List, ListItem, ListItemText, ListItemButton, Badge , Divider, Tooltip, Paper
} from '@mui/material';
import { Group, Brightness4, Brightness7 } from '@mui/icons-material';
import { GetUserData } from '../../utils/userApi.js';

export default function Discussions({username1,room1,joined1}) {
  const [username, setUsername] = useState('');
  const [room, setRoom] = useState('');
  const [joined, setJoined] = useState(false);
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');
  const [messages, setMessages] = useState([]);
  const [usersInRoom, setUsersInRoom] = useState([]);
  const [onlineStatus, setOnlineStatus] = useState({});
  const [typingMsg, setTypingMsg] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(true);



  const refEnd = useRef();
  const typingTimeout = useRef();
 
   const userDataCalling = async () => {
    const data = await GetUserData();
    if (data?.email && data?.name) {
      setEmail(data.email);
      setUsername(data?.name);
    }
    setLoading(false);
  };

  useEffect(() => {
    userDataCalling();
  }, []);

  useEffect(() => {
  if (username1 && room1 && joined1) {
    setUsername(username1);
    setRoom(room1);
    setJoined(true);
    socket.emit('join_room', { username: username1, room: room1 });
    }
  }, [username1, room1, joined1]);


  useEffect(() => {
    socket.on('join_room', () => {});
    socket.on('load_history', msgs => setMessages(msgs));
    socket.on('receive_message', m => setMessages(prev => [...prev, m]));
    socket.on('user_joined', t => setMessages(prev => [...prev, { text: t, type: 'system' }]));
    socket.on('user_left', t => setMessages(prev => [...prev, { text: t, type: 'system' }]));
    socket.on('typing', m => setTypingMsg(m));
    socket.on('hide_typing', () => setTypingMsg(''));
    socket.on('update_user_list', ({ users, onlineStatus }) => {
      setUsersInRoom(users);
      setOnlineStatus(onlineStatus);
    });
    return () => {
    socket.emit('leave_room', { username, room });
    socket.removeAllListeners();
  };
  }, []);

  useEffect(() => refEnd.current?.scrollIntoView({ behavior: 'smooth' }), [messages]);

  const joinRoom = () => {
    if (!email.trim() || !room.trim()) return;
    socket.emit('join_room', { username:email, room });
    setJoined(true);
  };

  const sendMessage = () => {
    console.log(msg);
    if (!msg.trim()) return;
    socket.emit('send_message', { text: msg });
    setMsg('');
  };

  const onTyping = e => {
    setMsg(e.target.value);
    socket.emit('typing');
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => socket.emit('stop_typing'), 1000);
  };

  const bgColor = darkMode ? '#121212' : '#f5f5f5';
  const bubbleColor = (from) => from === username ? '#1976d2' : '#e0e0e0';
  const textColor = (from) => from === username ? '#fff' : '#000';

  return(
  <>{!joined?<JoinRoomForm
        username={email}
        room={room}
        darkMode={darkMode}
        setUsername={setUsername}
        setRoom={setRoom}
        joinRoom={joinRoom}
        setDarkMode={setDarkMode}
      />:
    <Box height="calc(100vh - 64px)" width="100%" display="flex" bgcolor={bgColor}>
      {/* Sidebar */}
      <Box width={300} p={2} bgcolor={darkMode ? '#1e1e1e' : '#fff'} borderRight="1px solid #ccc">
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" display="flex" alignItems="center"><Group fontSize="small" sx={{ mr: 1 }} />Members</Typography>
          <Tooltip title="Toggle theme">
            <IconButton onClick={() => setDarkMode(!darkMode)}>
              {darkMode ? <Brightness7 /> : <Brightness4 />}
            </IconButton>
          </Tooltip>
        </Box>
        <Divider sx={{ mb: 1 }} />
        <List dense>
          {usersInRoom.map(u => {
            const displayName = u === email ? `${u} (You)` : u;
            return (
              <ListItem key={u} disablePadding selected={u === selectedUser}>
                <ListItemButton onClick={() => setSelectedUser(u)}>
                  <Badge
                    color={onlineStatus[u] ? 'success' : 'default'}
                    variant="dot"
                    sx={{ mr: 1 }}
                  />
                  <ListItemText primary={displayName} />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>

        {selectedUser && (
          <Button fullWidth onClick={() => setSelectedUser(null)} sx={{ mt: 2 }}>← Back</Button>
        )}
      </Box>

      {/* Chat Area */}
      <Box flex={1} display="flex" flexDirection="column" p={2}>
        {selectedUser ? (
          <PrivateChat me={email} peer={selectedUser} />
        ) : (
          <>
            <Typography variant="subtitle1" gutterBottom>
              <strong>User:</strong> {username} | <strong>Room:</strong> {room}
            </Typography>
            <Box flex={1} overflow="auto" px={1}>
              {messages.map((m, i) => (
                <Box
                  key={i}
                  display="flex"
                  justifyContent={m.from === email ? 'flex-end' : 'flex-start'}
                  mb={1}
                >
                  <Paper
                    sx={{
                      p: 1,
                      borderRadius: 2,
                      bgcolor: m.type === 'system' ? '#ffe0b2' : bubbleColor(m.from),
                      color: m.type === 'system' ? '#000' : textColor(m.from),
                      maxWidth: '70%',
                    }}
                    elevation={2}
                  >
                    {m.type !== 'system' && (
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>
                        {m.from}
                      </Typography>
                    )}
                    <Typography variant="body2">{m.text}</Typography>
                    {m.timestamp && (
                      <Typography variant="caption" display="block" textAlign="right">
                        {m.timestamp}
                      </Typography>
                    )}
                  </Paper>
                </Box>
              ))}
              <div ref={refEnd} />
            </Box>
            {typingMsg && (
              <Typography variant="caption" color="textSecondary" mt={1}>
                {typingMsg}
              </Typography>
            )}
            <Box display="flex" mt={2} gap={1}>
              <TextField
                fullWidth
                placeholder="Type a message..."
                value={msg}
                onChange={onTyping}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
              />
              <Button variant="contained" onClick={sendMessage}>Send</Button>
            </Box>
          </>
        )}
      </Box>
    </Box>
  }</>) ;
}