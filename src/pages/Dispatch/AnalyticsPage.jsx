import React, { useState, useEffect } from 'react';
import { Bar, Pie, Line, Doughnut } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import { Sidebar } from "../Navigation/Sidebar";
import DashboardHeader from "../Navigation/DashboardHeader";

Chart.register(...registerables);

const AnalyticsPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dispatchFilter, setDispatchFilter] = useState('customer');
  const [customerFilter, setCustomerFilter] = useState('');
  const [componentFilter, setComponentFilter] = useState('');
  const [allCustomers, setAllCustomers] = useState([]);
  const [allComponents, setAllComponents] = useState([]);
  const [activeComponentChart, setActiveComponentChart] = useState('tonnage');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState([]);
  const [modalDate, setModalDate] = useState('');
  const [modalDatePicker, setModalDatePicker] = useState(null);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarVisible(!isSidebarVisible);
  };
  const pageTitle = "Dispatch Analytics Dashboard"; // Set the page title here

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const month = selectedDate.getMonth() + 1;
      const year = selectedDate.getFullYear();
      const response = await fetch(`http://192.168.1.199:8001/raw_material/api/dispatch-analytics/?month=${month}&year=${year}`);
      const result = await response.json();
      
      if (response.ok) {
        setData(result);
        
        // Extract unique customers and components for filters
        const customers = [...new Set(result.data.map(item => item.customer))];
        const components = [...new Set(result.data.map(item => item.component))];
        
        setAllCustomers(customers);
        setAllComponents(components);
        setError(null);
      } else {
        throw new Error(result.error || 'Failed to fetch data');
      }
    } catch (err) {
      setError(err.message);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  // Filter data based on selected filters
  const getFilteredData = () => {
    if (!data) return [];
    
    return data.data.filter(item => {
      const matchesCustomer = customerFilter ? item.customer === customerFilter : true;
      const matchesComponent = componentFilter ? item.component === componentFilter : true;
      return matchesCustomer && matchesComponent;
    });
  };

  // Data preparation functions
  const prepareDispatchData = (groupBy) => {
    const filteredData = getFilteredData();
    if (filteredData.length === 0) return { labels: [], datasets: [] };

    const groupedData = filteredData.reduce((acc, item) => {
      const key = item[groupBy] || 'Unknown';
      if (!acc[key]) {
        acc[key] = { pieces: 0, tonnage: 0, value: 0 };
      }
      acc[key].pieces += item.pieces;
      acc[key].tonnage += item.tonnage;
      acc[key].value += item.total_value;
      return acc;
    }, {});

    const labels = Object.keys(groupedData);
    const tonnageData = labels.map(label => groupedData[label].tonnage);
    const valueData = labels.map(label => groupedData[label].value);

    return {
      labels,
      datasets: [
        {
          label: 'Tonnage (tonnes)',
          data: tonnageData,
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1,
          yAxisID: 'y',
        },
        {
          label: 'Value (₹)',
          data: valueData,
          backgroundColor: 'rgba(255, 99, 132, 0.6)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1,
          yAxisID: 'y1',
        }
      ]
    };
  };

  const preparePiecesData = (groupBy) => {
    const filteredData = getFilteredData();
    if (filteredData.length === 0) return { labels: [], datasets: [] };

    const groupedData = filteredData.reduce((acc, item) => {
      const key = item[groupBy] || 'Unknown';
      if (!acc[key]) {
        acc[key] = { pieces: 0 };
      }
      acc[key].pieces += item.pieces;
      return acc;
    }, {});

    const labels = Object.keys(groupedData);
    const piecesData = labels.map(label => groupedData[label].pieces);

    return {
      labels,
      datasets: [
        {
          label: 'Pieces',
          data: piecesData,
          backgroundColor: labels.map((_, i) => 
            `hsl(${i * 360 / labels.length}, 70%, 50%)`
          ),
          borderColor: 'rgba(0, 0, 0, 0.1)',
          borderWidth: 1,
        }
      ]
    };
  };

  const prepareDailyTrendData = (metric) => {
    const filteredData = getFilteredData();
    if (filteredData.length === 0) return { labels: [], datasets: [] };

    const dailyData = filteredData.reduce((acc, item) => {
      const date = item.date;
      if (!acc[date]) {
        acc[date] = { pieces: 0, tonnage: 0, value: 0 };
      }
      acc[date].pieces += item.pieces;
      acc[date].tonnage += item.tonnage;
      acc[date].value += item.total_value;
      return acc;
    }, {});

    const labels = Object.keys(dailyData).sort();
    const dataPoints = labels.map(date => dailyData[date][metric]);

    return {
      labels,
      datasets: [
        {
          label: metric === 'pieces' ? 'Daily Pieces' : 
                metric === 'tonnage' ? 'Daily Tonnage (tonnes)' : 'Daily Value (₹)',
          data: dataPoints,
          borderColor: metric === 'pieces' ? 'rgba(54, 162, 235, 1)' :
                     metric === 'tonnage' ? 'rgba(75, 192, 192, 1)' : 'rgba(255, 99, 132, 1)',
          backgroundColor: metric === 'pieces' ? 'rgba(54, 162, 235, 0.1)' :
                          metric === 'tonnage' ? 'rgba(75, 192, 192, 0.1)' : 'rgba(255, 99, 132, 0.1)',
          tension: 0.3,
          fill: true,
        }
      ]
    };
  };
  // Add this new function for preparing component data
  const prepareComponentData = () => {
    const filteredData = getFilteredData();
    if (filteredData.length === 0) return { labels: [], datasets: [] };

    const componentData = filteredData.reduce((acc, item) => {
      const component = item.component || 'Unknown';
      if (!acc[component]) {
        acc[component] = { pieces: 0, tonnage: 0, value: 0 };
      }
      acc[component].pieces += item.pieces;
      acc[component].tonnage += item.tonnage;
      acc[component].value += item.total_value;
      return acc;
    }, {});

    // Sort based on active chart metric
    const sortedComponents = Object.keys(componentData).sort((a, b) => {
      return componentData[b][activeComponentChart] - componentData[a][activeComponentChart];
    });

    const chartData = sortedComponents.map(comp => componentData[comp][activeComponentChart]);
    const backgroundColor = 
      activeComponentChart === 'pieces' ? 'rgba(54, 162, 235, 0.6)' :
      activeComponentChart === 'tonnage' ? 'rgba(75, 192, 192, 0.6)' :
      'rgba(255, 99, 132, 0.6)';

    const borderColor = 
      activeComponentChart === 'pieces' ? 'rgba(54, 162, 235, 1)' :
      activeComponentChart === 'tonnage' ? 'rgba(75, 192, 192, 1)' :
      'rgba(255, 99, 132, 1)';

    const label = 
      activeComponentChart === 'pieces' ? 'Pieces' :
      activeComponentChart === 'tonnage' ? 'Tonnage (tonnes)' :
      'Value (₹)';

    return {
      labels: sortedComponents,
      datasets: [{
        label,
        data: chartData,
        backgroundColor,
        borderColor,
        borderWidth: 1
      }]
    };
  };
    // Function to show modal with dispatch details for a specific day
  const showDayDetails = (day) => {
    const filteredData = getFilteredData();
    const dayData = filteredData.filter(item => item.date === day);
    setModalData(dayData);
    setModalDate(day);
    setModalOpen(true);
  };

  // Function to handle date change in modal
  const handleModalDateChange = async (date) => {
    setModalDatePicker(date);
    const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    
    try {
      const response = await fetch(`http://192.168.1.199:8001/raw_material/api/dispatch-analytics/?date=${formattedDate}`);
      const result = await response.json();
      
      if (response.ok) {
        setModalData(result.data);
        setModalDate(formattedDate);
      } else {
        throw new Error(result.error || 'Failed to fetch data');
      }
    } catch (err) {
      console.error('Error fetching day data:', err);
    }
  };


  const getDispatchExtremes = () => {
    const filteredData = getFilteredData();
    if (filteredData.length === 0) return null;

    const dailyData = filteredData.reduce((acc, item) => {
      const date = item.date;
      if (!acc[date]) {
        acc[date] = { pieces: 0, tonnage: 0, value: 0, rawData: [] };
      }
      acc[date].pieces += item.pieces;
      acc[date].tonnage += item.tonnage;
      acc[date].value += item.total_value;
      acc[date].rawData.push(item);
      return acc;
    }, {});

    const days = Object.keys(dailyData);
    if (days.length === 0) return null;

    let maxPiecesDay = days[0];
    let minPiecesDay = days[0];
    let maxTonnageDay = days[0];
    let minTonnageDay = days[0];
    let maxValueDay = days[0];
    let minValueDay = days[0];

    days.forEach(day => {
      if (dailyData[day].pieces > dailyData[maxPiecesDay].pieces) maxPiecesDay = day;
      if (dailyData[day].pieces < dailyData[minPiecesDay].pieces) minPiecesDay = day;
      if (dailyData[day].tonnage > dailyData[maxTonnageDay].tonnage) maxTonnageDay = day;
      if (dailyData[day].tonnage < dailyData[minTonnageDay].tonnage) minTonnageDay = day;
      if (dailyData[day].value > dailyData[maxValueDay].value) maxValueDay = day;
      if (dailyData[day].value < dailyData[minValueDay].value) minValueDay = day;
    });

    return {
      maxPieces: { day: maxPiecesDay, value: dailyData[maxPiecesDay].pieces, rawData: dailyData[maxPiecesDay].rawData },
      minPieces: { day: minPiecesDay, value: dailyData[minPiecesDay].pieces, rawData: dailyData[minPiecesDay].rawData },
      maxTonnage: { day: maxTonnageDay, value: dailyData[maxTonnageDay].tonnage, rawData: dailyData[maxTonnageDay].rawData },
      minTonnage: { day: minTonnageDay, value: dailyData[minTonnageDay].tonnage, rawData: dailyData[minTonnageDay].rawData },
      maxValue: { day: maxValueDay, value: dailyData[maxValueDay].value, rawData: dailyData[maxValueDay].rawData },
      minValue: { day: minValueDay, value: dailyData[minValueDay].value, rawData: dailyData[minValueDay].rawData },
    };
  };

  const getSummaryData = () => {
    const filteredData = getFilteredData();
    if (filteredData.length === 0) return null;

    return filteredData.reduce((acc, item) => {
      return {
        dispatch_count: acc.dispatch_count + 1,
        total_pieces: acc.total_pieces + item.pieces,
        total_tonnage: acc.total_tonnage + item.tonnage,
        total_value: acc.total_value + item.total_value
      };
    }, {
      dispatch_count: 0,
      total_pieces: 0,
      total_tonnage: 0,
      total_value: 0
    });
  };

  const exportToExcel = () => {
    const filteredData = getFilteredData();
    if (filteredData.length === 0) return;
    
    const worksheet = XLSX.utils.json_to_sheet(filteredData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Dispatch Analytics");
    XLSX.writeFile(workbook, `dispatch_analytics_${selectedDate.getFullYear()}_${selectedDate.getMonth() + 1}.xlsx`);
  };

  const exportToPDF = () => {
    alert('PDF export would be implemented with a proper PDF generation library');
  };

  const extremes = data ? getDispatchExtremes() : null;
  const summary = data ? getSummaryData() : null;
  const componentData = data ? prepareComponentData() : null;

  // Get all unique dates from the filtered data for the modal date selector
  const getAvailableDates = () => {
    const filteredData = getFilteredData();
    if (!filteredData.length) return [];
    return [...new Set(filteredData.map(item => item.date))].sort();
  };

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
    <div className="w-full">
      {/* Header Section */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {data && (
        <div className="space-y-6">
          {/* Header and Date Picker */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Dispatch Analytics Dashboard</h1>
              <p className="text-gray-600">Comprehensive overview of dispatch performance</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <div className="flex-1">
                <DatePicker
                  selected={selectedDate}
                  onChange={date => setSelectedDate(date)}
                  dateFormat="MM/yyyy"
                  showMonthYearPicker
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button 
                onClick={fetchData}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Loading...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                    </svg>
                    Refresh
                  </>
                )}
              </button>
              <div>
              <select
                id="customer-filter"
                value={customerFilter}
                onChange={(e) => setCustomerFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Customers</option>
                {allCustomers.map(customer => (
                  <option key={customer} value={customer}>{customer}</option>
                ))}
              </select>
            </div>
            <div>
              <select
                id="component-filter"
                value={componentFilter}
                onChange={(e) => setComponentFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Components</option>
                {allComponents.map(component => (
                  <option key={component} value={component}>{component}</option>
                ))}
              </select>
            </div>
            </div>
          </div>

          {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-800">Dispatch Details</h3>
                <button 
                  onClick={() => setModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Date</label>
                <select
                  value={modalDate}
                  onChange={(e) => {
                    const selectedDate = e.target.value;
                    const dayData = getFilteredData().filter(item => item.date === selectedDate);
                    setModalData(dayData);
                    setModalDate(selectedDate);
                  }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {getAvailableDates().map(date => (
                    <option key={date} value={date}>{date}</option>
                  ))}
                </select>
              </div>
              
              <p className="text-sm text-gray-600 mb-4">Showing data for: {modalDate}</p>
              
              {modalData.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Component</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pieces</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tonnage</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {modalData.map((item, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.component}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.pieces.toLocaleString()}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.tonnage.toFixed(2)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{item.total_value.toLocaleString()}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.customer}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.location}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500">No dispatch data available for this day.</p>
              )}
            </div>
          </div>
        </div>
      )}


          {/* Summary Cards */}
          {summary && (
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-2">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-blue-50 text-blue-600">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-sm font-medium text-gray-500">Total Dispatches</h3>
                      <p className="text-2xl font-semibold text-gray-900">{summary.dispatch_count}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-2">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-green-50 text-green-600">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-sm font-medium text-gray-500">Total Pieces</h3>
                      <p className="text-2xl font-semibold text-gray-900">{summary.total_pieces.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-2">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-purple-50 text-purple-600">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-sm font-medium text-gray-500">Total Tonnage</h3>
                      <p className="text-2xl font-semibold text-gray-900">{summary.total_tonnage.toFixed(2)} <span className="text-sm font-normal">tonnes</span></p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-2">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-yellow-50 text-yellow-600">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-sm font-medium text-gray-500">Total Value</h3>
                      <p className="text-2xl font-semibold text-gray-900">₹{summary.total_value.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* KPI Cards for Max/Min Dispatch Days */}
          {extremes && (
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-2 relative">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Max Pieces</h3>
            <div className="flex items-end justify-between">
              <p className="text-xl font-semibold text-gray-900">{extremes.maxPieces.value.toLocaleString()}</p>
              <p className="text-xs text-gray-500">{extremes.maxPieces.day}</p>
            </div>
            <button 
              onClick={() => showDayDetails(extremes.maxPieces.day)}
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
              title="View details"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-2 relative">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Min Pieces</h3>
            <div className="flex items-end justify-between">
              <p className="text-xl font-semibold text-gray-900">{extremes.minPieces.value.toLocaleString()}</p>
              <p className="text-xs text-gray-500">{extremes.minPieces.day}</p>
            </div>
            <button 
              onClick={() => showDayDetails(extremes.minPieces.day)}
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
              title="View details"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-2 relative">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Max Tonnage</h3>
            <div className="flex items-end justify-between">
              <p className="text-xl font-semibold text-gray-900">{extremes.maxTonnage.value.toFixed(2)} <span className="text-xs font-normal">t</span></p>
              <p className="text-xs text-gray-500">{extremes.maxTonnage.day}</p>
            </div>
            <button 
              onClick={() => showDayDetails(extremes.maxTonnage.day)}
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
              title="View details"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-2 relative">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Min Tonnage</h3>
            <div className="flex items-end justify-between">
              <p className="text-xl font-semibold text-gray-900">{extremes.minTonnage.value.toFixed(2)} <span className="text-xs font-normal">t</span></p>
              <p className="text-xs text-gray-500">{extremes.minTonnage.day}</p>
            </div>
            <button 
              onClick={() => showDayDetails(extremes.minTonnage.day)}
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
              title="View details"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-2 relative">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Max Value</h3>
            <div className="flex items-end justify-between">
              <p className="text-xl font-semibold text-gray-900">₹{extremes.maxValue.value.toLocaleString()}</p>
              <p className="text-xs text-gray-500">{extremes.maxValue.day}</p>
            </div>
            <button 
              onClick={() => showDayDetails(extremes.maxValue.day)}
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
              title="View details"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-2 relative">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Min Value</h3>
            <div className="flex items-end justify-between">
              <p className="text-xl font-semibold text-gray-900">₹{extremes.minValue.value.toLocaleString()}</p>
              <p className="text-xs text-gray-500">{extremes.minValue.day}</p>
            </div>
            <button 
              onClick={() => showDayDetails(extremes.minValue.day)}
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
              title="View details"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </div>
        </div>
      )}

          {/* Dispatch Analysis Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
              <h2 className="text-lg font-semibold text-gray-800">Dispatch Analysis</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setDispatchFilter('customer')}
                  className={`px-3 py-1 text-sm rounded-lg transition-colors ${dispatchFilter === 'customer' ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
                >
                  By Customer
                </button>
                <button
                  onClick={() => setDispatchFilter('location')}
                  className={`px-3 py-1 text-sm rounded-lg transition-colors ${dispatchFilter === 'location' ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
                >
                  By Location
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
              {/* Tonnage and Value Chart */}
              <div className="h-80">
                <h3 className="text-md font-medium text-gray-700 mb-2">Tonnage & Value by {dispatchFilter}</h3>
                <Bar
                  data={prepareDispatchData(dispatchFilter)}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'top',
                      },
                      tooltip: {
                        callbacks: {
                          label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                              label += ': ';
                            }
                            if (context.dataset.label === 'Value (₹)') {
                              label += '₹' + context.raw.toLocaleString();
                            } else if (context.dataset.label === 'Tonnage (tonnes)') {
                              label += context.raw.toFixed(2) + ' tonnes';
                            }
                            return label;
                          }
                        }
                      }
                    },
                    scales: {
                      y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                          display: true,
                          text: 'Tonnage (tonnes)'
                        }
                      },
                      y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                          display: true,
                          text: 'Value (₹)'
                        },
                        grid: {
                          drawOnChartArea: false,
                        },
                      }
                    }
                  }}
                />
              </div>

              {/* Pieces Chart */}
              <div className="h-80">
                <h3 className="text-md font-medium text-gray-700 mb-2">Pieces by {dispatchFilter}</h3>
                <Doughnut
                  data={preparePiecesData(dispatchFilter)}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'right',
                      },
                      tooltip: {
                        callbacks: {
                          label: function(context) {
                            const total = context.chart._metasets[context.datasetIndex].total;
                            const value = context.raw;
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${context.label}: ${value.toLocaleString()} pieces (${percentage}%)`;
                          }
                          
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>
          </div>

          {/* Daily Dispatch Trends */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Daily Pieces Trend</h2>
              <div className="h-72">
                <Line
                  data={prepareDailyTrendData('pieces')}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false
                      }
                    },
                    scales: {
                      y: {
                        title: {
                          display: true,
                          text: 'Pieces'
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Daily Tonnage Trend</h2>
              <div className="h-72">
                <Line
                  data={prepareDailyTrendData('tonnage')}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false
                      }
                    },
                    scales: {
                      y: {
                        title: {
                          display: true,
                          text: 'Tonnage (tonnes)'
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Daily Value Trend</h2>
              <div className="h-72">
                <Line
                  data={prepareDailyTrendData('value')}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false
                      }
                    },
                    scales: {
                      y: {
                        title: {
                          display: true,
                          text: 'Value (₹)'
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>
          </div>
          {/* Add this new Component Analysis section */}
          {componentData && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Component Analysis</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setActiveComponentChart('pieces')}
                className={`px-3 py-1 text-sm rounded-lg transition-colors ${activeComponentChart === 'pieces' ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
              >
                Pieces
              </button>
              <button
                onClick={() => setActiveComponentChart('tonnage')}
                className={`px-3 py-1 text-sm rounded-lg transition-colors ${activeComponentChart === 'tonnage' ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
              >
                Tonnage
              </button>
              <button
                onClick={() => setActiveComponentChart('value')}
                className={`px-3 py-1 text-sm rounded-lg transition-colors ${activeComponentChart === 'value' ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
              >
                Value
              </button>
            </div>
          </div>

          <div className="h-96">
            <Bar
              data={componentData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false
                  },
                  tooltip: {
                    callbacks: {
                      label: function(context) {
                        if (activeComponentChart === 'pieces') {
                          return `${context.raw.toLocaleString()} pieces`;
                        } else if (activeComponentChart === 'tonnage') {
                          return `${context.raw.toFixed(2)} tonnes`;
                        } else {
                          return `₹${context.raw.toLocaleString()}`;
                        }
                      }
                    }
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    title: {
                      display: true,
                      text: activeComponentChart === 'pieces' ? 'Pieces' : 
                            activeComponentChart === 'tonnage' ? 'Tonnage (tonnes)' : 'Value (₹)'
                    }
                  }
                },
                
              }}
            />
          </div>
        </div>
      )}

          {/* Customer-Location Matrix */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-200">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h2 className="text-lg font-semibold text-gray-800">Customer-Location Matrix</h2>
                <div className="flex gap-2">
                  <button 
                    onClick={exportToExcel}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-sm transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Excel
                  </button>
                  <button 
                    onClick={exportToPDF}
                    className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-sm transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    PDF
                  </button>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pieces</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tonnage</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {Object.entries(
                    getFilteredData().reduce((acc, item) => {
                      const key = `${item.customer}|${item.location}`;
                      if (!acc[key]) {
                        acc[key] = {
                          customer: item.customer,
                          location: item.location,
                          pieces: 0,
                          tonnage: 0,
                          value: 0
                        };
                      }
                      acc[key].pieces += item.pieces;
                      acc[key].tonnage += item.tonnage;
                      acc[key].value += item.total_value;
                      return acc;
                    }, {})
                  ).map(([key, row]) => (
                    <tr key={key} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{row.customer}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.location}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.pieces.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.tonnage.toFixed(2)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{row.value.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
    </main>
    </div>
    </div>
  );
};

export default AnalyticsPage;