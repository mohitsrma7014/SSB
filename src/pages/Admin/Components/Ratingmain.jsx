"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import Dashboard from "./Dashboard";
import { Sidebar } from "../../Navigation/Sidebar";
import DashboardHeader from "../../Navigation/DashboardHeader";

function Ratingmain() {
  // Get current month in YYYY-MM format
  const getCurrentMonth = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0"); // Ensure two digits
    return `${year}-${month}`;
  };
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
        const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  
    const toggleSidebar = () => {
      setIsSidebarVisible(!isSidebarVisible);
    };
    const pageTitle = "Customer Schedule Analytics"; // Set the page title here

  const [data, setData] = useState([]);
  const [darkMode, setDarkMode] = useState(false);
  const [month, setMonth] = useState(getCurrentMonth()); // Set default month

  useEffect(() => {
    const fetchData = async () => {
      try {
        const queryParam = month ? `?month=${month}` : "";
        const response = await axios.get(
          `http://192.168.1.199:8001/raw_material/api/schedule/${queryParam}`
        );
    
        if (response.data && response.data.length > 0) {
          setData(response.data);
        } else {
          setData([{ noData: true }]); // Placeholder object to indicate no data
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setData([{ noData: true }]); // Set no data state on error
      }
    };
    

    fetchData();
    const interval = setInterval(fetchData, 10000000); // Refresh every 10 seconds

    return () => clearInterval(interval);
  }, [month]);

  return (
<div className="flex">
    {/* Sidebar */}
    <div
      className={`fixed top-0 left-0 h-full transition-all duration-300 ${
        isSidebarVisible ? "w-64" : "w-0 overflow-hidden"
      }`}
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
      <main className="flex flex-col mt-20  justify-center flex-grow pl-2">
 
      <div className="text-gray-900  dark:border-gray-600 dark:text-gray-100 min-h-screen ">
        <FiltersPanel month={month} setMonth={setMonth} />
        <Dashboard data={data} />
      </div>
      </main>
    </div>
    
    </div>
    
  );
}

const FiltersPanel = ({ month, setMonth }) => {
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

  // Generate year options (last 10 years + next 5 years)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 16 }, (_, i) => currentYear - 10 + i);

  // Extract year & month from state
  const selectedYear = month.split("-")[0]; // Extract YYYY
  const selectedMonth = month.split("-")[1]; // Extract MM

  // Handle changes
  const handleMonthChange = (e) => {
    setMonth(`${selectedYear}-${e.target.value}`);
  };

  const handleYearChange = (e) => {
    setMonth(`${e.target.value}-${selectedMonth}`);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-2 shadow-lg text-black max-w-[300px] fixed top-[90px] right-[20px] z-[20]">
      <div className="flex flex-col gap-2">
        {/* Month Dropdown */}
        <select
          id="month"
          value={selectedMonth}
          onChange={handleMonthChange}
          className="w-full p-1 border rounded-md text-black"
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
          className="w-full p-1 border rounded-md text-black"
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
