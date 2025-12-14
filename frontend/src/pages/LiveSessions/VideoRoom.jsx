import React, { useEffect, useRef, useState } from 'react';
import { Box, Button, Typography, Grid, Paper, IconButton, CircularProgress } from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import CallEndIcon from '@mui/icons-material/CallEnd';
import io from 'socket.io-client';

const ICE_SERVERS = {
  iceServers: [{ urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'] }],
};

const VideoRoom = ({ session, user, onLeave }) => {
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [remoteStream, setRemoteStream] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState("Connecting...");
  
  const socketRef = useRef();
  const peerRef = useRef();
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localStreamRef = useRef(null); // Keep reference to stream to toggle tracks

  useEffect(() => {
    // 1. Initialize Socket
    socketRef.current = io('http://localhost:3000'); // Update with your actual port

    // 2. Get Media
    const startCall = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localStreamRef.current = stream;
        
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
        
        initWebRTC(stream);
      } catch (err) {
        console.error("Error accessing media:", err);
        setConnectionStatus("Error: Camera/Mic permission denied");
      }
    };

    startCall();

    return () => {
      // CLEANUP: Stop all tracks to turn off camera light
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (socketRef.current) socketRef.current.disconnect();
      if (peerRef.current) peerRef.current.close();
    };
  }, []);

  const initWebRTC = (localStream) => {
    const socket = socketRef.current;
    peerRef.current = new RTCPeerConnection(ICE_SERVERS);

    // Add local tracks
    localStream.getTracks().forEach((track) => {
        peerRef.current.addTrack(track, localStream);
    });

    // Handle Remote Stream
    peerRef.current.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
      setConnectionStatus("Connected");
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    // ICE Candidates
    peerRef.current.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('ice-candidate', {
          targetSocketId: null, // Broadcast to room (MVP 1-on-1 style)
          candidate: event.candidate,
        });
      }
    };

    // Join Room
    socket.emit('join_video_session', { sessionId: session._id, username: user.username });

    // --- Signaling Events ---
    socket.on('user_joined_video', async ({ socketId }) => {
      console.log("New user joined, creating offer...");
      const offer = await peerRef.current.createOffer();
      await peerRef.current.setLocalDescription(offer);
      socket.emit('offer', { targetSocketId: socketId, sdp: offer });
    });

    socket.on('offer', async ({ sdp, callerSocketId }) => {
      console.log("Received offer");
      await peerRef.current.setRemoteDescription(new RTCSessionDescription(sdp));
      const answer = await peerRef.current.createAnswer();
      await peerRef.current.setLocalDescription(answer);
      socket.emit('answer', { targetSocketId: callerSocketId, sdp: answer });
    });

    socket.on('answer', async ({ sdp }) => {
      console.log("Received answer");
      await peerRef.current.setRemoteDescription(new RTCSessionDescription(sdp));
    });

    socket.on('ice-candidate', async ({ candidate }) => {
      try {
        await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        console.error('Error adding ICE:', e);
      }
    });
  };

  // --- Toggle Controls ---
  const toggleMic = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !micOn;
        setMicOn(!micOn);
      }
    }
  };

  const toggleCamera = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !cameraOn;
        setCameraOn(!cameraOn);
      }
    }
  };

  return (
    <Box sx={{ height: '100vh', bgcolor: '#121212', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#1e1e1e' }}>
        <Typography variant="h6" color="white">{session.title}</Typography>
        <Typography variant="caption" sx={{ color: connectionStatus === 'Connected' ? '#4caf50' : '#ff9800' }}>
           ● {connectionStatus}
        </Typography>
      </Box>

      {/* Video Grid */}
      <Grid container spacing={2} sx={{ flexGrow: 1, p: 2, justifyContent: 'center', alignItems: 'center' }}>
        
        {/* Remote Stream */}
        <Grid item xs={12} md={8} sx={{ height: '100%' }}>
          <Paper sx={{ 
            height: '100%', 
            bgcolor: 'black', 
            borderRadius: 3, 
            overflow: 'hidden', 
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative'
          }}>
            {remoteStream ? (
                <video ref={remoteVideoRef} autoPlay playsInline style={{ width: '100%', height: '100%' }} />
            ) : (
                <Box textAlign="center">
                  <CircularProgress color="primary" />
                  <Typography color="gray" mt={2}>Waiting for participants...</Typography>
                </Box>
            )}
          </Paper>
        </Grid>

        {/* Local Stream */}
        <Grid item xs={12} md={4} sx={{ height: { xs: '200px', md: '100%' } }}>
          <Paper sx={{ 
            height: '100%', 
            bgcolor: '#2c2c2c', 
            borderRadius: 3, 
            overflow: 'hidden', 
            position: 'relative',
            border: '2px solid #333'
          }}>
             <video ref={localVideoRef} autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
             
             {/* Local User Label */}
             <Box sx={{ position: 'absolute', bottom: 10, left: 10, bgcolor: 'rgba(0,0,0,0.6)', px: 1, borderRadius: 1 }}>
                <Typography variant="caption" color="white">You {micOn ? '' : '(Muted)'}</Typography>
             </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Footer Controls */}
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', gap: 3, bgcolor: '#1e1e1e' }}>
        <IconButton onClick={toggleMic} sx={{ bgcolor: micOn ? '#3f51b5' : '#f44336', color: 'white', '&:hover': { filter: 'brightness(1.2)' }, width: 50, height: 50 }}>
          {micOn ? <MicIcon /> : <MicOffIcon />}
        </IconButton>
        
        <IconButton onClick={toggleCamera} sx={{ bgcolor: cameraOn ? '#3f51b5' : '#f44336', color: 'white', '&:hover': { filter: 'brightness(1.2)' }, width: 50, height: 50 }}>
            {cameraOn ? <VideocamIcon /> : <VideocamOffIcon />}
        </IconButton>

        <Button 
            variant="contained" 
            color="error" 
            onClick={onLeave}
            startIcon={<CallEndIcon />}
            sx={{ borderRadius: 50, px: 4, bgcolor: '#d32f2f' }}
        >
          End Call
        </Button>
      </Box>
    </Box>
  );
};

export default VideoRoom;