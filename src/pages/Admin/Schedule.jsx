import React, { useState, useEffect } from 'react';
import { Sidebar } from "../Navigation/Sidebar";
import DashboardHeader from "../Navigation/DashboardHeader";
import BlockmtForm from './Components/BlockmtForm1';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';

const Schedule = () => {
  const [scheduleData, setScheduleData] = useState({});
  const [filteredData, setFilteredData] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [activeCustomer, setActiveCustomer] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [chartData, setChartData] = useState({
    productionByLine: [],
    productionByCustomer: []
  });
  const [totalWeight, setTotalWeight] = useState(0);

  const toggleSidebar = () => {
    setIsSidebarVisible(!isSidebarVisible);
  };
  const pageTitle = "Customer Schedule & Production Planning";

  // Define monthly capacity for each line (in kg)
  const lineCapacities = {
    'Hammer2': 210000, // 1000 tonnes
    'A-set': 175000,  // 800 tonnes
    'B-set': 175000,  // 800 tonnes
    '1000 ton': 140000,  // 600 tonnes
    '1600 ton': 210000,  // 500 tonnes
    'Hammer1': 210000,  // 500 tonnes
    'W-set': 175000,  // 500 tonnes
    'Ffl': 245000,  // 500 tonnes
    'Nhf-1000': 140000,  // 500 tonnes
    // Add more lines as needed
  };

  const fetchSchedulesByMonth = () => {
    setLoadingSuggestions(true);
    let url = 'http://192.168.1.199:8001/raw_material/api/schedule/';
    if (selectedMonth && selectedYear) {
      const formattedMonth = selectedMonth.toString().padStart(2, '0');
      const formattedDate = `${selectedYear}-${formattedMonth}`;
      url += `?month=${formattedDate}`;
    }

    fetch(url)
      .then((response) => response.json())
      .then((data) => {
        if (data.message || data.length === 0) {
          setScheduleData({});
          setFilteredData([]);
          setErrorMessage('Data not available for the selected month and year.');
          setChartData({ productionByLine: [], productionByCustomer: [] });
          setTotalWeight(0);
          return;
        }

        // Process schedule data
        const newScheduleData = data.schedule_data.reduce((acc, schedule) => {
          if (!acc[schedule.customer]) acc[schedule.customer] = [];
          acc[schedule.customer].push(schedule);
          return acc;
        }, {});
        
        setScheduleData(newScheduleData);
        const firstCustomer = Object.keys(newScheduleData)[0];
        setActiveCustomer(firstCustomer);
        setFilteredData(newScheduleData[firstCustomer]);
        setErrorMessage('');

        // Calculate total weight
        const weightSum = data.schedule_data.reduce((sum, item) => sum + (item.total_schedule_weight || 0), 0);
        setTotalWeight(weightSum);

        // Process chart data
        if (data.chart_data) {
          setChartData({
            productionByLine: data.chart_data.by_line || [],
            productionByCustomer: data.chart_data.by_customer || []
          });
        }
      })
      .catch(() => {
        setScheduleData({});
        setFilteredData([]);
        setErrorMessage('Error fetching data. Please try again later.');
        setChartData({ productionByLine: [], productionByCustomer: [] });
        setTotalWeight(0);
      })
      .finally(() => {
        setLoadingSuggestions(false);
      });
  };

  // Get color based on capacity utilization
  const getCapacityColor = (line, weight) => {
    const capacity = lineCapacities[line] || 1; // Default to 1 to avoid division by zero
    const utilization = (weight / capacity) * 100;
    
    if (utilization < 25) return '#FF0000'; // Red
    if (utilization < 50) return '#FFA500'; // Orange
    if (utilization < 80) return '#FFFF00'; // Yellow
    return '#00FF00'; // Green
  };

  // Chart options
 // Chart options
const getChartOptions = (title, data, xField) => {
  const isLineChart = xField === 'line';

  return {
    chart: {
      type: 'column',
      backgroundColor: darkMode ? '#2d3748' : '#ffffff',
      height: 400
    },
    title: {
      text: title,
      style: {
        color: darkMode ? '#f7fafc' : '#1a202c',
        fontSize: '14px'
      }
    },
    xAxis: {
      categories: data.map(item => item[xField]),
      labels: {
        rotation: 0,
        style: {
          color: darkMode ? '#cbd5e0' : '#4a5568',
          fontSize: '10px',
          whiteSpace: 'nowrap'
        }
      },
      crosshair: true
    },
    yAxis: {
      min: 0,
      title: {
        text: 'Quantity',
        style: {
          color: darkMode ? '#cbd5e0' : '#4a5568'
        }
      },
      gridLineColor: darkMode ? '#4a5568' : '#e2e8f0'
    },
    tooltip: {
      headerFormat: '<span style="font-size:13px"><b>{point.key}</b></span><table>',
      pointFormat: function () {
        return '<tr><td style="color:{series.color};padding:0">{series.name}: </td>' +
               '<td style="padding:0"><b>{point.y}</b></td></tr>';
      },
      formatter: function () {
        const line = this.key;
        const weight = this.points?.find(p => p.series.name === 'Weight (kg)')?.y || 0;
        const capacity = lineCapacities[line] || 1;
        const percentage = ((weight / capacity) * 100).toFixed(1);

        let tooltip = `<span style="font-size:13px"><b>${line}</b></span><table>`;
        this.points.forEach(point => {
          const suffix = point.series.name.includes("Pieces") ? " pcs" : " kg";
          tooltip += `<tr><td style="color:${point.color};padding:0">${point.series.name}: </td>
                      <td style="padding:0"><b>${point.y}${suffix}</b></td></tr>`;
        });

        if (isLineChart) {
          tooltip += `<tr><td style="padding:0">Utilization: </td><td><b>${percentage}%</b></td></tr>`;
        }

        tooltip += '</table>';
        return tooltip;
      },
      shared: true,
      useHTML: true,
      backgroundColor: darkMode ? '#1a202c' : '#ffffff',
      style: {
        color: darkMode ? '#f7fafc' : '#1a202c',
        fontSize: '13px'
      }
    },
    plotOptions: {
      column: {
        pointPadding: 0.2,
        borderWidth: 0,
        borderRadius: 3,
        dataLabels: {
          enabled: true,
          rotation: -90,
          color: darkMode ? '#f7fafc' : '#000',
          align: 'right',
          format: '{point.y} {series.name=="Pieces" ? "pcs" : "kg"}',
          style: {
            fontSize: '10px',
            fontFamily: 'Verdana, sans-serif'
          }
        },
        colorByPoint: isLineChart
      }
    },
    series: [
      {
        name: 'Pieces',
        data: data.map(item => item.total_pices),
        color: '#3182ce',
        colorByPoint: false, // Ensure all pieces bars are navy blue
        dataLabels: {
          format: '{y} pcs'
        }
      },
      {
        name: 'Weight (kg)',
        data: data.map(item => ({
          y: item.total_weight,
          color: isLineChart ? getCapacityColor(item.line, item.total_weight) : (darkMode ? '#48bb78' : '#38a169')
        })),
        dataLabels: {
          format: '{y} kg'
        }
      }
    ],
    credits: {
      enabled: false
    },
    legend: {
      itemStyle: {
        color: darkMode ? '#cbd5e0' : '#4a5568'
      }
    }
  };
};


  const handleCustomerClick = (customer) => {
    setActiveCustomer(customer);
    setFilteredData(scheduleData[customer]);
  };

  const openForm = (schedule) => {
    setSelectedSchedule(schedule);
    setIsFormVisible(true);
  };

  const closeForm = () => {
    setIsFormVisible(false);
    setSelectedSchedule(null);
  };

  const handleSearchChange = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    const filteredSchedules = Object.values(scheduleData)
      .flat()
      .filter(
        (schedule) =>
          schedule.component.toLowerCase().includes(query) ||
          schedule.customer.toLowerCase().includes(query) ||
          schedule.grade.toLowerCase().includes(query)
      );
    setFilteredData(filteredSchedules);
  };

  useEffect(() => {
    fetchSchedulesByMonth();
  }, [selectedYear, selectedMonth]);

  return (
    <div className={`flex min-h-screen ${darkMode ? 'dark' : ''}`}>
      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full transition-all duration-300 ${
          isSidebarVisible ? "w-64" : "w-0 overflow-hidden"
        } bg-gray-800 text-white`}
        style={{ zIndex: 999 }}
      >
        {isSidebarVisible && <Sidebar isVisible={isSidebarVisible} toggleSidebar={toggleSidebar} />}
      </div>

      {/* Main Content */}
      <div
        className={`flex flex-col flex-grow transition-all duration-300 ${
          isSidebarVisible ? "ml-64" : "ml-0"
        } bg-gray-100 dark:bg-gray-900`}
      >
        <DashboardHeader 
          isSidebarVisible={isSidebarVisible} 
          toggleSidebar={toggleSidebar} 
          title={pageTitle}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
        />

        {/* Main Content */}
        <main className="flex flex-col mt-16  flex-grow p-2">
          {/* Filters */}
          <div className={`flex items-center justify-between mb-4 p-3 gap-2 rounded-md ${
            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'
          } border shadow-sm`}>
            {/* Year Selector */}
            <div className="flex items-center space-x-2">
              <label className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Year:</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className={`p-2 text-sm border rounded-md ${
                  darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                }`}
              >
                {Array.from({ length: 10 }, (_, index) => new Date().getFullYear() - index).map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            {/* Month Selector */}
            <div className="flex items-center space-x-2">
              <label className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Month:</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className={`p-2 text-sm border rounded-md ${
                  darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                }`}
              >
                {[
                  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
                  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
                ].map((monthName, index) => (
                  <option key={index + 1} value={index + 1}>
                    {monthName}
                  </option>
                ))}
              </select>
            </div>

            {/* Total Schedule Display */}
            <div className={`flex items-center space-x-2 px-3 py-2 rounded-md ${
              darkMode ? 'bg-gray-700' : 'bg-gray-200'
            }`}>
              <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Total Schedule:
              </span>
              <span className={`text-sm font-bold ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {(totalWeight / 1000).toFixed(2)} tonnes
              </span>
            </div>

            {/* Search Bar */}
            <div className="flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search by component, customer, or grade"
                value={searchQuery}
                onChange={handleSearchChange}
                className={`w-full p-2 text-sm border rounded-md ${
                  darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                }`}
              />
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className={`p-3 mb-4 rounded-md ${
              darkMode ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800'
            }`}>
              {errorMessage}
            </div>
          )}

          {/* Loading Indicator */}
          {loadingSuggestions && (
            <div className="flex justify-center items-center p-4">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          )}

          {/* Customer Tabs */}
          {Object.keys(scheduleData).length > 0 && (
            <div className="flex gap-1 mb-4 overflow-x-auto pb-2">
              {Object.keys(scheduleData).map((customer) => (
                <button
                  key={customer}
                  onClick={() => handleCustomerClick(customer)}
                  className={`px-3 py-2 text-sm rounded-md whitespace-nowrap ${
                    customer === activeCustomer
                      ? darkMode 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-blue-500 text-white'
                      : darkMode 
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                        : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                >
                  {customer}
                </button>
              ))}
            </div>
          )}

          {/* Table */}
          <div className={`rounded-md shadow-sm overflow-hidden mb-6 ${
            darkMode ? 'border-gray-700' : 'border-gray-300'
          } border`}>
            <div className="overflow-x-auto">
              <table className={`w-full ${
                darkMode ? 'bg-gray-800 text-gray-200' : 'bg-white text-gray-800'
              }`}>
                <thead>
                  <tr className={darkMode ? 'bg-gray-700' : 'bg-gray-100'}>
                    {[
                      'Component',
                      'Customer',
                      'Grade',
                      'Dia',
                      'Slug Weight',
                      'Total Schedule',
                      'Planned',
                      'Dispatched',
                      'Balance',
                      'Weight',
                      'Action'
                    ].map((header) => (
                      <th 
                        key={header} 
                        className={`p-3 text-left text-sm font-medium ${
                          darkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredData.length > 0 ? (
                    filteredData.map((schedule, index) => (
                      <tr
                        key={index}
                        className={`${
                          darkMode 
                            ? index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-700' 
                            : index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                        } hover:${darkMode ? 'bg-gray-600' : 'bg-gray-100'}`}
                      >
                        <td className="p-3 border-t border-gray-200 dark:border-gray-700">{schedule.component}</td>
                        <td className="p-3 border-t border-gray-200 dark:border-gray-700">{schedule.customer}</td>
                        <td className="p-3 border-t border-gray-200 dark:border-gray-700">{schedule.grade}</td>
                        <td className="p-3 border-t border-gray-200 dark:border-gray-700">{schedule.dia}</td>
                        <td className="p-3 border-t border-gray-200 dark:border-gray-700">{schedule.slug_weight} kg</td>
                        <td className="p-3 border-t border-gray-200 dark:border-gray-700">{schedule.total_schedule_pices}</td>
                        <td className={`p-3 border-t border-gray-200 dark:border-gray-700 ${
                          schedule.blockmt_pices >= schedule.total_schedule_pices
                            ? darkMode ? 'bg-yellow-800' : 'bg-yellow-100'
                            : ''
                        }`}>
                          {schedule.blockmt_pices}
                        </td>
                        <td className={`p-3 border-t border-gray-200 dark:border-gray-700 ${
                          schedule.dispatched >= schedule.total_schedule_pices
                            ? darkMode ? 'bg-green-800' : 'bg-green-100'
                            : ''
                        }`}>
                          {schedule.dispatched}
                        </td>
                        <td className="p-3 border-t border-gray-200 dark:border-gray-700">{schedule.balance}</td>
                        <td className="p-3 border-t border-gray-200 dark:border-gray-700">{schedule.total_schedule_weight} kg</td>
                        <td className="p-3 border-t border-gray-200 dark:border-gray-700">
                          <button 
                            onClick={() => openForm(schedule)} 
                            className={`px-2 py-1 text-xs rounded ${
                              darkMode 
                                ? 'bg-blue-600 hover:bg-blue-700' 
                                : 'bg-blue-500 hover:bg-blue-600'
                            } text-white`}
                          >
                            Plan Production
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="11" className={`p-4 text-center ${
                        darkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        No data available for the selected month and year.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Charts Section */}
          {chartData.productionByLine.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div className={`rounded-md shadow-sm p-2 ${
                darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'
              } border`}>
                <HighchartsReact
                  highcharts={Highcharts}
                  options={getChartOptions('Production Planning by Line', chartData.productionByLine, 'line')}
                />
              </div>
              <div className={`rounded-md shadow-sm p-2 ${
                darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'
              } border`}>
                <HighchartsReact
                  highcharts={Highcharts}
                  options={getChartOptions('Production Planning by Customer', chartData.productionByCustomer, 'customer')}
                />
              </div>
            </div>
          )}

          {/* Production Planning Form Modal */}
          {isFormVisible && (
            <div className="fixed inset-0 z-50 flex justify-center items-center bg-black bg-opacity-50">
              <div className={`relative rounded-lg shadow-lg w-[700px] max-h-[90vh] overflow-auto ${
                darkMode ? 'bg-gray-800' : 'bg-white'
              }`}>
                <button
                  onClick={closeForm}
                  className={`absolute top-4 right-4 z-50 text-xl ${
                    darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-black'
                  }`}
                >
                  &#x2715;
                </button>
                <BlockmtForm 
                  schedule={selectedSchedule} 
                  onClose={closeForm}
                  onSuccess={fetchSchedulesByMonth}
                  darkMode={darkMode}
                />
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Schedule;