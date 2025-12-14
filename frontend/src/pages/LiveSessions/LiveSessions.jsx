import React, { useState, useEffect } from "react";
import {
  Box, Tabs, Tab, Card, CardContent, Typography, Chip, Grid,
  Avatar, Container, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, Divider, CircularProgress, TextField, 
  Autocomplete, IconButton, Paper, useTheme, alpha
} from "@mui/material";
import {
  Add as AddIcon,
  PlayArrow as PlayArrowIcon,
  Stop as StopIcon,
  CalendarToday as CalendarIcon,
  AccessTime as TimeIcon,
  Person as PersonIcon,
  VideoCameraBack as VideoIcon,
  Close as CloseIcon,
  EventBusy as NoSessionIcon
} from "@mui/icons-material";
import VideoRoom from "./VideoRoom";
import axios from "axios";
import { GetUserData } from "../../utils/userApi";

const API_URL = "http://localhost:3000";

// --- CUSTOM STYLES & ANIMATIONS ---
const styles = {
  pulse: {
    '@keyframes pulse': {
      '0%': { boxShadow: '0 0 0 0 rgba(211, 47, 47, 0.7)' },
      '70%': { boxShadow: '0 0 0 10px rgba(211, 47, 47, 0)' },
      '100%': { boxShadow: '0 0 0 0 rgba(211, 47, 47, 0)' },
    },
    animation: 'pulse 2s infinite',
  },
  cardHover: {
    transition: 'transform 0.2s, box-shadow 0.2s',
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: '0 12px 24px rgba(0,0,0,0.1)',
    }
  }
};

const LiveSessions = () => {
  const theme = useTheme();
  const [selectedTab, setSelectedTab] = useState("live");
  
  // Data State
  const [sessions, setSessions] = useState([]);
  const [allUsers, setAllUsers] = useState([]); 
  const [currentUser, setCurrentUser] = useState(null); 
  const [loading, setLoading] = useState(true);

  // Dialog State
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openDetailDialog, setOpenDetailDialog] = useState(false);
  const [activeSession, setActiveSession] = useState(null);
  const [joinedSession, setJoinedSession] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    invitedUsers: [] 
  });

  // --- 1. Fetch Initial Data ---
  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      try {
        const data = await GetUserData();
        setCurrentUser(data);

        const usersRes = await axios.get(`${API_URL}/api/users`);
        setAllUsers(usersRes.data.items || []);

        await refreshSessions();
      } catch (error) {
        console.error("Init Error", error);
      } finally {
        setLoading(false);
      }
    };
    initData();
  }, []);

  const refreshSessions = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/sessions`);
      const mapped = res.data.map(s => ({
        ...s,
        status: s.status === 'scheduled' ? 'upcoming' : s.status === 'ended' ? 'completed' : 'live',
        displayDate: new Date(s.scheduledAt).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }),
        displayTime: new Date(s.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }));
      setSessions(mapped);
    } catch (err) {
      console.error(err);
    }
  };

  // --- 2. Action Handlers ---
  const handleCreateSession = async () => {
    if (!currentUser) return alert("Please log in");
    try {
      const scheduledAt = new Date(`${formData.date}T${formData.time}`);
      const payload = {
        title: formData.title,
        description: formData.description,
        host: currentUser.email, 
        scheduledAt: scheduledAt,
        participants: formData.invitedUsers.map(u => u.email) 
      };
      await axios.post(`${API_URL}/api/sessions`, payload);
      setOpenCreateDialog(false);
      setFormData({ title: "", description: "", date: "", time: "", invitedUsers: [] });
      refreshSessions();
    } catch (err) {
      alert("Error creating session");
    }
  };

  const handleUpdateStatus = async (sessionId, newStatus) => {
    try {
      await axios.put(`${API_URL}/api/sessions/${sessionId}/status`, { status: newStatus });
      setOpenDetailDialog(false);
      refreshSessions();
    } catch (err) {
      console.error(err);
      alert("Failed to update status");
    }
  };

  // --- 3. View Helpers ---
  const handleTabChange = (e, v) => setSelectedTab(v);
  const handleJoin = () => { setJoinedSession(activeSession); setOpenDetailDialog(false); };
  const handleLeave = () => { setJoinedSession(null); refreshSessions(); };
  const filteredSessions = sessions.filter(s => s.status === selectedTab);

  // Helper to get status colors
  const getStatusTheme = (status) => {
    switch (status) {
      case 'live': return { color: theme.palette.error.main, bg: alpha(theme.palette.error.main, 0.1), label: 'LIVE NOW' };
      case 'upcoming': return { color: theme.palette.primary.main, bg: alpha(theme.palette.primary.main, 0.1), label: 'UPCOMING' };
      default: return { color: theme.palette.text.secondary, bg: alpha(theme.palette.grey[500], 0.1), label: 'COMPLETED' };
    }
  };

  // --- VIEW: VIDEO ROOM ---
  if (joinedSession) {
    return <VideoRoom session={joinedSession} user={currentUser} onLeave={handleLeave} />;
  }

  // --- VIEW: DASHBOARD ---
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f4f6f8', pt: 4, pb: 8 }}>
      <Container maxWidth="lg">
        
        {/* Header Section */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Box>
            <Typography variant="h4" fontWeight={800} color="text.primary">
              Live Sessions
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Join interactive classes or manage your schedule
            </Typography>
          </Box>
          {currentUser && (
            <Button 
                variant="contained" 
                size="large"
                startIcon={<AddIcon />} 
                onClick={() => setOpenCreateDialog(true)}
                sx={{ borderRadius: '12px', textTransform: 'none', px: 3, boxShadow: theme.shadows[4] }}
            >
                New Session
            </Button>
          )}
        </Box>

        {/* Tabs */}
        <Paper elevation={0} sx={{ borderRadius: '16px', mb: 4, bgcolor: 'white', p: 1 }}>
          <Tabs 
            value={selectedTab} 
            onChange={handleTabChange} 
            centered 
            variant="fullWidth"
            indicatorColor="primary"
            textColor="primary"
            sx={{ '& .MuiTab-root': { borderRadius: '12px', textTransform: 'none', fontWeight: 600, fontSize: '1rem' } }}
          >
            <Tab label="🔴 Live Now" value="live" />
            <Tab label="📅 Upcoming" value="upcoming" />
            <Tab label="✅ Completed" value="completed" />
          </Tabs>
        </Paper>

        {/* Content Grid */}
        {loading ? (
            <Box display="flex" justifyContent="center" py={10}><CircularProgress /></Box>
        ) : (
          <Grid container spacing={15}>
            {filteredSessions.length > 0 ? filteredSessions.map((session) => {
              const themeStyle = getStatusTheme(session.status);
              return (
                <Grid item xs={12} sm={6} md={4} key={session._id}>
                  <Card sx={{ 
                      borderRadius: '16px', 
                      height: '100%', 
                      display: 'flex', 
                      flexDirection: 'column',
                      border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                      ...styles.cardHover,
                      position: 'relative',
                      overflow: 'visible',
                      width: '150%'
                  }}>
                    {/* Status Strip */}
                    <Box sx={{ 
                        position: 'absolute', top: 16, right: 30, 
                        bgcolor: themeStyle.bg, color: themeStyle.color, 
                        px: 1.5, py: 0.5, borderRadius: '8px', 
                        fontSize: '0.75rem', fontWeight: 700,
                        display: 'flex', alignItems: 'center', gap: 0.5,
                        ...(session.status === 'live' ? styles.pulse : {})
                    }}>
                        {session.status === 'live' && <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'error.main' }} />}
                        {themeStyle.label}
                    </Box>

                    <CardContent sx={{ flexGrow: 1, pt: 3 }}>
                      <Typography variant="h6" fontWeight={700} sx={{ mb: 1, pr: 8, lineHeight: 1.3 }}>
                        {session.title}
                      </Typography>
                      
                      <Divider sx={{ my: 2 }} />

                      <Box display="flex" flexDirection="column" gap={1.5}>
                        <Box display="flex" alignItems="center" gap={1.5} color="text.secondary">
                           <CalendarIcon fontSize="small" color="action" />
                           <Typography variant="body2" fontWeight={500}>{session.displayDate}</Typography>
                        </Box>
                        <Box display="flex" alignItems="center" gap={1.5} color="text.secondary">
                           <TimeIcon fontSize="small" color="action" />
                           <Typography variant="body2" fontWeight={500}>{session.displayTime}</Typography>
                        </Box>
                        <Box display="flex" alignItems="center" gap={1.5}>
                           <Avatar sx={{ width: 24, height: 24, fontSize: '0.8rem', bgcolor: themeStyle.color }}>
                              {session.host[0].toUpperCase()}
                           </Avatar>
                           <Typography variant="body2" fontWeight={500} color="text.primary">
                              {session.host}
                           </Typography>
                        </Box>
                      </Box>
                    </CardContent>

                    <Box p={2} pt={0}>
                      <Button 
                        fullWidth 
                        variant={session.status === 'live' ? "contained" : "outlined"} 
                        color={session.status === 'live' ? "error" : "primary"}
                        onClick={() => { setActiveSession(session); setOpenDetailDialog(true); }}
                        sx={{ borderRadius: '10px', textTransform: 'none', py: 1, fontWeight: 600 }}
                        startIcon={session.status === 'live' ? <VideoIcon /> : null}
                      >
                         {session.status === 'live' ? 'Join Class' : 'View Details'}
                      </Button>
                    </Box>
                  </Card>
                </Grid>
              );
            }) : (
              <Grid item xs={12}>
                <Box display="flex" flexDirection="column" alignItems="center" py={8} color="text.secondary">
                    <NoSessionIcon sx={{ fontSize: 60, mb: 2, opacity: 0.5 }} />
                    <Typography variant="h6">No sessions found in this category.</Typography>
                </Box>
              </Grid>
            )}
          </Grid>
        )}
      </Container>

      {/* --- CREATE SESSION DIALOG --- */}
      <Dialog open={openCreateDialog} onClose={() => setOpenCreateDialog(false)} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
            <Typography variant="h6" fontWeight={700}>Schedule New Session</Typography>
            <IconButton onClick={() => setOpenCreateDialog(false)}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ borderTop: 'none' }}>
            <Box display="flex" flexDirection="column" gap={2.5}>
                <TextField label="Session Title" fullWidth variant="outlined" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} />
                <TextField label="Description" fullWidth multiline rows={3} value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
                <Grid container spacing={2}>
                    <Grid item xs={6}>
                        <TextField type="date" fullWidth InputLabelProps={{ shrink: true }} label="Date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} />
                    </Grid>
                    <Grid item xs={6}>
                        <TextField type="time" fullWidth InputLabelProps={{ shrink: true }} label="Time" value={formData.time} onChange={(e) => setFormData({...formData, time: e.target.value})} />
                    </Grid>
                </Grid>
                <Autocomplete
                    multiple
                    options={allUsers || []}
                    getOptionLabel={(option) => option.username || option.email || ""}
                    value={formData.invitedUsers}
                    onChange={(event, newValue) => setFormData({ ...formData, invitedUsers: newValue })}
                    renderInput={(params) => <TextField {...params} label="Invite Students" placeholder="Select users" />}
                />
            </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => setOpenCreateDialog(false)} sx={{ borderRadius: '8px', color: 'text.secondary' }}>Cancel</Button>
            <Button variant="contained" onClick={handleCreateSession} sx={{ borderRadius: '8px', px: 3 }}>Schedule Session</Button>
        </DialogActions>
      </Dialog>

      {/* --- DETAILS & CONTROLS DIALOG --- */}
      <Dialog open={openDetailDialog} onClose={() => setOpenDetailDialog(false)} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: '16px' } }}>
         {activeSession && (
             <>
                <Box sx={{ p: 3, pb: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <Box>
                        <Chip 
                            label={activeSession.status.toUpperCase()} 
                            size="small" 
                            sx={{ 
                                bgcolor: getStatusTheme(activeSession.status).bg, 
                                color: getStatusTheme(activeSession.status).color, 
                                fontWeight: 700, mb: 1 
                            }} 
                        />
                        <Typography variant="h5" fontWeight={700}>{activeSession.title}</Typography>
                    </Box>
                    <IconButton onClick={() => setOpenDetailDialog(false)}><CloseIcon /></IconButton>
                </Box>
                
                <DialogContent>
                    <Typography variant="body1" color="text.secondary" paragraph>
                        {activeSession.description || "No description provided."}
                    </Typography>
                    
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                        <Grid item xs={6}>
                            <Box sx={{ p: 1.5, bgcolor: '#f5f7fa', borderRadius: '12px' }}>
                                <Typography variant="caption" color="text.secondary">DATE & TIME</Typography>
                                <Typography variant="body2" fontWeight={600}>{activeSession.displayDate} • {activeSession.displayTime}</Typography>
                            </Box>
                        </Grid>
                        <Grid item xs={6}>
                            <Box sx={{ p: 1.5, bgcolor: '#f5f7fa', borderRadius: '12px' }}>
                                <Typography variant="caption" color="text.secondary">HOST</Typography>
                                <Typography variant="body2" fontWeight={600}>{activeSession.host}</Typography>
                            </Box>
                        </Grid>
                    </Grid>

                    {/* ✅ HOST CONTROLS DASHBOARD */}
                    {currentUser && activeSession && (currentUser.email === activeSession.host) && (
                        <Paper elevation={0} sx={{ p: 2, bgcolor: alpha(theme.palette.primary.main, 0.08), borderRadius: '12px', border: `1px dashed ${theme.palette.primary.main}` }}>
                            <Box display="flex" alignItems="center" gap={1} mb={2}>
                                <PersonIcon color="primary" fontSize="small" />
                                <Typography variant="subtitle2" color="primary" fontWeight={700}>INSTRUCTOR CONTROLS</Typography>
                            </Box>
                            
                            <Box display="flex" gap={2}>
                                {activeSession.status === 'upcoming' && (
                                    <Button fullWidth variant="contained" color="success" startIcon={<PlayArrowIcon />} onClick={() => handleUpdateStatus(activeSession._id, 'live')}>
                                        Start Class
                                    </Button>
                                )}
                                {activeSession.status === 'live' && (
                                    <Button fullWidth variant="contained" color="error" startIcon={<StopIcon />} onClick={() => handleUpdateStatus(activeSession._id, 'ended')}>
                                        End Class
                                    </Button>
                                )}
                                {activeSession.status === 'completed' && (
                                     <Button fullWidth disabled variant="outlined">Class Completed</Button>
                                )}
                            </Box>
                        </Paper>
                    )}
                </DialogContent>
                
                <DialogActions sx={{ p: 3, pt: 0 }}>
                    {activeSession.status === 'live' && (
                        <Button fullWidth variant="contained" color="error" size="large" onClick={handleJoin} sx={{ borderRadius: '10px' }}>
                            Join Class Now
                        </Button>
                    )}
                </DialogActions>
             </>
         )}
      </Dialog>
    </Box>
  );
};

export default LiveSessions;