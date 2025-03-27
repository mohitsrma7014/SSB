import React, { useState, useEffect } from 'react';
import { Sidebar } from "../../Navigation/Sidebar";
import DashboardHeader from "../../Navigation/DashboardHeader";
import ComplaintOverview from "./ComplaintOverview";
import UpcomingDeliveries from "./UpcomingDeliveries";
import { FiAlertCircle, FiTruck, FiCheckCircle, FiClock } from 'react-icons/fi';
import axios from 'axios';

const Dashboard = () => {
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const toggleSidebar = () => setIsSidebarVisible(!isSidebarVisible);
  const pageTitle = "Steel Raw Material Dashboard";

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get('http://192.168.1.199:8001/raw_material/api/dashboard-stats');
        const statsData = response.data.stats;
  
        // Ensure statsData is an array before mapping
        if (!Array.isArray(statsData) || statsData.length < 4) {
          throw new Error("Invalid data structure from API");
        }
  
        // Map the icons to each stat item
        const statsWithIcons = [
          { ...statsData[0], icon: <FiAlertCircle className="text-blue-500" /> },
          { ...statsData[1], icon: <FiTruck className="text-green-500" /> },
          { ...statsData[2], icon: <FiCheckCircle className="text-purple-500" /> },
          { ...statsData[3], icon: <FiClock className="text-orange-500" /> }
        ];
  
        setStats(statsWithIcons);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
        console.error("Error fetching dashboard stats:", err);
      }
    };
  
    fetchStats();
  }, []);
  

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <div className="flex-1 p-4 mt-16 md:p-6">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <div className="flex-1 p-4 mt-16 md:p-6">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            Error loading dashboard: {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`fixed top-0 left-0 h-full transition-all duration-300 ${
        isSidebarVisible ? "w-64" : "w-0 overflow-hidden"
      }`} style={{ zIndex: 50 }}>
        {isSidebarVisible && <Sidebar isVisible={isSidebarVisible} toggleSidebar={toggleSidebar} />}
      </div>

      {/* Main Content */}
      <div className={`flex flex-col flex-grow transition-all duration-300 ${
        isSidebarVisible ? "ml-64" : "ml-0"
      }`}>
        <DashboardHeader 
          isSidebarVisible={isSidebarVisible} 
          toggleSidebar={toggleSidebar} 
          title={pageTitle} 
        />

        <main className="flex-1 p-4 mt-16 md:p-6">
          {/* Stats Cards - Modern Design */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {stats.map((stat, index) => (
              <div key={index} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="text-gray-500 text-sm font-medium">{stat.title}</div>
                  <div className="text-2xl">{stat.icon}</div>
                </div>
                <div className="mt-2">
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="text-xs text-gray-400 mt-1">{stat.trend}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <ComplaintOverview />
            </div>

            {/* Right Column */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <UpcomingDeliveries />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;