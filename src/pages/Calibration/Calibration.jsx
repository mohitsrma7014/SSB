import React, { useState, useEffect, useCallback, useMemo } from "react";
import api from "../../api";
import { toast } from "react-toastify";
import "tailwindcss/tailwind.css";
import ComplaintForm from "./CalibrationForm";
import Notification from "./Notification";
import EditComplaintForm from "./EditcalibrationForm";
import ComplaintHistory from "./CalibrationHistory";
import { Sidebar } from "../Navigation/Sidebar";
import DashboardHeader from "../Navigation/DashboardHeader";

const API_URL = "http://192.168.1.199:8001/calibration/api/complaints/";

const Calibration = () => {
  const [complaints, setComplaints] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  const [nextPageUrl, setNextPageUrl] = useState(null);
  const [previousPageUrl, setPreviousPageUrl] = useState(null);
  const [manualPageInput, setManualPageInput] = useState("");
  const [filters, setFilters] = useState({
    uid: "",
    name_of_instrument: "",
    catagory: "",
    department: "",
    supplier: "",
    CALIBRATION_AGENCY: "",
    LOCATION: "",
  });

  const toggleSidebar = useCallback(() => {
    setIsSidebarVisible((prev) => !prev);
  }, []);

  const fetchComplaints = useCallback(async (url = API_URL, additionalParams = {}) => {
    try {
      const response = await api.get(url, {
        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
        params: {
          page: currentPage,
          page_size: pageSize,
          ...filters, // Always include current filters
          ...additionalParams, // Include any additional params passed
        },
      });
  
      const { results, count, next, previous } = response.data;
      const sortedData = results.sort((a, b) => new Date(b.po_date) - new Date(a.po_date));
      const openComplaints = sortedData.filter((c) => c.completion_status !== "closed");
      const closedComplaints = sortedData.filter((c) => c.completion_status === "closed");
  
      const finalData = [...openComplaints, ...closedComplaints];
  
      setComplaints(finalData);
      setTotalCount(count);
      setNextPageUrl(next);
      setPreviousPageUrl(previous);
    } catch (error) {
      toast.error("Error fetching complaints");
    }
  }, [currentPage, pageSize, filters]); // Add filters to dependencies

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  const handleFilterChange = useCallback(
    (e) => {
      const { name, value } = e.target;
      setFilters((prevFilters) => ({ ...prevFilters, [name]: value }));
    },
    []
  );

  const handleFetchWithFilters = useCallback(() => {
    fetchComplaints(API_URL, filters); // Fetch data with filters
  }, [fetchComplaints, filters]);

  const handleManualPageInput = useCallback((e) => {
    setManualPageInput(e.target.value);
  }, []);

  const handleGoToPage = useCallback(() => {
    const page = parseInt(manualPageInput, 10);
    if (page >= 1 && page <= Math.ceil(totalCount / pageSize)) {
      setCurrentPage(page);
    } else {
      toast.error("Invalid page number");
    }
  }, [manualPageInput, totalCount, pageSize]);

  const handlePageChange = useCallback((newPage) => {
    setCurrentPage(newPage);
  }, []);

  const handleEditClick = (complaint) => {
    setSelectedComplaint(complaint);
    setIsEditFormOpen(true);
  };

  const handleHistoryClick = (complaint) => {
    setSelectedComplaint(complaint);
    setIsHistoryOpen(true);
  };

  const handlePageSizeChange = useCallback((newSize) => {
    setPageSize(newSize);
    setCurrentPage(1); // Reset to first page when page size changes
  }, []);

  const totalPages = Math.ceil(totalCount / pageSize);

  const renderPaginationButtons = () => {
    const buttons = [];
    const showEllipsis = totalPages > 5;

    // Always show the first 2 pages
    for (let i = 1; i <= 2; i++) {
      buttons.push(
        <button
          key={i}
          className={`px-3 py-1 rounded-md ${
            currentPage === i ? "bg-blue-500 text-white" : "bg-gray-200 hover:bg-gray-300"
          }`}
          onClick={() => handlePageChange(i)}
        >
          {i}
        </button>
      );
    }

    // Show ellipsis if there are more than 5 pages
    if (showEllipsis) {
      buttons.push(<span key="ellipsis-start">...</span>);
    }

    // Show current page and surrounding pages
    if (currentPage > 2 && currentPage < totalPages - 1) {
      buttons.push(
        <button
          key={currentPage}
          className="px-3 py-1 bg-blue-500 text-white rounded-md"
        >
          {currentPage}
        </button>
      );
    }

    // Show ellipsis if there are more than 5 pages
    if (showEllipsis) {
      buttons.push(<span key="ellipsis-end">...</span>);
    }

    // Always show the last 2 pages
    for (let i = totalPages - 1; i <= totalPages; i++) {
      if (i > 2) {
        buttons.push(
          <button
            key={i}
            className={`px-3 py-1 rounded-md ${
              currentPage === i ? "bg-blue-500 text-white" : "bg-gray-200 hover:bg-gray-300"
            }`}
            onClick={() => handlePageChange(i)}
          >
            {i}
          </button>
        );
      }
    }

    return buttons;
  };

  const memoizedFilterInputs = useMemo(() => {
    return Object.keys(filters).map((filterKey) => (
      <div key={filterKey} className="relative flex flex-col gap-2">
        <div className="relative">
          <input
            name={filterKey}
            value={filters[filterKey]}
            onChange={handleFilterChange}
            className="border p-2 rounded-md shadow-sm text-sm"
            placeholder={`Filter by ${filterKey.replace("_", " ")}`}
            autoComplete="off"
          />
          {filters[filterKey] && (
            <button
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 text-sm"
              onClick={() => {
                setFilters((prevFilters) => ({ ...prevFilters, [filterKey]: "" }));
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>
    ));
  }, [filters, handleFilterChange]);

  return (
    <div className="flex">
      <div className={`fixed top-0 left-0 h-full transition-all duration-300 ${isSidebarVisible ? "w-64" : "w-0 overflow-hidden"}`}>
        {isSidebarVisible && <Sidebar isVisible={isSidebarVisible} toggleSidebar={toggleSidebar} style={{ zIndex: 999 }}  />}
      </div>

      <div className={`flex flex-col flex-grow transition-all duration-300 ${isSidebarVisible ? "ml-64" : "ml-0"}`}>
        <DashboardHeader isSidebarVisible={isSidebarVisible} toggleSidebar={toggleSidebar} title="Calibration Details" />

        <main className="flex flex-col mt-20 justify-center flex-grow pl-2">
          <div className="flex justify-between items-center w-full z-50">
            <div className="left-2">
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded-md shadow hover:bg-blue-700"
                onClick={() => setIsFormOpen(true)}
              >
                + Add Instrument
              </button>
            </div>
            <div className="px-7">
              <Notification complaints={complaints} />
            </div>
          </div>

          {isFormOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
              <div className="bg-white rounded-lg shadow-lg w-full max-w-5xl">
                <ComplaintForm onClose={() => setIsFormOpen(false)} onSuccess={fetchComplaints} />
              </div>
            </div>
          )}

          {isEditFormOpen && selectedComplaint && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
              <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-lg">
                <EditComplaintForm complaint={selectedComplaint} onClose={() => setIsEditFormOpen(false)} onSuccess={fetchComplaints} />
              </div>
            </div>
          )}

          {isHistoryOpen && selectedComplaint && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
              <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-lg">
                <ComplaintHistory complaint={selectedComplaint} onClose={() => setIsHistoryOpen(false)} />
              </div>
            </div>
          )}

          <div className="flex flex-wrap justify-between items-center w-full p-2">
            {memoizedFilterInputs}
            <button
              className="bg-blue-500 text-white px-4 py-2 rounded-md shadow hover:bg-blue-600"
              onClick={handleFetchWithFilters}
            >
              Fetch
            </button>
          </div>

          <div className="overflow-y-auto max-h-[calc(100vh-130px)]">
            <table className="w-full bg-white border border-gray-300 rounded-md">
              <thead className="sticky top-0 bg-gray-200 z-10">
                <tr className="bg-gray-200 text-xs">
                  <th className="px-2 py-1 text-center w-24">Po Date</th>
                  <th className="px-2 py-1 text-center w-8">UID</th>
                  <th className="px-2 py-1 text-center w-32">Serial Number</th>
                  <th className="px-2 py-1 text-center w-40">Instrument</th>
                  <th className="px-2 py-1 text-center w-24">Category</th>
                  <th className="px-2 py-1 text-center w-28">Department</th>
                  <th className="px-2 py-1 text-center w-32">Supplier</th>
                  <th className="px-2 py-1 text-center w-40">Calibration Agency</th>
                  <th className="px-2 py-1 text-center w-24">Done Date</th>
                  <th className="px-2 py-1 text-center w-24">Due Date</th>
                  <th className="px-2 py-1 text-center w-32">Location</th>
                  <th className="px-2 py-1 text-center w-28">Certificate</th>
                  <th className="px-2 py-1 text-center w-24">Status</th>
                  <th className="px-2 py-1 text-center w-32">Action</th>
                </tr>
              </thead>
              <tbody>
                {complaints.map((complaint) => (
                  <tr key={complaint.id} className="border-t text-[12px]">
                    <td className="px-2 py-2 text-center w-24">{complaint.po_date}</td>
                    <td className="px-2 py-2 text-center w-8">{complaint.uid}</td>
                    <td className="px-2 py-2 text-center w-32">{complaint.serial_number}</td>
                    <td className="px-2 py-2 text-center w-40">{complaint.name_of_instrument}</td>
                    <td className="px-2 py-2 text-center w-24">{complaint.catagory}</td>
                    <td className="px-2 py-2 text-center w-28">{complaint.department}</td>
                    <td className="px-2 py-2 text-center w-32">{complaint.supplier}</td>
                    <td className="px-2 py-2 text-center w-40">{complaint.CALIBRATION_AGENCY}</td>
                    <td className="px-2 py-2 text-center w-24">{complaint.CALIBRATION_DONE_DATE}</td>
                    <td className="px-2 py-2 text-center w-24">{complaint.due_date}</td>
                    <td className="px-2 py-2 text-center w-32">{complaint.LOCATION}</td>
                    <td className="px-2 py-2 w-28">
                      {complaint.add_pdf ? (
                        <a
                          href={complaint.add_pdf}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block px-4 py-1 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition duration-200"
                        >
                          View
                        </a>
                      ) : (
                        <span className="text-gray-400 italic">No PDF</span>
                      )}
                    </td>

                    <td className={`px-2 py-2 text-center w-24 font-bold ${complaint.status === "closed" ? "text-red-500" : "text-green-500"}`}>{complaint.status}</td>
                    <td className="px-2 py-2 text-center w-32 flex justify-center gap-2">
                      <button
                        className="bg-yellow-500 text-white px-2 py-1 rounded shadow hover:bg-yellow-600 text-xs"
                        onClick={() => handleEditClick(complaint)}
                      >
                        Details
                      </button>
                      <button
                        className="bg-blue-500 text-white px-2 py-1 rounded shadow hover:bg-blue-600 text-xs"
                        onClick={() => handleHistoryClick(complaint)}
                      >
                        History
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="flex justify-between items-center mt-4 p-2">
            <div>
              <span>Total Records: {totalCount}</span>
            </div>
            <div className="flex gap-2">
              <button
                className="bg-blue-500 text-white px-4 py-2 rounded-md shadow hover:bg-blue-600"
                onClick={() => fetchComplaints(previousPageUrl)}
                disabled={!previousPageUrl}
              >
                Previous
              </button>
              {renderPaginationButtons()}
              <div className="flex gap-2">
                <input
                  type="number"
                  value={manualPageInput}
                  onChange={handleManualPageInput}
                  className="border p-2 rounded-md w-20 text-sm"
                  placeholder="Page"
                  min="1"
                  max={totalPages}
                />
                <button
                  className="bg-blue-500 text-white px-4 py-2 rounded-md shadow hover:bg-blue-600"
                  onClick={handleGoToPage}
                >
                  Go
                </button>
              </div>
              <button
                className="bg-blue-500 text-white px-4 py-2 rounded-md shadow hover:bg-blue-600"
                onClick={() => fetchComplaints(nextPageUrl)}
                disabled={!nextPageUrl}
              >
                Next
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Calibration;