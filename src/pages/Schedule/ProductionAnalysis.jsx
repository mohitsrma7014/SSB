import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import BlockMtAnalysis from './BlockMtAnalysis';
import ScheduleAnalysis from './ScheduleAnalysis';
import ForgingAnalysis from './ForgingAnalysis';
import DateSelector from './DateSelector';
import { Sidebar } from "../Navigation/Sidebar";
import DashboardHeader from "../Navigation/DashboardHeader";

const lineCapacities = {
  'HAMMER1': 180000,
  'A-SET': 150000,
  'B-set': 150000,
  '1000 Ton': 150000,
  '1600 TON': 175000,
  'HAMMER2': 180000,
  'W-SET': 150000,
  'FFL': 150000,
  'NHF-1000': 140000,
};

export default function ProductionAnalysis() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('blockmt');
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarVisible(!isSidebarVisible);
  };
  const pageTitle = "Planning Analysis"; // Set the page title here

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `http://192.168.1.199:8001/raw_material/forging-blockmt-comparison/?month=${month}&year=${year}`
        );
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [month, year]);

  const handleDateChange = (newMonth, newYear) => {
    setMonth(newMonth);
    setYear(newYear);
    setSearchParams({ month: newMonth, year: newYear });
  };

  if (loading) return <div className="text-center py-8">Loading...</div>;
  if (error) return <div className="text-center py-8 text-red-500">Error: {error}</div>;

  return (
    <div className="flex">
      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full transition-all duration-300 ${
          isSidebarVisible ? "w-64" : "w-0 overflow-hidden"
        }`}
        style={{ zIndex: 50 }} // Add this line
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
          <div className="flex flex-col   justify-center flex-grow pl-2">
            <DateSelector month={month} year={year} onDateChange={handleDateChange} />
            
            <div className="flex border-b mb-6">
              <button
                className={`px-4 py-2 font-medium ${activeTab === 'blockmt' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
                onClick={() => setActiveTab('blockmt')}
              >
                Planning
              </button>
              <button
                className={`px-4 py-2 font-medium ${activeTab === 'schedule' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
                onClick={() => setActiveTab('schedule')}
              >
                Customer Schedules
              </button>
              <button
                className={`px-4 py-2 font-medium ${activeTab === 'forging' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
                onClick={() => setActiveTab('forging')}
              >
                Production Details
              </button>
            </div>

            {activeTab === 'blockmt' && <BlockMtAnalysis data={data?.blockmt || []} forgingData={data?.forging || []} />}
            {activeTab === 'schedule' && <ScheduleAnalysis data={data?.schedule || []} />}
            {activeTab === 'forging' && <ForgingAnalysis data={data?.forging || []} scheduleData={data?.schedule || []} lineCapacities={lineCapacities} />}
          </div>
        </main>
      </div>
    </div>
  );
}