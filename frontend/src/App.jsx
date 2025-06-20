import { useEffect,useState } from 'react'

import './App.css'
import Navbar from './common/navbar/navbar.jsx';
import SidebarMenu from './common/sidebar/Sidebar.jsx';
import { BrowserRouter, Route, Routes, useNavigate } from "react-router-dom";
import Signup from './pages/Signup/Signup.jsx';
import Login from './pages/Login/Login.jsx';
import ErrorPage from './pages/ErrorPage/ErrorPage.jsx';
import Dashboard from './pages/Dashboard/Dashboard.jsx';
import Clubs from './pages/Clubs/Clubs.jsx';
import Chatbot from './pages/Chatbot/Chatbot.jsx';
import Events from './pages/Events/Events.jsx';
import Schedules from './pages/Schedules/Schedules.jsx';
import Jobs from './pages/Jobs/Jobs.jsx';
import LiveSessions from './pages/LiveSessions/LiveSessions.jsx';
import Notification from './common/Notification/Notification.jsx';
import ClubDetails from './pages/ClubDetails/ClubDetails.jsx';
import EventDetails from './pages/EventDetials/EventDetials.jsx';
import Discussions from './pages/Discussions/Discussions.jsx';
import FacultyDashboard from './pages/Dashboard/FacultyDashboard.jsx';
import FacultyClubs from './pages/Clubs/FacultyClubs.jsx';
import FacultySchedules from './pages/Schedules/FacultySchedule.jsx';
import FacultyAnnouncements from './pages/Announcements/Announcements.jsx';

function App() {
  const [auth, setAuth] = useState(null);
  const navigate = useNavigate();
  useEffect(() => {
      navigate("/faculty");
      setAuth(true);

  }, []);


  return  <>
      {/* <BrowserRouter> */}
      <Navbar/>
      
      <Routes>
        {auth ? (
          <>
            <Route path="/" element={<ErrorPage />} />
            <Route path="/dashboard" element={<Dashboard/>} />
            <Route path="/clubs" element={<Clubs/>} />

            <Route path="/chatbot" element={<Chatbot/>} />
            <Route path="/live-sessions" element={<LiveSessions />} />
            <Route path="/schedules" element={<Schedules />} />
            <Route path="/jobs" element={<Jobs />} />
            <Route path="/events" element={<Events />} />
            <Route path="/notifications" element={<Notification />} />
            <Route path="/clubs/:clubName" element={<ClubDetails />} />
            <Route path="/events/:eventName" element={<EventDetails />} />
            <Route path="/discussions" element={<Discussions/>} />
            <Route path="/faculty" element={<FacultyDashboard/>} />
            <Route path="/faculty/dashboard" element={<FacultyDashboard/>} />
            <Route path="/faculty/clubs" element={<FacultyClubs/>} />
            <Route path="/faculty/schedules" element={<FacultySchedules/>} />
            <Route path="/faculty/announcement" element={<FacultyAnnouncements/>} />
            <Route
              path="/"
              element={<Dashboard/>}
            />
          </>
        ) : (
          <>
            {/* <Route path="/user/forgot_password" element={<ForgotPassword />} /> */}
            <Route path="/signup" element={<Signup />} />
            <Route path="/login" element={<Login />} />
          </>
        )}
        <Route path="/user/page_not_found" element={<ErrorPage />} />
      </Routes>
   </>
}

export default App
