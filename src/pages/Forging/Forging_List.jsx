import React, { useState, useEffect } from "react";
import axios from "axios";
import ForgingForm from "./Forging_Edits";
import { debounce } from "lodash";
import { Sidebar } from "../Navigation/Sidebar";
import DashboardHeader from "../Navigation/DashboardHeader";

const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-full">
    <div className="spinner-border animate-spin inline-block w-12 h-12 border-4 border-solid border-blue-600 border-t-transparent rounded-full" role="status">
      <span className="sr-only">Loading...</span>
    </div>
  </div>
);

const Forging_List = () => {
  const [forgings, setForgings] = useState([]);
  const [editing, setEditing] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    date: "",
    batch_number: "",
    shift: "",
    component: "",
    verified_by: "",
  });

  const [isSidebarVisible, setIsSidebarVisible] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarVisible(!isSidebarVisible);
  };
  const pageTitle = "Forging Data Managment"; // Set the page title here

  const fetchForgings = async (page = 1, size = 10) => {
    try {
      setLoading(true);
      const params = {
        page,
        page_size: size,
        ...filters,
      };
      const response = await axios.get("http://192.168.1.199:8001/forging/ForgingViewSet1/", { params });
      console.log(response.data); // Log the response to inspect its structure
      setForgings(response.data.results || []); // Fallback to an empty array if results is undefined
    } catch (error) {
      console.error("Error fetching forgings:", error);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchForgings(currentPage, pageSize);
  }, [currentPage, pageSize, filters]);

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handlePageSizeChange = (e) => {
    setPageSize(Number(e.target.value));
    setCurrentPage(1);
  };

  const deleteForging = async (id) => {
    try {
      await axios.delete(`http://192.168.1.199:8001/forging/ForgingViewSet1/${id}/`);
      fetchForgings(currentPage, pageSize);
    } catch (error) {
      console.error("Error deleting the record:", error);
    }
  };

  const startEditing = (forging) => {
    setEditing(forging);
  };

  const resetEditing = () => {
    setEditing(null);
    fetchForgings(currentPage, pageSize);
  };

  const handleFilterChange = debounce((e) => {
    const { name, value } = e.target;
    setFilters((prevFilters) => ({
      ...prevFilters,
      [name]: value,
    }));
  }, 300);

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
        

      {/* Filter Section */}
      <div className="mb-6">
        <div className="flex space-x-4">
          <input
            type="text"
            name="date"
            placeholder="Filter by Date"
            onChange={handleFilterChange}
            className="w-1/5 p-2 border border-gray-300 rounded-md"
          />
          <input
            type="text"
            name="batch_number"
            placeholder="Filter by Batch Number"
            onChange={handleFilterChange}
            className="w-1/5 p-2 border border-gray-300 rounded-md"
          />
          <input
            type="text"
            name="shift"
            placeholder="Filter by shift"
            onChange={handleFilterChange}
            className="w-1/5 p-2 border border-gray-300 rounded-md"
          />
          <input
            type="text"
            name="component"
            placeholder="Filter by Component"
            onChange={handleFilterChange}
            className="w-1/5 p-2 border border-gray-300 rounded-md"
          />
          <input
            type="text"
            name="verified_by"
            placeholder="Filter by Verified By"
            onChange={handleFilterChange}
            className="w-1/5 p-2 border border-gray-300 rounded-md"
          />
        </div>
      </div>

      {/* Loading Indicator */}
      {loading ? (
        <LoadingSpinner />
      ) : (
        // Table Section
        <div>
          <table className="min-w-full table-auto border-collapse border border-gray-300">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-left font-medium text-gray-700">ID</th>
                <th className="p-3 text-left font-medium text-gray-700">Date</th>
                <th className="p-3 text-left font-medium text-gray-700">Shift</th>
                <th className="p-3 text-left font-medium text-gray-700">Batch Number</th>
                <th className="p-3 text-left font-medium text-gray-700">Component</th>
                <th className="p-3 text-left font-medium text-gray-700">Verified By</th>
                <th className="p-3 text-left font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {forgings.map((forging) => (
                <tr key={forging.id} className="border-t border-gray-200">
                  <td className="p-3">{forging.id}</td>
                  <td className="p-3">{forging.date}</td>
                  <td className="p-3">{forging.shift}</td>
                  <td className="p-3">{forging.batch_number}</td>
                  <td className="p-3">{forging.component}</td>
                  <td className="p-3">{forging.verified_by}</td>
                  <td className="p-3">
                    <button
                      onClick={() => startEditing(forging)}
                      className="bg-yellow-500 text-white py-1 px-3 rounded hover:bg-yellow-600 mr-2"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteForging(forging.id)}
                      className="bg-red-500 text-white py-1 px-3 rounded hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Conditional rendering of ForgingForm */}
      {editing !== null && (
        <ForgingForm forging={editing} onClose={resetEditing} />
      )}

      {/* Pagination Controls */}
      <div className="flex justify-between items-center mt-4">
        <div>
          <select value={pageSize} onChange={handlePageSizeChange}>
            <option value={10}>10 per page</option>
            <option value={20}>20 per page</option>
            <option value={50}>50 per page</option>
          </select>
        </div>
        <div>
          <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
            Previous
          </button>
          <span className="mx-4">Page {currentPage}</span>
          <button onClick={() => handlePageChange(currentPage + 1)}>
            Next
          </button>
        </div>
      </div>
      </main>
      </div>
    </div>
  );
};

export default Forging_List;