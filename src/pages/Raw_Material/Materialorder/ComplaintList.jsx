import { useState, useEffect } from "react";
import axios from "axios";

const ComplaintList = () => {
  const [filters, setFilters] = useState({ 
    supplier: "", 
    heat: "",
    grade: "",
    component: "",
    location: "",
    ordering: "-complaint_date" 
  });
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingComplaint, setEditingComplaint] = useState(null);
  const [updateData, setUpdateData] = useState({ d8_report: null, remark: "" });
  const [pagination, setPagination] = useState({
    count: 0,
    next: null,
    previous: null,
    currentPage: 1,
    totalPages: 1,
    pageSize: 20 // You can adjust this
  });

  const fetchComplaints = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        ...filters,
        page: page,
        page_size: pagination.pageSize
      }).toString();
      
      const response = await axios.get(`http://192.168.1.199:8001/raw_material/complaints/?${params}`);
      
      setComplaints(response.data.results);
      
      setPagination(prev => ({
        ...prev,
        count: response.data.count,
        next: response.data.next,
        previous: response.data.previous,
        currentPage: page,
        totalPages: Math.ceil(response.data.count / pagination.pageSize)
      }));
    } catch (error) {
      console.error("Error fetching complaints", error);
    }
    setLoading(false);
  };
  const truncateText = (text, wordLimit = 7) => {
    if (!text) return '';
    const words = text.trim().split(/\s+/); // handles multiple spaces
    if (words.length <= wordLimit) return text;
    return words.slice(0, wordLimit).join(' ') + '...';
  };

  useEffect(() => {
    fetchComplaints(1);
  }, [filters]);

  const handleFilterChange = (e) => {
    setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= pagination.totalPages) {
      fetchComplaints(page);
    }
  };

  const handlePageInputChange = (e) => {
    const page = parseInt(e.target.value);
    if (!isNaN(page) && page >= 1 && page <= pagination.totalPages) {
      fetchComplaints(page);
    }
  };
   // Open update form
   const handleEditClick = (complaint) => {
    setEditingComplaint(complaint);
    setUpdateData({ d8_report: complaint.d8_report, remark: complaint.remark || "" });
  };

  // Handle form input change
  const handleUpdateChange = (e) => {
    const { name, value } = e.target;
    setUpdateData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle file upload change
  const handleFileChange = (e) => {
    setUpdateData((prev) => ({ ...prev, d8_report: e.target.files[0] }));
  };

  // Submit update request
  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    
    if (!editingComplaint) return;

    const formData = new FormData();
    formData.append("remark", updateData.remark);
    if (updateData.d8_report) {
      formData.append("d8_report", updateData.d8_report);
    }

    try {
      await axios.patch(
        `http://192.168.1.199:8001/raw_material/update-complaint/${editingComplaint.id}/`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${localStorage.getItem("access_token")}`, // Assuming token is stored
          },
        }
      );

      setEditingComplaint(null);
      fetchComplaints(pagination.currentPage); // Refresh list
    } catch (error) {
      console.error("Error updating complaint", error);
    }
  };

  return (
    <div className="max-w-full mx-auto bg-white shadow rounded-lg flex flex-col" style={{ height: '80vh' }}>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 p-2 bg-gray-50 border-b">
        <div>
          <label className="block text-sm font-medium text-gray-700">Supplier</label>
          <input 
            name="supplier" 
            placeholder="Filter by Supplier" 
            className="border p-2 rounded w-full" 
            value={filters.supplier}
            onChange={handleFilterChange} 
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Heat</label>
          <input 
            name="heat" 
            placeholder="Filter by Heat" 
            className="border p-2 rounded w-full" 
            value={filters.heat}
            onChange={handleFilterChange} 
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Grade</label>
          <input 
            name="grade" 
            placeholder="Filter by Grade" 
            className="border p-2 rounded w-full" 
            value={filters.grade}
            onChange={handleFilterChange} 
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Component</label>
          <input 
            name="component" 
            placeholder="Filter by Component" 
            className="border p-2 rounded w-full" 
            value={filters.component}
            onChange={handleFilterChange} 
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Location</label>
          <input 
            name="location" 
            placeholder="Filter by Location" 
            className="border p-2 rounded w-full" 
            value={filters.location}
            onChange={handleFilterChange} 
          />
        </div>
      </div>

      {/* Table Container */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <p className="text-center">Loading...</p>
          </div>
        ) : (
            <table className="w-full border-collapse">
  <thead className="sticky top-0 bg-gray-200 z-10">
    <tr>
      <th className="border p-2 text-left">Supplier</th>
      <th className="border p-2 text-left">Heat</th>
      <th className="border p-2 text-left">Grade</th>
      <th className="border p-2 text-left">Dia</th>
      <th className="border p-2 text-left">Complaint Date</th>
      <th className="border p-2 text-left">Status</th>
      <th className="border p-2 text-left">Component</th>
      <th className="border p-2 text-left">Pieces</th>
      <th className="border p-2 text-left">Type</th>
      <th className="border p-2 text-left">Issue</th>
      <th className="border p-2 text-left">Verified By</th>
      <th className="border p-2 text-left">Attachments</th>
      <th className="border p-2">Actions</th>
    </tr>
  </thead>
  <tbody>
    {complaints.length > 0 ? (
      complaints.map((item) => (
        <tr key={item.id} className="border hover:bg-gray-50">
          <td className="p-2">{item.supplier}</td>
          <td className="p-2">{item.heat}</td>
          <td className="p-2">{item.grade}</td>
          <td className="p-2">{item.dia}</td>
          <td className="p-2">{new Date(item.complaint_date).toLocaleDateString()}</td>
          <td className="p-2">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              item.d8_report 
                ? 'bg-green-100 text-green-800' 
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {item.d8_report ? 'Closed' : 'Open'}
            </span>
          </td>
          <td className="p-2">{item.component}</td>
          <td className="p-2">{item.pices}</td>
          <td className="p-2">{item.location}</td>
          <td className="p-2 max-w-xs">
  <div className="tooltip-container">
    <span className="truncate block">
      {truncateText(item.issue)}
    </span>
    {item.issue && item.issue.split(' ').length > 12 && (
      <div className="tooltip">
        {item.issue}
      </div>
    )}
  </div>
</td>
          <td className="p-2">{item.verified_by}</td>
          <td className="p-2">
            <div className="flex space-x-2">
              {/* Complaint Photo */}
              <div className="flex flex-col items-center">
                {item.Complaint_photo ? (
                  <button
                    onClick={() => window.open(item.Complaint_photo, '_blank')}
                    className="text-blue-600 hover:text-blue-800 flex flex-col items-center text-xs"
                    title="View Complaint Photo"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>Photo</span>
                  </button>
                ) : (
                  <span className="text-gray-400 text-xs flex flex-col items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>No Photo</span>
                  </span>
                )}
              </div>

              {/* 8D Report */}
              <div className="flex flex-col items-center">
                {item.d8_report ? (
                  <button
                    onClick={() => window.open(item.d8_report, '_blank')}
                    className="text-green-600 hover:text-green-800 flex flex-col items-center text-xs"
                    title="View 8D Report"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>8D Report</span>
                  </button>
                ) : (
                  <span className="text-gray-400 text-xs flex flex-col items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>No 8D</span>
                  </span>
                )}
              </div>
            </div>
          </td>
          <td className="p-2">
            {!item.d8_report && (
              <button 
                onClick={() => handleEditClick(item)}
                className="text-blue-600 hover:text-blue-800 flex items-center justify-center"
                title="Update Complaint"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            )}
          </td>
        </tr>
      ))
    ) : (
      <tr>
        <td colSpan="11" className="text-center p-4">No complaints found</td>
      </tr>
    )}
  </tbody>
</table>
        )}
      </div>
      {/* Update Form */}
      {editingComplaint && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-1/3">
            <h3 className="text-lg font-bold mb-4">Update Complaint</h3>
            <form onSubmit={handleUpdateSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">8D Report</label>
                <input 
                  type="file" 
                  onChange={handleFileChange} 
                  className="border p-2 rounded w-full"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Remark</label>
                <textarea 
                  name="remark" 
                  value={updateData.remark}
                  onChange={handleUpdateChange} 
                  className="border p-2 rounded w-full"
                  placeholder="Enter remark (optional)"
                />
              </div>

              <div className="flex justify-end space-x-2">
                <button 
                  type="button" 
                  onClick={() => setEditingComplaint(null)}
                  className="px-4 py-2 bg-gray-400 text-white rounded"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-blue-600 text-white rounded"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-between p-4 border-t bg-gray-50">
        <div className="text-sm text-gray-700">
          Showing <span className="font-medium">{(pagination.currentPage - 1) * pagination.pageSize + 1}</span> to{' '}
          <span className="font-medium">
            {Math.min(pagination.currentPage * pagination.pageSize, pagination.count)}
          </span>{' '}
          of <span className="font-medium">{pagination.count}</span> results
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handlePageChange(1)}
            disabled={pagination.currentPage === 1}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            First
          </button>
          <button
            onClick={() => handlePageChange(pagination.currentPage - 1)}
            disabled={!pagination.previous}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Previous
          </button>
          
          <div className="flex items-center">
            <span>Page</span>
            <input
              type="number"
              min="1"
              max={pagination.totalPages}
              value={pagination.currentPage}
              onChange={handlePageInputChange}
              className="w-16 mx-2 p-1 border rounded text-center"
            />
            <span>of {pagination.totalPages}</span>
          </div>
          
          <button
            onClick={() => handlePageChange(pagination.currentPage + 1)}
            disabled={!pagination.next}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Next
          </button>
          <button
            onClick={() => handlePageChange(pagination.totalPages)}
            disabled={pagination.currentPage === pagination.totalPages}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Last
          </button>
        </div>
      </div>
    </div>
  );
};

export default ComplaintList;