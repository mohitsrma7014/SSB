import { useState, useEffect, useMemo } from "react";
import { FaCheckCircle, FaTimesCircle, FaInfoCircle, FaCalendarAlt, FaSearch, FaFilter } from "react-icons/fa";
import { Sidebar } from "../../Navigation/Sidebar";
import DashboardHeader from "../../Navigation/DashboardHeader";

function CncPlanningList() {
  // State management
  const [cncData, setCncData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [selectedProduction, setSelectedProduction] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  
  // Date selection state
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [quickWeekOptions, setQuickWeekOptions] = useState([]);

  // Calculate current date and initialize states
  const currentDate = useMemo(() => new Date(), []);
  const currentMonth = useMemo(() => currentDate.toISOString().slice(0, 7), [currentDate]);

  // Toggle sidebar visibility
  const toggleSidebar = () => {
    setIsSidebarVisible(!isSidebarVisible);
  };

  const pageTitle = "CNC Planning Dashboard";

  // Initialize quick week options (previous, current, next)
  useEffect(() => {
    const calculateWeekRange = (date) => {
      // Clone date to avoid mutation
      const d = new Date(date);
      // Get previous Monday
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is Sunday
      const monday = new Date(d.setDate(diff));
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      
      return {
        startDate: monday.toISOString().slice(0, 10),
        endDate: sunday.toISOString().slice(0, 10),
        label: `${monday.toLocaleDateString()} - ${sunday.toLocaleDateString()}`
      };
    };

    // Current week
    const currentWeek = calculateWeekRange(currentDate);
    
    // Previous week
    const prevDate = new Date(currentDate);
    prevDate.setDate(currentDate.getDate() - 7);
    const prevWeek = calculateWeekRange(prevDate);
    
    // Next week
    const nextDate = new Date(currentDate);
    nextDate.setDate(currentDate.getDate() + 7);
    const nextWeek = calculateWeekRange(nextDate);

    setQuickWeekOptions([
      { label: "Previous Week", value: "previous", ...prevWeek },
      { label: "Current Week", value: "current", ...currentWeek },
      { label: "Next Week", value: "next", ...nextWeek }
    ]);

    // Set current week as default selection
    setSelectedWeek({ label: "Current Week", value: "current", ...currentWeek });
    setSelectedMonth(currentMonth);
  }, [currentDate, currentMonth]);

  // Calculate weeks for the selected month/year
  const weekOptions = useMemo(() => {
    if (!selectedMonth) return [];

    const [year, month] = selectedMonth.split("-").map(Number);
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0); // Last day of month
    
    const weeks = [];
    let currentDate = new Date(firstDay);

    // Find first Monday of the month (or previous month)
    while (currentDate.getDay() !== 1 && currentDate <= lastDay) {
      currentDate.setDate(currentDate.getDate() - 1);
    }

    // If we went to previous month, reset to first day
    if (currentDate.getMonth() < month - 1) {
      currentDate = new Date(firstDay);
      // Find next Monday
      while (currentDate.getDay() !== 1 && currentDate <= lastDay) {
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    // Generate all weeks that include days from this month
    while (currentDate <= lastDay) {
      const weekStart = new Date(currentDate);
      const weekEnd = new Date(currentDate);
      weekEnd.setDate(weekStart.getDate() + 6);

      // Only include weeks that have at least one day in the current month
      if (weekStart.getMonth() === month - 1 || weekEnd.getMonth() === month - 1) {
        weeks.push({
          label: `Week ${weeks.length + 1} (${weekStart.toLocaleDateString()} - ${weekEnd.toLocaleDateString()})`,
          startDate: weekStart.toISOString().slice(0, 10),
          endDate: weekEnd.toISOString().slice(0, 10)
        });
      }

      currentDate.setDate(currentDate.getDate() + 7);
    }

    return weeks;
  }, [selectedMonth]);

  // Fetch data with optional date range
  const fetchData = async (startDate = null, endDate = null) => {
    if (!startDate || !endDate) return;
    
    setLoading(true);
    try {
      const url = `http://192.168.1.199:8001/cnc/cncplanning/?start_date=${startDate}&end_date=${endDate}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Network response was not ok");
      
      const data = await response.json();
      setCncData(data);
    } catch (error) {
      console.error("Error fetching CNC data:", error);
      alert("Failed to load data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch data when week selection changes
  useEffect(() => {
    if (selectedWeek) {
      fetchData(selectedWeek.startDate, selectedWeek.endDate);
    }
  }, [selectedWeek]);

  // Handlers for UI interactions
  const handleQuickWeekSelect = (week) => {
    setSelectedWeek(week);
  };

  const handleCustomWeekSelect = (e) => {
    const week = weekOptions.find(w => w.startDate === e.target.value);
    if (week) setSelectedWeek(week);
  };

  const handleMonthChange = (e) => {
    setSelectedMonth(e.target.value);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleCheckboxChange = async (id, done) => {
    const confirmed = window.confirm(
      `Are you sure you want to mark this target as ${done ? "incomplete" : "complete"}?`
    );
    if (!confirmed) return;
  
    try {
      const response = await fetch(`http://192.168.1.199:8001/cnc/cncplanning/${id}/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ done: done ? "No" : "Yes" }),
      });
  
      if (response.ok) {
        fetchData(selectedWeek?.startDate, selectedWeek?.endDate);
      } else {
        throw new Error("Update failed");
      }
    } catch (error) {
      console.error("Error updating done status:", error);
      alert("Failed to update status. Please try again.");
    }
  };

  const showProductionDetails = (productionData) => {
    setSelectedProduction(productionData);
    setShowDetailsModal(true);
  };

  // Filter and sort data for display
  const filteredData = useMemo(() => {
    return cncData
      .filter((item) => {
        const searchLower = searchQuery.toLowerCase();
        return (
          item.component.toLowerCase().includes(searchLower) ||
          item.customer.toLowerCase().includes(searchLower)
        );
      })
      .sort((a, b) => {
        if (a.done === "No" && b.done === "Yes") return -1;
        if (a.done === "Yes" && b.done === "No") return 1;
        return new Date(b.Target_start_date) - new Date(a.Target_start_date);
      });
  }, [cncData, searchQuery]);

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full transition-all duration-300 ${
          isSidebarVisible ? "w-64" : "w-0 overflow-hidden"
        } bg-blue-800 text-white`}
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
        <DashboardHeader 
          isSidebarVisible={isSidebarVisible} 
          toggleSidebar={toggleSidebar} 
          title={pageTitle} 
        />

        <main className="flex-1 p-2 mt-16">
          {/* Compact Filter Controls */}
          <div className="bg-white p-2 rounded-lg shadow-md mb-4">
            <div className="flex flex-wrap items-end gap-4">
              {/* Quick Week Selection */}
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <FaFilter className="inline mr-1" /> Quick Select
                </label>
                <select
                  value={selectedWeek?.value || ""}
                  onChange={(e) => {
                    const week = quickWeekOptions.find(w => w.value === e.target.value);
                    if (week) handleQuickWeekSelect(week);
                  }}
                  className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {quickWeekOptions.map((week) => (
                    <option key={week.value} value={week.value}>
                      {week.label} ({week.startDate} to {week.endDate})
                    </option>
                  ))}
                </select>
              </div>

              {/* Month Selection */}
              <div className="flex-1 min-w-[150px]">
                <label htmlFor="month-select" className="block text-sm font-medium text-gray-700 mb-1">
                  Select Month
                </label>
                <input
                  type="month"
                  id="month-select"
                  value={selectedMonth}
                  onChange={handleMonthChange}
                  min="2020-01" // Set appropriate min value
                  max="2030-12" // Set appropriate max value
                  className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Week Selection */}
              <div className="flex-1 min-w-[200px]">
                <label htmlFor="week-select" className="block text-sm font-medium text-gray-700 mb-1">
                  Select Week
                </label>
                <select
                  id="week-select"
                  value={selectedWeek?.startDate || ""}
                  onChange={handleCustomWeekSelect}
                  className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a week</option>
                  {weekOptions.map((week) => (
                    <option key={week.startDate} value={week.startDate}>
                      {week.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Search Box */}
              <div className="flex-1 min-w-[200px]">
                <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                  <FaSearch className="inline mr-1" /> Search
                </label>
                <input
                  type="text"
                  id="search"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  placeholder="Component, Customer..."
                  className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Selected Week Indicator */}
            {selectedWeek && (
              <div className="mt-3 p-2 bg-blue-50 rounded-md border border-blue-100 text-sm">
                <FaCalendarAlt className="inline mr-2 text-blue-600" />
                <span className="text-blue-800">
                  Showing data from <strong>{selectedWeek.startDate}</strong> to <strong>{selectedWeek.endDate}</strong>
                </span>
              </div>
            )}
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center items-center p-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              <span className="ml-3 text-gray-600">Loading planning data...</span>
            </div>
          )}

          {/* Data Table */}
          {!loading && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Component
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Target Dates
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Target
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Production
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Progress
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredData.length > 0 ? (
                      filteredData.map((item) => (
                        <tr key={item.Cnc_uid} className="hover:bg-gray-50">
                          <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                            {item.component}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                            {item.customer}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                            <div>{item.Target_start_date}</div>
                            <div className="text-gray-400">to</div>
                            <div>{item.Target_End_date}</div>
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                            {item.target.toLocaleString()}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                            <div className="font-medium">
                              {item.production_data?.total_production?.toLocaleString() || 0}
                            </div>
                            <div className="text-xs text-gray-400">
                              CNC: {item.production_data?.cnc_production?.toLocaleString() || 0}
                            </div>
                            <div className="text-xs text-gray-400">
                              Broach: {item.production_data?.broaching_production?.toLocaleString() || 0}
                            </div>
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-full mr-2">
                                <div className="w-full bg-gray-200 rounded-full h-2.5">
                                  <div
                                    className="bg-blue-600 h-2.5 rounded-full"
                                    style={{
                                      width: `${Math.min(
                                        100,
                                        item.production_data?.completion_percentage || 0
                                      )}%`,
                                    }}
                                  ></div>
                                </div>
                              </div>
                              <div className="text-xs text-gray-500">
                                {item.production_data?.completion_percentage?.toFixed(1) || 0}%
                              </div>
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                              Remaining: {item.production_data?.remaining?.toLocaleString() || 0}
                            </div>
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap">
                            {item.production_data?.remaining === 0 ? (
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                Completed
                              </span>
                            ) : (
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                Pending
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => showProductionDetails(item.production_data)}
                                className="text-blue-600 hover:text-blue-900"
                                title="View details"
                              >
                                <FaInfoCircle size={16} />
                              </button>
                              {item.done !== "Yes" && (
                                <input
                                  type="checkbox"
                                  onChange={() =>
                                    handleCheckboxChange(item.id, item.done === "Yes")
                                  }
                                  className="h-4 w-2 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                  title="Mark as completed"
                                />
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="8" className="px-4 py-2 text-center text-sm text-gray-500">
                          {cncData.length === 0
                            ? "No data available for the selected period"
                            : "No records match your search criteria"}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Production Details Modal */}
          {showDetailsModal && selectedProduction && (
            <div className="fixed inset-0 overflow-y-auto z-50">
              <div className="flex items-end justify-center min-h-screen px-2 pb-20 text-center sm:block sm:p-0">
                <div
                  className="fixed inset-0 transition-opacity"
                  aria-hidden="true"
                  onClick={() => setShowDetailsModal(false)}
                >
                  <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                </div>

                <span
                  className="hidden sm:inline-block sm:align-middle sm:h-screen"
                  aria-hidden="true"
                >
                  &#8203;
                </span>

                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
                  <div className="bg-white px-4 pt-1 pb-4 sm:p-1 sm:pb-4">
                    <div className="sm:flex sm:items-start">
                      <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                        <div className="flex justify-between items-center">
                          <h3 className="text-lg leading-6 font-medium text-gray-900">
                            Production Details
                          </h3>
                          <button
                            type="button"
                            className="text-gray-400 hover:text-gray-500"
                            onClick={() => setShowDetailsModal(false)}
                          >
                            <span className="sr-only">Close</span>
                            <svg
                              className="h-6 w-6"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        </div>

                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-blue-50 p-3 rounded-md">
                            <h4 className="font-medium text-blue-800">Production Summary</h4>
                            <div className="mt-2 space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span>Total Production:</span>
                                <span className="font-medium">
                                  {selectedProduction.total_production?.toLocaleString() || 0}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>CNC Production (Setup II only):</span>
                                <span className="font-medium">
                                  {selectedProduction.cnc_production?.toLocaleString() || 0}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Broaching Production:</span>
                                <span className="font-medium">
                                  {selectedProduction.broaching_production?.toLocaleString() || 0}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Remaining Target:</span>
                                <span className="font-medium">
                                  {selectedProduction.remaining?.toLocaleString() || 0}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Completion:</span>
                                <span className="font-medium">
                                  {selectedProduction.completion_percentage?.toFixed(1) || 0}%
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="bg-green-50 p-3 rounded-md">
                            <h4 className="font-medium text-green-800">Counting Notes</h4>
                            <div className="mt-2 text-sm text-green-700">
                              <p className="mb-1">• CNC production only counts when Setup is 'II'</p>
                              <p>• Broaching production counts all setups</p>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4">
                          <div className="h-96 overflow-y-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50 sticky top-0">
                                <tr>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky top-0 bg-gray-50">
                                    Date
                                  </th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky top-0 bg-gray-50">
                                    Shift
                                  </th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky top-0 bg-gray-50">
                                    Machine
                                  </th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky top-0 bg-gray-50">
                                    Type
                                  </th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky top-0 bg-gray-50">
                                    Setup
                                  </th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky top-0 bg-gray-50">
                                    Production
                                  </th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky top-0 bg-gray-50">
                                    Status
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {selectedProduction.production_details?.length > 0 ? (
                                  selectedProduction.production_details.map((detail, index) => (
                                    <tr key={index}>
                                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                                        {detail.date}
                                      </td>
                                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                                        {detail.shift}
                                      </td>
                                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                                        {detail.machine_no}
                                      </td>
                                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                                        {detail.mc_type}
                                      </td>
                                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                                        {detail.setup}
                                      </td>
                                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                                        {detail.production}
                                      </td>
                                      <td className="px-4 py-2 whitespace-nowrap text-sm">
                                        {detail.mc_type === 'cnc' && detail.setup === 'II' ? (
                                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                            Counted
                                          </span>
                                        ) : detail.mc_type === 'cnc' ? (
                                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                            Not Counted
                                          </span>
                                        ) : (
                                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                            Counted
                                          </span>
                                        )}
                                      </td>
                                    </tr>
                                  ))
                                ) : (
                                  <tr>
                                    <td
                                      colSpan="7"
                                      className="px-4 py-4 text-center text-sm text-gray-500"
                                    >
                                      No production details available
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                    <button
                      type="button"
                      className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                      onClick={() => setShowDetailsModal(false)}
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default CncPlanningList;