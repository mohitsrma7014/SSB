import { useState, useEffect } from "react";
import { Clock, Bell, MessageSquare, Menu, X } from "lucide-react"; // Added Menu & X icons
import NotificationBell from "./NotificationBell";

const DashboardHeader = ({ isSidebarVisible, toggleSidebar, title  }) => {
  const [dateTime, setDateTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setDateTime(new Date());
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <header
      className={`fixed top-0 ${isSidebarVisible ? "left-[254px]" : "left-0"} px-2 flex justify-between bg-white bg-gray-100 ${
        isSidebarVisible ? "w-[calc(100%-254px)]" : "w-full"
      } z-50 border border-gray-300 border-b-gray-400`}
      style={{ paddingTop: "16.5px", paddingBottom: "16.5px" }}
    >
     {/* Left Section: Sidebar Toggle + Dashboard Title */}
  <div className="flex items-center gap-2">
    {/* Sidebar Toggle Button */}
    <div className="hidden md:flex items-center gap-2 rounded-full bg-gray-100 px-2 py-2 text-sm">
      <button
        onClick={toggleSidebar}
        className="rounded-full hover:bg-gray-200 transition"
      >
        {isSidebarVisible ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
      </button>
    </div>

    {/* Dashboard Title (Aligned Left) */}
    <h2 className="text-xl font-semibold"> {title}</h2>
  </div>

      <div className="flex items-center gap-2 rounded-full text-sm">
        {/* Date & Time */}
        <div className="hidden md:flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1.5 text-sm">
          <Clock className="h-4 w-4 text-gray-500" />
          <span className="text-sm text-gray-600">
            {dateTime.toLocaleString("en-US", {
              weekday: "short",
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
              hour12: true,
            })}
          </span>
        </div>

        {/* Notifications */}
        <div className="hidden md:flex items-center gap-2 rounded-full text-sm">
          <NotificationBell />
        </div>

        {/* Messages */}
        <div className="hidden md:flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1.5 text-sm">
          <MessageSquare className="h-4 w-4" />
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
