import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaCogs, FaUser, FaCalendarAlt, FaExclamationTriangle } from 'react-icons/fa';
import { Sidebar } from "../../Navigation/Sidebar";
import DashboardHeader from "../../Navigation/DashboardHeader";
import CncPlanningList from './CncPlanningList1';

const CncPlanningForm = () => {
  const [formData, setFormData] = useState({
    create_date: "",
    Target_start_date: "",
    Target_End_date: "",
    component: "",
    customer: "",
    target: "",
    component_cycle_time: "",
    required_cycle_time: "",
    cnc_line:"",
    cell: "na",
    cell_cycle_time: "",
    machine_no: "na",
    machine_cycle_time: 0,
    done: "No",
    how_much_compleate: 0,
    verified_by: "",
  });

  const [responseMessage, setResponseMessage] = useState(null);
  const [weekOptions, setWeekOptions] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false); 
  const [error, setError] = useState("");
  const [availableCncLines, setAvailableCncLines] = useState([]);
  const [maxParts, setMaxParts] = useState(null); // For storing max parts calculation
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarVisible(!isSidebarVisible);
  };
  const pageTitle = "Cnc Weekly Planning";

  // Helper function to format seconds into days/hours
  const formatTime = (seconds) => {
    if (!seconds) return "0 sec";

    const hours = Math.floor(seconds / 3600);
    const remainingSeconds = seconds % 3600;

    let result = [];
    if (hours > 0) result.push(`${hours} hour${hours > 1 ? 's' : ''}`);
    if (remainingSeconds > 0) result.push(`${remainingSeconds} sec`);

    return result.join(" ") || "0 sec";
};


  // Set today's date for create_date and fetch user details
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setFormData((prevState) => ({
      ...prevState,
      create_date: today,
    }));

    const fetchUserData = async () => {
      try {
        const response = await axios.get(
          "http://192.168.1.199:8001/api/user-details/",
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
          }
        );
        const { name, lastname } = response.data;
        setFormData((prevState) => ({
          ...prevState,
          verified_by: `${name} ${lastname}`,
        }));
      } catch (error) {
        console.error("Error fetching user details:", error);
      }
    };

    fetchUserData();
  }, []);

  // Handle CNC line selection and calculate max parts
  const handleCncLineChange = (e) => {
    const selectedLine = e.target.value;
    const selectedLineData = availableCncLines.find(line => line.cnc_line === selectedLine);
    const selectedCycleTime = selectedLineData ? selectedLineData.remaining_cycle_time : 0;

    setFormData((prevState) => ({
      ...prevState,
      cnc_line: selectedLine,
      cell_cycle_time: selectedCycleTime,
    }));

    // Calculate max parts when both component and line are selected
    if (formData.component && formData.component_cycle_time && selectedCycleTime > 0) {
      const componentCycleTime = parseFloat(formData.component_cycle_time);
      const maxPartsValue = Math.floor(selectedCycleTime / componentCycleTime);
      setMaxParts(maxPartsValue);
    } else {
      setMaxParts(null);
    }
  };

  // Calculate weeks for the selected month and restrict to current/future
  useEffect(() => {
    const calculateWeeks = (year, month) => {
      const weeks = [];
      const date = new Date(year, month, 1);
      const end = new Date(year, month + 1, 0);
      const today = new Date();
      
      // Get the first day of current week (Monday)
      const currentWeekStart = new Date(today);
      currentWeekStart.setDate(today.getDate() - (today.getDay() + 6) % 7);

      while (date <= end) {
        const dayOfWeek = date.getDay();
        const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 2;
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - daysToSubtract);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);

        // Only include weeks that are current or future
        if (weekEnd >= currentWeekStart) {
          weeks.push({
            weekNumber: weeks.length + 1,
            startDate: weekStart.toISOString().slice(0, 10),
            endDate: weekEnd.toISOString().slice(0, 10),
          });
        }

        date.setDate(date.getDate() + 7);
      }

      return weeks;
    };

    const [year, month] = selectedMonth.split("-").map(Number);
    const weeks = calculateWeeks(year, month - 1);
    setWeekOptions(weeks);
  }, [selectedMonth]);

  // Restrict month selection to current and future months
  const handleMonthChange = (e) => {
    const selected = e.target.value;
    const currentMonth = new Date().toISOString().slice(0, 7);
    
    if (selected >= currentMonth) {
      setSelectedMonth(selected);
    }
  };

  const handleWeekChange = async (e) => {
    const selectedWeek = weekOptions.find(
      (week) => week.weekNumber === parseInt(e.target.value, 10)
    );
    if (selectedWeek) {
      setFormData((prevState) => ({
        ...prevState,
        Target_start_date: selectedWeek.startDate,
        Target_End_date: selectedWeek.endDate,
      }));

      try {
        const response = await axios.get(
          "http://192.168.1.199:8001/cnc/api/get-available-cnc-lines/",
          {
            params: {
              start_date: selectedWeek.startDate,
              end_date: selectedWeek.endDate,
            },
          }
        );
        setAvailableCncLines(response.data.available_lines);
      } catch (error) {
        console.error("Error fetching available CNC lines:", error);
        setError("Error fetching available CNC lines.");
      }
    }
  };

  // Handle component input change for suggestions
  const handleComponentChange = async (e) => {
    const query = e.target.value;
    setFormData({ ...formData, component: query });
    setMaxParts(null); // Reset max parts when component changes

    if (query.length >= 3) {
      setLoading(true);
      try {
        const response = await axios.get('http://192.168.1.199:8001/raw_material/components/', {
          params: { component: query },
        });
        setSuggestions(response.data);
      } catch (error) {
        console.error("Error fetching component suggestions:", error);
      } finally {
        setLoading(false);
      }
    } else {
      setSuggestions([]);
    }
  };

  // Handle selecting a component from the suggestions
  const handleComponentSelect = async (selectedComponent) => {
    setFormData({ ...formData, component: selectedComponent });
    setSuggestions([]);

    try {
      const response = await axios.get('http://192.168.1.199:8001/raw_material/get-part-details/', {
        params: { component: selectedComponent },
      });
      const { customer, component_cycle_time } = response.data;
      setFormData((prevState) => ({
        ...prevState,
        customer: customer,
        component_cycle_time: component_cycle_time,
      }));

      // Calculate max parts if CNC line is already selected
      if (formData.cnc_line && formData.cell_cycle_time) {
        const maxPartsValue = Math.floor(formData.cell_cycle_time / component_cycle_time);
        setMaxParts(maxPartsValue);
      }
    } catch (error) {
      console.error("Error fetching component details:", error);
    }
  };

  const handleCycleTimeAndTargetChange = (e) => {
    const { name, value } = e.target;
    let updatedFormData = { ...formData, [name]: value };
  
    if (name === "target") {
      if (!formData.component) {
        setError("Error: Please fill the Component field before setting the Target.");
        updatedFormData.target = "";
      } else {
        const target = parseFloat(value) || 0;
        const componentCycleTime = parseFloat(formData.component_cycle_time) || 0;
        const calculatedComponentCycleTime = target * componentCycleTime;
  
        if (calculatedComponentCycleTime > formData.cell_cycle_time) {
          setError(`Error: Target exceeds available capacity. Max parts: ${maxParts}`);
          updatedFormData.target = "";
          updatedFormData.required_cycle_time = "";
        } else {
          setError("");
          updatedFormData.required_cycle_time = calculatedComponentCycleTime;
        }
      }
    }
  
    setFormData(updatedFormData);
  };
  // Add this function to your component, typically near your other handler functions
const handleChange = (e) => {
  const { name, value } = e.target;
  setFormData(prev => ({
    ...prev,
    [name]: value
  }));
};
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        "http://192.168.1.199:8001/cnc/cncplanning/",
        formData
      );
      setResponseMessage(`Success! Cnc_uid: ${response.data.Cnc_uid}`);
      alert("Form submitted successfully!");
      window.location.reload();
      setFormData({
        create_date: "",
        Target_start_date: "",
        Target_End_date: "",
        component: "",
        customer: "",
        target: "",
        component_cycle_time: "",
        required_cycle_time: "",
        cnc_line:"",
        cell: "na",
        cell_cycle_time: "",
        machine_no: "na",
        machine_cycle_time: 0,
        done: "No",
        how_much_compleate: 0,
        verified_by: "",
      });
      setMaxParts(null);
    } catch (error) {
      console.error("Error response:", error.response);
      setResponseMessage(
        "Error: " + (error.response?.data || "An error occurred")
      );
    }
  };

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

        <main className="flex flex-col mt-20 justify-center flex-grow pl-2">
          {responseMessage && <p className="text-center text-green-500 mb-4">{responseMessage}</p>}

          <div className="flex justify-between space-x-2 p-6">
            {/* Form Section */}
            <div className="w-full bg-white p-6 rounded-lg shadow-md">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="hidden">
                  <input
                    type="date"
                    name="create_date"
                    value={formData.create_date}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  {/* Month Field */}
                  <div className="flex flex-col space-y-2">
                    <label className="text-lg text-black">Month:</label>
                    <input
                      type="month"
                      value={selectedMonth}
                      onChange={handleMonthChange}
                      min={new Date().toISOString().slice(0, 7)}
                      className="p-3 rounded-lg text-black shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Week Selection */}
                  <div className="flex flex-col space-y-2">
                    <label className="text-lg text-black">Week Number:</label>
                    <select
                      onChange={handleWeekChange}
                      className="p-3 rounded-lg text-black shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Week</option>
                      {weekOptions.map((week) => (
                        <option key={week.weekNumber} value={week.weekNumber}>
                          Week {week.weekNumber} ({week.startDate} - {week.endDate})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="hidden">
  <div className="grid grid-cols-2 gap-6">
    <div className="flex flex-col space-y-2">
      <label className="text-lg text-black">Target Start Date:</label>
      <input
        type="date"
        name="Target_start_date"
        value={formData.Target_start_date}
        readOnly
        className="p-3 rounded-lg text-gray-500 bg-gray-100 shadow-md"
      />
    </div>
    <div className="flex flex-col space-y-2">
      <label className="text-lg text-black">Target End Date:</label>
      <input
        type="date"
        name="Target_End_date"
        value={formData.Target_End_date}
        readOnly
        className="p-3 rounded-lg text-gray-500 bg-gray-100 shadow-md"
      />
    </div>
  </div>
</div>


                <div className="grid grid-cols-3 gap-6">
                  {/* Component Field */}
                  <div className="flex flex-col space-y-2 relative">
                    <label className="text-lg text-black">Component:</label>
                    <input
                      type="text"
                      name="component"
                      value={formData.component}
                      onChange={handleComponentChange}
                      required
                      className="p-3 rounded-lg text-black shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {loading && <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white"><span>Loading...</span></div>}
                    {suggestions.length > 0 && (
                      <ul className="absolute mt-1 bg-white shadow-lg rounded-lg w-full">
                        {suggestions.map((suggestion, index) => (
                          <li
                            key={index}
                            onClick={() => handleComponentSelect(suggestion)}
                            className="p-2 hover:bg-blue-200 cursor-pointer"
                          >
                            {suggestion}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Customer Field */}
                  <div className="flex flex-col space-y-2">
                    <label className="text-lg text-black">Customer:</label>
                    <input
                      type="text"
                      name="customer"
                      value={formData.customer}
                      readOnly
                      className="p-3 rounded-lg text-gray-500 bg-gray-100 shadow-md"
                    />
                  </div>
                  <div className="flex flex-col space-y-2">
                    <label className="text-lg text-black">Component Cycle Time (sec):</label>
                    <input
                      type="number"
                      name="component_cycle_time"
                      value={formData.component_cycle_time}
                      onChange={handleCycleTimeAndTargetChange}
                      readOnly
                      className="p-3 rounded-lg text-gray-500 bg-gray-100 shadow-md"
                    />
                  </div>
                </div>

                {/* Cycle Time Fields */}
                <div className="grid grid-cols-3 gap-6">
                  {/* CNC Line */}
                  <div className="flex flex-col space-y-2">
                    <label className="text-lg text-black">CNC Line:</label>
                    <select
                      name="cnc_line"
                      value={formData.cnc_line}
                      onChange={handleCncLineChange}
                      className="p-3 rounded-lg text-black shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select CNC Line</option>
                      {availableCncLines.map((line) => (
                        <option key={line.cnc_line} value={line.cnc_line}>
                          {line.cnc_line} (Available: {formatTime(line.remaining_cycle_time)})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Cell Cycle Time */}
                  <div className="flex flex-col space-y-2">
                    <label className="text-lg text-black">Line Available Time:</label>
                    <input
                      type="text"
                      name="cell_cycle_time"
                      value={formatTime(formData.cell_cycle_time)}
                      readOnly
                      className="p-3 rounded-lg text-gray-500 bg-gray-100 shadow-md"
                    />
                  </div>
                  
                  {/* Target Field */}
                  <div className="flex flex-col space-y-2">
                    <label className="text-lg text-black">Target:</label>
                    <input
                      type="number"
                      name="target"
                      value={formData.target}
                      onChange={handleCycleTimeAndTargetChange}
                      required
                      disabled={!formData.component}
                      className={`p-3 rounded-lg shadow-md focus:outline-none focus:ring-2 ${
                          formData.component ? "text-black" : "text-gray-400 bg-gray-200"
                      }`}
                    />
                    {maxParts !== null && formData.cnc_line && formData.component && (
                      <p className="text-sm text-blue-600">Max capacity: {maxParts} parts</p>
                    )}
                  </div>
                </div>

                <div className="hidden">
                  <label className="text-lg text-black">Required Cycle Time:</label>
                  <input
                    type="number"
                    name="required_cycle_time"
                    value={formData.required_cycle_time}
                    onChange={handleCycleTimeAndTargetChange}
                    required
                    readOnly
                    className="p-3 rounded-lg text-gray-500 bg-gray-100 shadow-md"
                  />
                </div>

                {error && <p className="text-red-500">{error}</p>}

                {/* Hidden Inputs */}
                <input
                  type="text"
                  name="done"
                  value={formData.done}
                  onChange={handleChange}
                  style={{ display: "none" }}
                />
                <input
                  type="number"
                  name="how_much_compleate"
                  value={formData.how_much_compleate}
                  onChange={handleChange}
                  style={{ display: "none" }}
                />

                {/* Submit Button */}
                <div className="flex justify-center">
                  <button
                    type="submit"
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-300 ease-in-out transform hover:scale-105"
                  >
                    Submit <FaCogs className="inline-block ml-2" />
                  </button>
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default CncPlanningForm;