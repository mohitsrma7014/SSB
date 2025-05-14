"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import Dashboard from "./Dashboard";
import { Sidebar } from "../../Navigation/Sidebar";
import DashboardHeader from "../../Navigation/DashboardHeader";

function Ratingmain() {
  const getCurrentMonth = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
  };

  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [data, setData] = useState({ 
    schedule_data: [], 
    chart_data: { by_line: [], by_customer: [] } 
  });
  const [darkMode, setDarkMode] = useState(false);
  const [month, setMonth] = useState(getCurrentMonth());
  const pageTitle = "Production Planning Dashboard";

  const toggleSidebar = () => {
    setIsSidebarVisible(!isSidebarVisible);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingSuggestions(true);
        const queryParam = month ? `?month=${month}` : "";
        const response = await axios.get(
          `http://192.168.1.199:8001/raw_material/api/schedule/${queryParam}`
        );
        
        if (response.data) {
          setData({
            schedule_data: response.data.schedule_data || [],
            chart_data: {
              by_line: response.data.chart_data?.by_line || [],
              by_customer: response.data.chart_data?.by_customer || []
            }
          });
        } else {
          setData({
            schedule_data: [{ noData: true }],
            chart_data: { by_line: [], by_customer: [] }
          });
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setData({
          schedule_data: [{ noData: true }],
          chart_data: { by_line: [], by_customer: [] }
        });
      } finally {
        setLoadingSuggestions(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 300000); // Refresh every 5 minutes

    return () => clearInterval(interval);
  }, [month]);

  return (
    <div className={`flex min-h-screen ${darkMode ? 'dark' : ''}`}>
      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full transition-all duration-300 ${
          isSidebarVisible ? "w-64" : "w-0 overflow-hidden"
        } bg-gray-900 text-white`}
        style={{ zIndex: 50 }}
      >
        {isSidebarVisible && <Sidebar isVisible={isSidebarVisible} toggleSidebar={toggleSidebar} />}
      </div>

      {/* Main Content */}
      <div
        className={`flex flex-col flex-grow transition-all duration-300 ${
          isSidebarVisible ? "ml-64" : "ml-0"
        } bg-gray-100 dark:bg-gray-800`}
      >
        <DashboardHeader 
          isSidebarVisible={isSidebarVisible} 
          toggleSidebar={toggleSidebar} 
          title={pageTitle}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
        />

        {/* Main Content */}
        <main className="flex flex-col mt-16 justify-center flex-grow pl-2">
          <div className="text-gray-900 dark:text-gray-100 min-h-screen p-4">
            <FiltersPanel month={month} setMonth={setMonth} darkMode={darkMode} />
            
            {loadingSuggestions ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <Dashboard 
                scheduleData={data.schedule_data} 
                lineChartData={data.chart_data.by_line} 
                customerChartData={data.chart_data.by_customer} 
                darkMode={darkMode}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

const FiltersPanel = ({ month, setMonth, darkMode }) => {
  const months = [
    { value: "01", label: "January" },
    { value: "02", label: "February" },
    { value: "03", label: "March" },
    { value: "04", label: "April" },
    { value: "05", label: "May" },
    { value: "06", label: "June" },
    { value: "07", label: "July" },
    { value: "08", label: "August" },
    { value: "09", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 4 }, (_, i) => currentYear - 3 + i);

  const selectedYear = month.split("-")[0];
  const selectedMonth = month.split("-")[1];

  const handleMonthChange = (e) => {
    setMonth(`${selectedYear}-${e.target.value}`);
  };

  const handleYearChange = (e) => {
    setMonth(`${e.target.value}-${selectedMonth}`);
  };

  return (
    <div className={`rounded-lg p-2 shadow-lg ${darkMode ? 'bg-gray-700' : 'bg-white'} fixed top-[60px] right-[10px] z-[20]`}>
      <div className="flex flex-row gap-2">
        {/* Month Dropdown */}
        <select
          id="month"
          value={selectedMonth}
          onChange={handleMonthChange}
          className={`w-1/2 p-1 border rounded-md ${darkMode ? 'bg-gray-600 text-white border-gray-500' : 'text-black'}`}
          aria-label="Select month"
        >
          {months.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>

        {/* Year Dropdown */}
        <select
          id="year"
          value={selectedYear}
          onChange={handleYearChange}
          className={`w-1/2 p-1 border rounded-md ${darkMode ? 'bg-gray-600 text-white border-gray-500' : 'text-black'}`}
          aria-label="Select year"
        >
          {years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default Ratingmain;