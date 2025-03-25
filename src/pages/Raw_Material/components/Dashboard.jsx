import React, { useState } from 'react';
import { Sidebar } from "../../Navigation/Sidebar";
import DashboardHeader from "../../Navigation/DashboardHeader";

const Dashboard = () => {
  const [isSidebarVisible, setIsSidebarVisible] = useState(true); // ✅ Moved inside the component

  const toggleSidebar = () => {
    setIsSidebarVisible(!isSidebarVisible);
  };

  const pageTitle = "Steel Raw Material Dashboard"; // Set the page title here

  return (
    <div className="flex">
      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full transition-all duration-300 ${
          isSidebarVisible ? "w-64" : "w-0 overflow-hidden"
        }`}
        style={{ zIndex: 50 }} 
      >
        {isSidebarVisible && <Sidebar isVisible={isSidebarVisible} toggleSidebar={toggleSidebar} />}
      </div>

      {/* Main Content */}
      <div
        className={`flex flex-col flex-grow transition-all duration-300 ${
          isSidebarVisible ? "ml-64" : "ml-0"
        }`}
      >
        <DashboardHeader isSidebarVisible={isSidebarVisible} toggleSidebar={toggleSidebar} title={pageTitle} />


      

        {/* Main Content */}
        <main className="flex flex-col mt-16  justify-center flex-grow pl-2">
   
      </main>
    </div>
    </div>
  );
};

export default Dashboard;