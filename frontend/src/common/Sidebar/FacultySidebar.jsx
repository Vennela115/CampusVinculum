import React, { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { MdSpaceDashboard } from "react-icons/md";
import { FaUsers } from "react-icons/fa";
import { FaComments } from "react-icons/fa";
import { BsRobot } from "react-icons/bs";
import { MdLiveTv } from "react-icons/md";
import { AiOutlineCalendar } from "react-icons/ai";
import { HiOutlineBriefcase } from "react-icons/hi";
import { MdEvent } from "react-icons/md";
import { FaLinkedin } from "react-icons/fa";
import { FaGithub } from "react-icons/fa6";
import { BsTwitterX } from "react-icons/bs";
import { FaGlobe } from "react-icons/fa";
import profPic from "@/assets/profpic.jpg";
// import { GetUserData } from "@/utils/userApi";
// import Loading from "@/components/Loading/Loading";
// import { useSelector } from "react-redux";

const FacultySidebarMenu = () => {
  const [userData, setUserData] = useState([]);
  const [loading, setLoading] = useState(false);

  const userDataCalling = async () => {
    setLoading(true);
    let data = {
        name:"vennela",
        profilePic:profPic,
    };
    setLoading(false);
    setUserData(data);
  };

  useEffect(() => {
    userDataCalling();
  }, []);

  

  return (
  <>
    {/* Desktop Sidebar */}
    <div className="hidden lg:inline-block w-2/12 h-screen shadow-2xl background_gradient_color fixed left-0 top-22 bottom-10 overflow-y-auto">
      <div className="w-full h-full flex flex-col justify-start gap-y-5 items-center p-4">
        

        <div className="w-12/12 flex">
        <NavLink to="/faculty/dashboard" className="w-full text-base font-bold py-1 px-3 text-blue-800 hover:bg-blue-600 hover:text-white rounded flex items-center gap-x-2">
          <MdSpaceDashboard /> Dashboard
        </NavLink>
      </div>
      <div className="w-12/12 flex">
        <NavLink to="/faculty/clubs" className="w-full text-base font-bold py-1 px-3 rounded text-blue-800 hover:bg-blue-600 hover:text-white flex items-center gap-x-2">
          <FaUsers /> Clubs
        </NavLink>
      </div>
      <div className="w-12/12 flex">
        <NavLink to="/discussions" className="w-full text-base font-bold py-1 px-3 rounded text-blue-800 hover:bg-blue-600 hover:text-white flex items-center gap-x-2">
          <FaComments /> Discussions
        </NavLink>
      </div>
      <div className="w-12/12 flex">
        <NavLink to="/chatbot" className="w-full text-base font-bold py-1 px-3 rounded text-blue-800 hover:bg-blue-600 hover:text-white flex items-center gap-x-2">
          <BsRobot /> Chatbot
        </NavLink>
      </div>
      <div className="w-12/12 flex">
        <NavLink to="faculty/live-sessions" className="w-full text-base font-bold py-1 px-3 rounded text-blue-800 hover:bg-blue-600 hover:text-white flex items-center gap-x-2">
          <MdLiveTv /> Live Sessions
        </NavLink>
      </div>
      <div className="w-12/12 flex">
        <NavLink to="/faculty/schedules" className="w-full text-base font-bold py-1 px-3 rounded text-blue-800 hover:bg-blue-600 hover:text-white flex items-center gap-x-2">
          <AiOutlineCalendar  /> Schedules
        </NavLink>
      </div>
      <div className="w-12/12 flex">
        <NavLink to="/faculty/announcement" className="w-full text-base font-bold py-1 px-3 rounded text-blue-800 hover:bg-blue-600 hover:text-white flex items-center gap-x-2">
          <HiOutlineBriefcase/> Announcements
        </NavLink>
      </div>

        {/* Social Media Section */}
        <div className="w-full flex flex-col gap-y-2 items-center mt-6">
          <hr className="border border-blue-700 mb-3 w-full" />
          <div className="text-xl text-blue-700 font-bold">Follow Me</div>
          <div className="w-8/12 flex justify-center gap-x-2 text-2xl text-blue-900">
            <a href="https://in.linkedin.com/in/" target="_blank"><FaLinkedin /></a>
            <a href="https://github.com/Vennela115" target="_blank"><FaGithub /></a>
            <a href="https://x.com/" target="_blank"><BsTwitterX /></a>
          </div>
        </div>
      </div>
    </div>
  </>
);

};

export default FacultySidebarMenu;
