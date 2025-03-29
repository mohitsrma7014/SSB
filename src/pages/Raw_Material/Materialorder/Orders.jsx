
import { useEffect, useState } from "react";
import axios from "axios";
import { Sidebar } from "../../Navigation/Sidebar";
import DashboardHeader from "../../Navigation/DashboardHeader";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const API_BASE_URL = "http://192.168.1.199:8001/raw_material/api/orders";

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    count: 0,
    next: null,
    previous: null,
    currentPage: 1,
    pageSize: 20
  });
  const [filters, setFilters] = useState({
    supplier: "",
    po_number: "",
    rm_grade: "",
    bar_dia: ""
  });
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const navigate = useNavigate();
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarVisible(!isSidebarVisible);
  };

  const fetchOrders = async (page = 1, pageSize = 20, filterParams = {}) => {
    setLoading(true);
    try {
      const params = {
        page,
        page_size: pageSize,
        ...filterParams
      };
      
      const response = await axios.get(`${API_BASE_URL}/`, { params });
      setOrders(response.data.results);
      setPagination({
        count: response.data.count,
        next: response.data.next,
        previous: response.data.previous,
        currentPage: page,
        pageSize
      });
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const applyFilters = () => {
    const activeFilters = Object.fromEntries(
      Object.entries(filters).filter(([_, v]) => v !== "")
    );
    fetchOrders(1, pagination.pageSize, activeFilters);
  };

  const resetFilters = () => {
    setFilters({
      supplier: "",
      po_number: "",
      rm_grade: "",
      bar_dia: ""
    });
    fetchOrders();
  };

  const handlePageChange = (newPage) => {
    fetchOrders(newPage, pagination.pageSize, filters);
  };

  const downloadPO = async (orderId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/download_po/?order_id=${orderId}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `PO_${orderId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error downloading PO:', error);
      alert('Failed to download PO');
    }
  };

  const pageTitle = "Order List";

  return (
    <div className="flex">
      {/* Sidebar */}
      <div className={`fixed top-0 left-0 h-full transition-all duration-300 ${
        isSidebarVisible ? "w-64" : "w-0 overflow-hidden"
      }`} style={{ zIndex: 50 }}>
        {isSidebarVisible && <Sidebar isVisible={isSidebarVisible} toggleSidebar={toggleSidebar} />}
      </div>

      {/* Main Content */}
      <div className={`flex flex-col flex-grow transition-all duration-300 ${
        isSidebarVisible ? "ml-64" : "ml-0"
      }`}>
        <DashboardHeader isSidebarVisible={isSidebarVisible} toggleSidebar={toggleSidebar} title={pageTitle} />

        <main className="flex flex-col mt-20 justify-center flex-grow pl-2">
          <div className="flex justify-between items-center mb-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-green-500 text-white px-2 py-1 rounded-lg shadow-md hover:bg-green-600 transition-all flex items-center gap-2"
              onClick={() => navigate("/CreateOrder")}
            >
              <span className="text-xl">+</span>
              <span>Create Order</span>
            </motion.button>
          </div>

          {/* Filter Section */}
          <div className="p-2 bg-white rounded-lg shadow-md mb-4">
            <h3 className="font-bold mb-3">Filter Orders</h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Supplier</label>
                <input
                  type="text"
                  name="supplier"
                  value={filters.supplier_name}
                  onChange={handleFilterChange}
                  className="border p-2 rounded w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">PO Number</label>
                <input
                  type="text"
                  name="po_number"
                  value={filters.po_number}
                  onChange={handleFilterChange}
                  className="border p-2 rounded w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">RM Grade</label>
                <input
                  type="text"
                  name="rm_grade"
                  value={filters.rm_grade}
                  onChange={handleFilterChange}
                  className="border p-2 rounded w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Bar Dia</label>
                <input
                  type="text"
                  name="bar_dia"
                  value={filters.bar_dia}
                  onChange={handleFilterChange}
                  className="border p-2 rounded w-full"
                />
              </div>
              <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={resetFilters}
                className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
              >
                Reset
              </button>
              <button
                onClick={applyFilters}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Apply Filters
              </button>
            </div>
            </div>
            
          </div>

          {/* Search */}
          <input
            type="text"
            placeholder="Search across all fields..."
            className="border p-3 mb-2 w-full rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <>
              <div className="overflow-y-auto max-h-[calc(100vh-250px)]">
                <table className="w-full bg-white border border-gray-300 rounded-md">
                  <thead className="sticky top-0 bg-gray-200 z-10">
                    <tr className="bg-gray-200">
                      {["Supplier", "RM Grade", "Standard", "Bar Dia", "Quantity", "PO Date", "PO Number", 
                        "Delivery Date", "Actual Delivery Date", "Heat", "Verified By", "Status", 
                        "Delivery Performance", "Actions"].map((header, index) => (
                        <th key={index} className="p-3 text-left">{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {orders.filter(order => 
                      Object.values(order).some(
                        val => val && val.toString().toLowerCase().includes(search.toLowerCase())
                      )
                    ).map((order, index) => (
                      <motion.tr
                        key={order.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="border-b hover:bg-white transition-colors"
                      >

                <td className="p-1 text-center">{order.supplier_name || "N/A"}</td>
                <td className="p-1 text-center">{order.rm_grade || "N/A"}</td>
                <td className="p-1 text-center">{order.rm_standard || "N/A"}</td>
                <td className="p-1 text-center">{order.bar_dia || "N/A"}</td>
                <td className="p-1 text-center">{order.qty || "N/A"}</td>
                <td className="p-1 text-center">{order.po_date || "N/A"}</td>
                <td className="p-1 text-center">{order.po_number || "N/A"}</td>
                <td className="p-1 text-center">{order.delivery_date || "N/A"}</td>
                <td className="p-1 text-center">{order.actual_delivery_date || "Not updated"}</td>
                <td className="p-1 text-center">{order.heat_no || "Not Recived"}</td>
                <td className="p-1 text-center">{order.verified_by || "N/A"}</td>
                <td className={`p-1 font-bold text-center ${order.actual_delivery_date ? 'text-green-600' : 'text-red-600'}`}>
                  {order.actual_delivery_date ? 'Closed' : 'Open'}
                </td>
                <td className={`p-1 font-bold text-center ${order.actual_delivery_date ? (order.delay_days <= 0 ? 'text-green-600' : 'text-red-600') : ''}`}>
                  {order.actual_delivery_date ? (order.delay_days <= 0 ? 'On Time' : `${order.delay_days} Days Late`) : ''}
                </td>
                <td className="p-1 text-center flex gap-1 justify-center">
                {order.approval_status === "Approved" && (
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="bg-blue-500 text-white px-2 py-1 rounded-lg hover:bg-blue-600 transition-all text-sm"
                        onClick={() => setSelectedOrder(order)}
                      >
                        Details
                      </motion.button>
                       )}
                      {order.approval_status === "Approved" && (
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="bg-green-500 text-white px-2 py-1 rounded-lg hover:bg-green-600 transition-all text-sm"
                        onClick={() => downloadPO(order.id)}
                      >
                        Download PO
                      </motion.button>
                      )}
                    </td>
                    </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              <div className="flex justify-between items-center mt-4">
                <div>
                  <span className="text-sm text-gray-700">
                    Showing {orders.length} of {pagination.count} orders
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={!pagination.previous}
                    className={`px-4 py-2 rounded ${!pagination.previous ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2">
                    Page {pagination.currentPage}
                  </span>
                  <button
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={!pagination.next}
                    className={`px-4 py-2 rounded ${!pagination.next ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
                  >
                    Next
                  </button>
                </div>
                <div>
                  <select
                    value={pagination.pageSize}
                    onChange={(e) => fetchOrders(1, parseInt(e.target.value), filters)}
                    className="border rounded p-2"
                  >
                    {[10, 20, 50, 100].map(size => (
                      <option key={size} value={size}>Show {size}</option>
                    ))}
                  </select>
                </div>
              </div>
            </>
          )}

          {selectedOrder && (
            <OrderDetails 
              order={selectedOrder} 
              onClose={() => setSelectedOrder(null)}
              onUpdate={() => fetchOrders(pagination.currentPage, pagination.pageSize, filters)}
            />
          )}
        </main>
      </div>
    </div>
  );
};
const OrderDetails = ({ order, onClose }) => {
  const [actualDate, setActualDate] = useState(order.actual_delivery_date || "");
  const [heatNo, setHeatNo] = useState(order.heat_no || "");
  const [message, setMessage] = useState("");
  const [isUpdated, setIsUpdated] = useState(false);

  const handleUpdate = async () => {
    if (!actualDate || !heatNo) {
      setMessage("Both fields are required");
      return;
    }

    try {
      const response = await axios.patch(`${API_BASE_URL}/${order.id}/update-delivery/`, {
        actual_delivery_date: actualDate,
        heat_no: heatNo,
      });
      setMessage(`Updated! Delay Days: ${response.data.delay_days}`);
      setIsUpdated(true);
    } catch (error) {
      setMessage("Error updating");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center z-50"
    >
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white p-8 rounded-lg shadow-xl max-w-lg w-full"
      >
        <h3 className="text-2xl font-bold mb-6 text-gray-800">Order Details</h3>
        <div className="grid grid-cols-2 gap-4">
          {Object.entries({
            "Supplier": order.supplier_name,
            "RM Grade": order.rm_grade,
            "Standard": order.rm_standard,
            "Bar Dia": order.bar_dia,
            "Quantity": order.qty,
            "PO Date": order.po_date,
            "PO Number": order.po_number,
            "Delivery Date": order.delivery_date,
            "Actual Delivery Date": order.actual_delivery_date || "Not updated",
            "Heat Reacived": order.heat_no || "Not Recived",
            "Verified By": order.verified_by,
            "Delay Days": order.delay_days || "N/A",
          }).map(([key, value]) => (
            <div key={key} className="text-gray-700">
              <strong>{key}:</strong> {value}
            </div>
          ))}
        </div>
        {!isUpdated && !order.actual_delivery_date && (
          <div className="mt-6">
            <div className="flex gap-4">
              <input
                type="date"
                className="border p-3 rounded-lg w-1/2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={actualDate}
                onChange={(e) => setActualDate(e.target.value)}
              />
              <input
                type="text"
                placeholder="Enter Heat No"
                className="border p-3 rounded-lg w-1/2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={heatNo}
                onChange={(e) => setHeatNo(e.target.value)}
              />
            </div>
            
          </div>
        )}
        {isUpdated && (
          <div className="mt-4 text-green-600 font-bold">{message}</div>
        )}
        {message && !isUpdated && <p className="mt-4 text-red-600">{message}</p>}
        <div className="flex gap-4 mt-4">
              <button
                className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-all flex-1"
                onClick={handleUpdate}
              >
                Update
              </button>
              <button
                className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 transition-all flex-1"
                onClick={onClose}
              >
                Close
              </button>
            </div>
      </motion.div>
    </motion.div>
  );
};


export { Orders };