import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSearchParams } from 'react-router-dom';
import { Sidebar } from "../Navigation/Sidebar";
import DashboardHeader from "../Navigation/DashboardHeader";

const TraceabilityCard = () => {
  const [searchParams] = useSearchParams();
  const urlBatch = searchParams.get('batch');
  const [batchNumber, setBatchNumber] = useState(urlBatch || '');
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    if (urlBatch) {
      setBatchNumber(urlBatch);
      fetchData(urlBatch);
    }
  }, [urlBatch]);

  const toggleSidebar = () => {
    setIsSidebarVisible(!isSidebarVisible);
  };
  const pageTitle = "Batch Traceability";

  const handleInputChange = (e) => {
    const value = e.target.value;
    setBatchNumber(value);
    handleComponentNumberChange(value);
  };

  const handleComponentNumberChange = async (value) => {
    if (value.length > 1) { 
      try {
        const response = await axios.get(
          'http://192.168.1.199:8001/raw_material/autocompleteforging/',
          { params: { block_mt_id: value } }
        );
        setSuggestions(response.data || []);
      } catch (err) {
        setSuggestions([]);
      }
    } else {
      setSuggestions([]);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setBatchNumber(suggestion);
    setSuggestions([]);
    fetchData(suggestion);
  };

  const fetchData = async (batch = batchNumber) => {
    if (!batch) {
      setError('Batch number is required.');
      return;
    }

    setLoading(true);
    setError(null);
    setData(null);

    try {
      const response = await axios.post(
        'http://192.168.1.199:8001/raw_material/api/traceability-card/', 
        { batch_number: batch }
      );
      setData(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch data. Please try again.');
      console.error('API Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderTable = (data) => {
    const locationFields = {
      'Batch Details': ['block_mt_id','component', 'customer','supplier', 'grade', 'standerd', 'heatno', 'dia', 'rack_no', 'pices', 'weight', 'created_at', 'verified_by'],
      'Isuue Details': ['batch_number', 'heatno', 'rack_no','kg_qty', 'created_at','verified_by'],
      'FORGING Details': ['date','batch_number', 'shift', 'slug_weight', 'heat_number', 'line','line_incharge','forman','production','verified_by'],
      'HEAT TREATMENT Details': ['date', 'shift','heat_no', 'process','furnace','supervisor','operator','production','cycle_time','unit','hardness','verified_by'],
      'SHOT-BLAST Details': ['date', 'shift', 'machine', 'no_of_pic','operator','verified_by'],
      'PRE MACHINING Details': ['component','date', 'heat_no', 'shop_floor', 'qty', 'verified_by'],
      
      'FINAL INSPECTION Details': ['component','date', 'shift', 'chaker', 'production','verified_by'],
      'MARKING Details': ['component','date', 'machine', 'operator', 'shift','qty','verified_by'],
      'VISUAL INSPECTION Details': ['component','date', 'shift', 'chaker','chaker1','production','verified_by'],
      'CNC Details': ['component','date', 'shift', 'operator','inspector','setup','production','verified_by'],
      'DISPATCH Details': ['block_mt_id','component', 'rack_no','date','invoiceno', 'pices', 'created_at','verified_by'],
    };
    
    const locations = [
      { location: 'Batch Details', dataKey: 'Blockmt_qs' },
      { location: 'Isuue Details', dataKey: 'batch_tracking_df' },
      { location: 'FORGING Details', dataKey: 'forging_df', totalKey: 'total_production_p' },
      { location: 'HEAT TREATMENT Details', dataKey: 'heat_treatment_df', totalKey: 'total_production_ht' },
      { location: 'SHOT-BLAST Details', dataKey: 'Shotblast_df', totalKey: 'total_production_sh' },
      { location: 'PRE MACHINING Details', dataKey: 'pre_mc_df', totalKey: 'total_production_pri' },
      { location: 'CNC Details', dataKey: 'cnc_df', totalKey: 'total_production_c' },
      
      { location: 'FINAL INSPECTION Details', dataKey: 'fi_df', totalKey: 'total_production_fi' },
      { location: 'MARKING Details', dataKey: 'marking_df', totalKey: 'total_production_mr' },
      { location: 'VISUAL INSPECTION Details', dataKey: 'visual_df', totalKey: 'total_production_v' },
      
      { location: 'DISPATCH Details', dataKey: 'dispatch_df', totalKey: 'total_dispatch_df' },
    ];

    return (
      <table className="min-w-full bg-white shadow-md rounded-lg overflow-hidden mx-auto">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Location</th>
            <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Description</th>
            <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Total Production</th>
          </tr>
        </thead>
        <tbody className="text-sm">
          {locations.map((loc) => {
            const locationData = data[loc.dataKey] || [];
            const totalProduction = data[loc.totalKey] || 'No data available';
            const fieldsForLocation = locationFields[loc.location] || [];
  
            return (
              <tr key={loc.location}>
                <td className="px-4 py-2 font-medium text-gray-700 border-b-4 border-gray-800">{loc.location}</td>
                <td className="px-4 py-2 border-l-4 border-gray-800">
                  {locationData.length > 0 ? (
                    <div className="grid grid-cols-3 gap-4 border-gray-300">
                      {locationData.map((item, index) => (
                        <div key={index} className="border-2 border-gray-200 pl-4">
                          {fieldsForLocation.map((field) => {
                            if (item[field]) {
                              return (
                                <div key={field} className="text-gray-700">
                                  <strong>{field.replace(/_/g, ' ')}:</strong> {item[field]}
                                </div>
                              );
                            }
                            return null;
                          })}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-700">No data available</p>
                  )}
                </td>
                <td className="px-4 py-2 font-medium text-gray-700 border-b-4 border-gray-800">
                  <p className="text-gray-700">{totalProduction}</p>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
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
          <div className="w-full max-w-full bg-white shadow-lg rounded-lg p-6 transition-all duration-300 transform">
            <h1 className="text-3xl font-semibold text-center mb-4 text-gray-800">Traceability Card For Batch</h1>

            <div className="mb-4 relative">
              <label htmlFor="batchNumber" className="block text-sm font-medium text-gray-700">Batch Number:</label>
              
              <input
                type="text"
                id="batchNumber"
                value={batchNumber}
                onChange={handleInputChange}
                placeholder="Enter Batch Id"
                className="w-full border p-2 rounded"
              />
              {suggestions.length > 0 && (
                <ul className="absolute z-10 bg-white border w-full mt-1 max-h-40 overflow-y-auto shadow-lg">
                  {suggestions.map((suggestion, index) => (
                    <li
                      key={index}
                      className="p-2 hover:bg-gray-200 cursor-pointer"
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      {suggestion}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="text-center">
              <button
                onClick={() => fetchData()}
                disabled={loading}
                className="w-full py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition duration-300"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Loading...
                  </>
                ) : 'Fetch Data'}
              </button>
            </div>

            {error && <p className="mt-4 text-red-500 text-center">{error}</p>}

            {data && (
              <div className="mt-6" style={{ width: '100%', overflowX: 'auto' }}>
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                  Results for Batch: {batchNumber}
                </h2>
                <div style={{ maxWidth: '100%' }}>
                  {renderTable(data)}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default TraceabilityCard;