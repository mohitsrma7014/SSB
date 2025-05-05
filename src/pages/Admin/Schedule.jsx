import React, { useState, useEffect } from 'react';
import { Sidebar } from "../Navigation/Sidebar";
import DashboardHeader from "../Navigation/DashboardHeader";
import BlockmtForm from './Components/BlockmtForm1';

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

  const toggleSidebar = () => {
    setIsSidebarVisible(!isSidebarVisible);
  };
  const pageTitle = "Customer Schedule  & Production Planning"; // Set the page title here

  const fetchSchedulesByMonth = () => {
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
          return;
        }

        const newScheduleData = data.reduce((acc, schedule) => {
          if (!acc[schedule.customer]) acc[schedule.customer] = [];
          acc[schedule.customer].push(schedule);
          return acc;
        }, {});
        setScheduleData(newScheduleData);
        const firstCustomer = Object.keys(newScheduleData)[0];
        setActiveCustomer(firstCustomer);
        setFilteredData(newScheduleData[firstCustomer]);
        setErrorMessage('');
      })
      .catch(() => {
        setScheduleData({});
        setFilteredData([]);
        setErrorMessage('Error fetching data. Please try again later.');
      });
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
    <div className="flex">
    {/* Sidebar */}
    <div
      className={`fixed top-0 left-0 h-full transition-all duration-300 ${
        isSidebarVisible ? "w-64" : "w-0 overflow-hidden"
      }`}
      style={{ zIndex: 999 }}
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
   
<div className="max-w-full flex items-center justify-between mb-2 p-2 gap-2 bg-white border border-gray-300 rounded-md">
  {/* Year Selector */}
  <div className="flex items-center space-x-1">
    
    <select
      value={selectedYear}
      onChange={(e) => setSelectedYear(parseInt(e.target.value))}
      className="p-2 border border-gray-300 rounded-md bg-white"
    >
      {Array.from({ length: 10 }, (_, index) => new Date().getFullYear() - index).map((year) => (
        <option key={year} value={year}>
          {year}
        </option>
      ))}
    </select>
  </div>

  {/* Month Selector */}
  <div className="flex items-center space-x-1">
  <select
    value={selectedMonth}
    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
    className="p-2 border border-gray-300 rounded-md bg-white"
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


  {/* Search Bar */}
  <div className="flex-1">
    <input
      type="text"
      placeholder="Search by component, customer, or grade"
      value={searchQuery}
      onChange={handleSearchChange}
      className="w-full p-2 border border-gray-300 rounded-md"
    />
  </div>
</div>


      {/* Error Message */}
      {errorMessage && (
        <div className="text-red-500 font-medium mb-2">{errorMessage}</div>
      )}

      {/* Customer Buttons */}
      <div className="flex gap-2 mb-2">
        {Object.keys(scheduleData).map((customer) => (
          <button
            key={customer}
            onClick={() => handleCustomerClick(customer)}
            className={`px-4 py-2 rounded-md ${
              customer === activeCustomer
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            {customer}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-y-auto max-h-[calc(100vh-200px)]">
      <table className="w-full bg-white border border-gray-300 rounded-md">
        <thead className="sticky top-0 bg-gray-200 z-10">
          <tr className="bg-gray-200">
            {[
              'Component',
              'Customer',
              'Grade',
              'Dia',
              'Slug Weight',
              'Total Schedule Pieces',
              'Planned Pieces',
              'Dispatched',
              'Balance',
              'Weight',
              'Action'
            ].map((header) => (
              <th key={header} className="text-center p-2 border-b border-gray-300">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className='text-center'>
          {filteredData.length > 0 ? (
            filteredData.map((schedule, index) => (
              <tr
                key={index}
                className={`${
                  index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                } hover:bg-gray-100`}
              >
                <td className=" border-b">{schedule.component}</td>
                <td className=" border-b">{schedule.customer}</td>
                <td className=" border-b">{schedule.grade}</td>
                <td className=" border-b">{schedule.dia}</td>
                <td className="border-b">{schedule.slug_weight} kg</td>
                <td className=" border-b">{schedule.total_schedule_pices}</td>
                <td
                  className={` border-b ${
                    schedule.blockmt_pices >= schedule.total_schedule_pices
                      ? 'bg-orange-200'
                      : ''
                  }`}
                >
                  {schedule.blockmt_pices}
                </td>
                <td
                  className={` border-b ${
                    schedule.dispatched >= schedule.total_schedule_pices
                      ? 'bg-green-200'
                      : ''
                  }`}
                >
                  {schedule.dispatched}
                </td>
                <td className=" border-b">{schedule.balance}</td>
                <td className=" border-b">{schedule.total_schedule_weight} kg</td>
                
                <td>
                <button onClick={() => openForm(schedule)} className={`px-1 py-1 rounded-md bg-blue-500 text-white `}>Production Planning</button>
              </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="11" className="p-2 text-center">
                No data available for the selected month and year.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      </div>
      {isFormVisible && (
      <div className="fixed inset-0 z-50 flex justify-center items-center bg-black bg-opacity-50">
        {/* Form Container */}
        <div className="relative bg-white rounded-lg shadow-lg w-[700px] h-[400px]">
          {/* Close Button */}
          <button
            onClick={closeForm}
            className="absolute  right-4 z-50 text-black text-2xl hover:text-gray-700"
          >
            &#x2715;
          </button>
          {/* Form Component */}
          <BlockmtForm 
  schedule={selectedSchedule} 
  onClose={closeForm}
  onSuccess={fetchSchedulesByMonth} // Add this prop
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
