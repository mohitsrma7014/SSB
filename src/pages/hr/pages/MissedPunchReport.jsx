import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import { Sidebar } from "../../Navigation/Sidebar";
import DashboardHeader from "../../Navigation/DashboardHeader";

const MissedPunchReport = () => {
  const [reportType, setReportType] = useState('date');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [isLoading, setIsLoading] = useState(false);
  const [reportData, setReportData] = useState([]);
  const [detailedView, setDetailedView] = useState(null);
  const [filterText, setFilterText] = useState('');
  const [error, setError] = useState('');
  const [showSelector, setShowSelector] = useState(true);

  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const toggleSidebar = () => {
    setIsSidebarVisible(!isSidebarVisible);
  };
  const pageTitle = "Manual Punch Management";

  // Months for dropdown
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Years for dropdown (last 5 years and next 2)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 8 }, (_, i) => currentYear - 5 + i);

  const fetchReport = async () => {
    setIsLoading(true);
    setError('');
    try {
      let payload = {};
      if (reportType === 'date') {
        if (!selectedDate) {
          setError('Please select a date');
          setIsLoading(false);
          return;
        }
        payload = { date: selectedDate };
      } else {
        if (!selectedMonth || !selectedYear) {
          setError('Please select both month and year');
          setIsLoading(false);
          return;
        }
        payload = {
          month: months.indexOf(selectedMonth) + 1,
          year: selectedYear
        };
      }

      const response = await axios.post('http://192.168.1.199:8002/api/misspunch/', payload);
      setReportData(response.data);
      setShowSelector(false);
    } catch (err) {
      setError('Failed to fetch report. Please try again.');
      console.error('Error fetching report:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetails = (employeeId) => {
    if (detailedView === employeeId) {
      setDetailedView(null);
    } else {
      setDetailedView(employeeId);
    }
  };

  const exportToExcel = (employeeId = null) => {
    let dataToExport = reportData;
    
    if (employeeId) {
      dataToExport = reportData.filter(emp => emp.employee_id === employeeId);
    }

    if (dataToExport.length === 0) {
      alert('No data to export');
      return;
    }

    // Transform data for Excel
    const excelData = dataToExport.map(emp => ({
      'Employee ID': emp.employee_id,
      'Employee Name': emp.employee_name,
      'Department': emp.department,
      'Date': emp.date,
      'Missed Type': emp.missed_type,
      'Details': emp.details,
      'Shift Type': emp.shift_type,
      'Scheduled In': emp.scheduled_in,
      'Scheduled Out': emp.scheduled_out
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Missed Punches');

    // Generate filename
    let filename = 'Missed_Punches_Report';
    if (employeeId) {
      const employee = reportData.find(emp => emp.employee_id === employeeId);
      filename += `_${employee.employee_id}_${employee.employee_name}`;
    }
    filename += reportType === 'date' 
      ? `_${selectedDate}` 
      : `_${selectedMonth}_${selectedYear}`;

    XLSX.writeFile(workbook, `${filename}.xlsx`);
  };

  // Calculate summary statistics for each employee
  const getEmployeeSummary = (employeeId) => {
    const employeeRecords = reportData.filter(emp => emp.employee_id === employeeId);
    return {
      totalMissed: employeeRecords.length,
      inMissed: employeeRecords.filter(rec => rec.missed_type === 'IN').length,
      outMissed: employeeRecords.filter(rec => rec.missed_type === 'OUT').length,
      bothMissed: employeeRecords.filter(rec => rec.missed_type === 'BOTH').length,
    };
  };

  // Get unique employees from report data
  const uniqueEmployees = [...new Set(reportData.map(item => item.employee_id))].map(id => {
    const employee = reportData.find(emp => emp.employee_id === id);
    return {
      employee_id: id,
      employee_name: employee.employee_name,
      department: employee.department,
      ...getEmployeeSummary(id)
    };
  });

  // Filter employees based on search text
  const filteredEmployees = uniqueEmployees.filter(emp => 
    emp.employee_id.toLowerCase().includes(filterText.toLowerCase()) ||
    emp.employee_name.toLowerCase().includes(filterText.toLowerCase())
  );

  const resetSelection = () => {
    setShowSelector(true);
    setReportData([]);
    setDetailedView(null);
    setFilterText('');
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

        {/* Main Content */}
        <main className="flex flex-col mt-20 justify-center flex-grow pl-2">
    <div className="container mx-auto p-4">
      {/* Date/Month Selector - Centered Box */}
      {showSelector && (
        <div className="fixed   bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
            <h2 className="text-xl font-semibold mb-4 text-center">Select Report Period</h2>
            
            <div className="flex justify-center mb-4">
              <label className="mr-4">
                <input
                  type="radio"
                  checked={reportType === 'date'}
                  onChange={() => setReportType('date')}
                  className="mr-2"
                />
                Single Date
              </label>
              <label>
                <input
                  type="radio"
                  checked={reportType === 'month'}
                  onChange={() => setReportType('month')}
                  className="mr-2"
                />
                Monthly
              </label>
            </div>

            {reportType === 'date' ? (
              <div className="flex flex-col mb-4">
                <label className="mb-2">Select Date:</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="border p-2 rounded"
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>
            ) : (
              <div className="space-y-4 mb-4">
                <div>
                  <label className="mb-2">Month:</label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="border p-2 rounded w-full"
                  >
                    <option value="">Select Month</option>
                    {months.map((month, index) => (
                      <option key={index} value={month}>{month}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2">Year:</label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className="border p-2 rounded w-full"
                  >
                    {years.map((year, index) => (
                      <option key={index} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {error && <p className="text-red-500 mb-4 text-center">{error}</p>}

            <div className="flex justify-center">
              <button
                onClick={fetchReport}
                disabled={isLoading}
                className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:bg-blue-300"
              >
                {isLoading ? 'Loading...' : 'Generate Report'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Display */}
      {!showSelector && (
        <div className="relative min-w-full">
          {/* Back Button */}
          <button
            onClick={resetSelection}
            className="mb-4 flex items-center text-blue-600 hover:text-blue-800"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back to Date Selection
          </button>

          {/* Report Summary */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                {reportType === 'date' 
                  ? `Missed Punches on ${selectedDate}`
                  : `Missed Punches for ${selectedMonth} ${selectedYear}`}
              </h2>
              <div className="flex space-x-2">
                <button
                  onClick={() => exportToExcel()}
                  className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                >
                  Export All to Excel
                </button>
              </div>
            </div>

            {/* Filter */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="Filter by ID or Name"
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                className="border p-2 rounded w-full md:w-1/3"
              />
            </div>

            {/* Summary Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border">
                <thead>
                  <tr className="bg-gray-100 sticky top-0 z-10">
                    <th className="py-2 px-4 border sticky top-0 bg-gray-100">Employee ID</th>
                    <th className="py-2 px-4 border sticky top-0 bg-gray-100">Name</th>
                    <th className="py-2 px-4 border sticky top-0 bg-gray-100">Department</th>
                    <th className="py-2 px-4 border sticky top-0 bg-gray-100">Total Missed</th>
                    <th className="py-2 px-4 border sticky top-0 bg-gray-100">IN Missed</th>
                    <th className="py-2 px-4 border sticky top-0 bg-gray-100">OUT Missed</th>
                    <th className="py-2 px-4 border sticky top-0 bg-gray-100">BOTH Missed</th>
                    <th className="py-2 px-4 border sticky top-0 bg-gray-100">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.map((emp) => (
                    <tr key={emp.employee_id} className="hover:bg-gray-50">
                      <td className="py-2 px-4 border">{emp.employee_id}</td>
                      <td className="py-2 px-4 border">{emp.employee_name}</td>
                      <td className="py-2 px-4 border">{emp.department}</td>
                      <td className="py-2 px-4 border text-center">{emp.totalMissed}</td>
                      <td className="py-2 px-4 border text-center">{emp.inMissed}</td>
                      <td className="py-2 px-4 border text-center">{emp.outMissed}</td>
                      <td className="py-2 px-4 border text-center">{emp.bothMissed}</td>
                      <td className="py-2 px-4 border text-center">
                        <button
                          onClick={() => handleViewDetails(emp.employee_id)}
                          className="text-blue-600 hover:underline mr-2"
                        >
                          {detailedView === emp.employee_id ? 'Hide' : 'View'}
                        </button>
                        <button
                          onClick={() => exportToExcel(emp.employee_id)}
                          className="text-green-600 hover:underline"
                        >
                          Export
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Detailed View Popup */}
          {detailedView && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg p-6 max-w-5xl w-full max-h-[90vh] overflow-auto shadow-xl">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">
                    Detailed Missed Punches for {reportData.find(emp => emp.employee_id === detailedView)?.employee_name}
                  </h3>
                  <button
                    onClick={() => setDetailedView(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border">
                    <thead>
                      <tr className="bg-gray-200 sticky top-0">
                        <th className="py-2 px-4 border sticky top-0 bg-gray-200">Date</th>
                        <th className="py-2 px-4 border sticky top-0 bg-gray-200">Missed Type</th>
                        <th className="py-2 px-4 border sticky top-0 bg-gray-200">Details</th>
                        <th className="py-2 px-4 border sticky top-0 bg-gray-200">Shift Type</th>
                        <th className="py-2 px-4 border sticky top-0 bg-gray-200">Scheduled In</th>
                        <th className="py-2 px-4 border sticky top-0 bg-gray-200">Scheduled Out</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData
                        .filter(item => item.employee_id === detailedView)
                        .map((item, idx) => (
                          <tr key={idx} className="hover:bg-gray-100">
                            <td className="py-2 px-4 border">{item.date}</td>
                            <td className="py-2 px-4 border">{item.missed_type}</td>
                            <td className="py-2 px-4 border">{item.details}</td>
                            <td className="py-2 px-4 border">{item.shift_type}</td>
                            <td className="py-2 px-4 border">{item.scheduled_in}</td>
                            <td className="py-2 px-4 border">{item.scheduled_out}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && reportData.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No missed punches found for the selected period
            </div>
          )}
        </div>
      )}
    </div>
    </main>
    </div>
    </div>
  );
};

export default MissedPunchReport;