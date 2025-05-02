import React, { useState, useEffect } from 'react';
import { Bar, Pie, Line } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';

Chart.register(...registerables);

const AnalyticsPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [filter, setFilter] = useState('customer'); // 'customer', 'location', 'component'

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const month = selectedDate.getMonth() + 1;
      const year = selectedDate.getFullYear();
      const response = await fetch(`/api/dispatch-analytics/?month=${month}&year=${year}`);
      const result = await response.json();
      
      if (response.ok) {
        setData(result);
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

  const exportToExcel = () => {
    if (!data) return;
    
    const worksheet = XLSX.utils.json_to_sheet(data.data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Dispatch Analytics");
    XLSX.writeFile(workbook, `dispatch_analytics_${selectedDate.getFullYear()}_${selectedDate.getMonth() + 1}.xlsx`);
  };

  const exportToPDF = () => {
    // This would require a PDF generation library or API call to generate PDF
    alert('PDF export would be implemented with a proper PDF generation library');
  };

  const prepareChartData = (groupBy) => {
    if (!data) return { labels: [], datasets: [] };

    const groupedData = data.data.reduce((acc, item) => {
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
    const piecesData = labels.map(label => groupedData[label].pieces);
    const tonnageData = labels.map(label => groupedData[label].tonnage);
    const valueData = labels.map(label => groupedData[label].value);

    return {
      labels,
      datasets: [
        {
          label: 'Pieces',
          data: piecesData,
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1,
        },
        {
          label: 'Tonnage (tonnes)',
          data: tonnageData,
          backgroundColor: 'rgba(255, 99, 132, 0.6)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1,
        },
        {
          label: 'Value (₹)',
          data: valueData,
          backgroundColor: 'rgba(75, 192, 192, 0.6)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1,
        }
      ]
    };
  };

  const prepareDailyTrendData = () => {
    if (!data) return { labels: [], datasets: [] };

    const dailyData = data.data.reduce((acc, item) => {
      const date = item.date;
      if (!acc[date]) {
        acc[date] = { pieces: 0, tonnage: 0 };
      }
      acc[date].pieces += item.pieces;
      acc[date].tonnage += item.tonnage;
      return acc;
    }, {});

    const labels = Object.keys(dailyData).sort();
    const piecesData = labels.map(date => dailyData[date].pieces);
    const tonnageData = labels.map(date => dailyData[date].tonnage);

    return {
      labels,
      datasets: [
        {
          label: 'Daily Pieces',
          data: piecesData,
          borderColor: 'rgba(54, 162, 235, 1)',
          backgroundColor: 'rgba(54, 162, 235, 0.1)',
          tension: 0.1,
          yAxisID: 'y',
        },
        {
          label: 'Daily Tonnage (tonnes)',
          data: tonnageData,
          borderColor: 'rgba(255, 99, 132, 1)',
          backgroundColor: 'rgba(255, 99, 132, 0.1)',
          tension: 0.1,
          yAxisID: 'y1',
        }
      ]
    };
  };

  const prepareComponentAnalysis = () => {
    if (!data) return { labels: [], datasets: [] };

    const componentData = data.data.reduce((acc, item) => {
      const key = item.component;
      if (!acc[key]) {
        acc[key] = { pieces: 0, tonnage: 0, slugWeight: item.slug_weight };
      }
      acc[key].pieces += item.pieces;
      acc[key].tonnage += item.tonnage;
      return acc;
    }, {});

    const labels = Object.keys(componentData);
    const efficiencyData = labels.map(component => {
      const item = componentData[component];
      return (item.tonnage * 1000) / (item.pieces * item.slugWeight); // Efficiency metric
    });

    return {
      labels,
      datasets: [
        {
          label: 'Production Efficiency',
          data: efficiencyData,
          backgroundColor: labels.map((_, i) => 
            `hsl(${i * 360 / labels.length}, 70%, 50%)`
          ),
        }
      ]
    };
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Dispatch Analytics</h1>
        <div className="flex items-center space-x-4">
          <DatePicker
            selected={selectedDate}
            onChange={date => setSelectedDate(date)}
            dateFormat="MM/yyyy"
            showMonthYearPicker
            className="border rounded px-3 py-2"
          />
          <button 
            onClick={fetchData}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {data && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-500">Total Dispatches</h3>
              <p className="text-3xl font-bold">{data.summary.dispatch_count}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-500">Total Pieces</h3>
              <p className="text-3xl font-bold">{data.summary.total_pieces.toLocaleString()}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-500">Total Tonnage</h3>
              <p className="text-3xl font-bold">{data.summary.total_tonnage.toFixed(2)} tonnes</p>
            </div>
          </div>

          {/* Filter Controls */}
          <div className="mb-6 flex space-x-4">
            <button
              onClick={() => setFilter('customer')}
              className={`px-4 py-2 rounded ${filter === 'customer' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            >
              By Customer
            </button>
            <button
              onClick={() => setFilter('location')}
              className={`px-4 py-2 rounded ${filter === 'location' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            >
              By Location
            </button>
            <button
              onClick={() => setFilter('component')}
              className={`px-4 py-2 rounded ${filter === 'component' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            >
              By Component
            </button>
          </div>

          {/* Main Bar Chart */}
          <div className="bg-white p-6 rounded-lg shadow mb-8">
            <h2 className="text-xl font-semibold mb-4">{`Dispatch by ${filter.charAt(0).toUpperCase() + filter.slice(1)}`}</h2>
            <div className="h-96">
              <Bar
                data={prepareChartData(filter)}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true,
                      title: {
                        display: true,
                        text: 'Pieces/Value'
                      }
                    },
                    y1: {
                      beginAtZero: true,
                      position: 'right',
                      title: {
                        display: true,
                        text: 'Tonnage (tonnes)'
                      },
                      grid: {
                        drawOnChartArea: false,
                      },
                    }
                  }
                }}
              />
            </div>
          </div>

          {/* Two-column layout for other charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Daily Trend Chart */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Daily Dispatch Trend</h2>
              <div className="h-80">
                <Line
                  data={prepareDailyTrendData()}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                          display: true,
                          text: 'Pieces'
                        }
                      },
                      y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                          display: true,
                          text: 'Tonnage (tonnes)'
                        },
                        grid: {
                          drawOnChartArea: false,
                        },
                      }
                    }
                  }}
                />
              </div>
            </div>

            {/* Component Efficiency */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Component Efficiency Analysis</h2>
              <div className="h-80">
                <Pie
                  data={prepareComponentAnalysis()}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      tooltip: {
                        callbacks: {
                          label: function(context) {
                            return `${context.label}: ${context.raw.toFixed(2)}% efficiency`;
                          }
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>
          </div>

          {/* Customer-Location Matrix */}
          <div className="bg-white p-6 rounded-lg shadow mb-8">
            <h2 className="text-xl font-semibold mb-4">Customer-Location Matrix</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pieces</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tonnage</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Value</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {Object.entries(
                    data.data.reduce((acc, item) => {
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
                    <tr key={key}>
                      <td className="px-6 py-4 whitespace-nowrap">{row.customer}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{row.location}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{row.pieces.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{row.tonnage.toFixed(2)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">₹{row.value.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Export Buttons */}
          <div className="flex justify-end space-x-4">
            <button 
              onClick={exportToExcel}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
            >
              Export to Excel
            </button>
            <button 
              onClick={exportToPDF}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
            >
              Export to PDF
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default AnalyticsPage;