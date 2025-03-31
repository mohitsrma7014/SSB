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
    bar_dia: "",
    status: ""
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
      bar_dia: "",
      status: ""
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

  const getStatusColor = (status) => {
    switch(status) {
      case "Closed": return "text-green-600";
      case "Open": return "text-red-600";
      case "Partially Received": return "text-yellow-600";
      default: return "text-green-600";
    }
  };
  const deleteOrder = async (orderId) => {
    if (!window.confirm("Are you sure you want to delete this order?")) return;
  
    try {
      await axios.delete(`${API_BASE_URL}/${orderId}/`);
      setMessage("Order deleted successfully!");
  
      // ✅ Instead of filtering, refetch the updated list
      fetchOrders(); 
  
    } catch (error) {
      console.error("Error deleting order:", error);
      setMessage("Error deleting order: " + (error.response?.data?.error || error.message));
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
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Supplier</label>
                <input
                  type="text"
                  name="supplier"
                  value={filters.supplier}
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
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select
                  name="status"
                  value={filters.status}
                  onChange={handleFilterChange}
                  className="border p-2 rounded w-full"
                >
                  <option value="">All</option>
                  <option value="Open">Open</option>
                  <option value="Partially Received">Partially Received</option>
                  <option value="Closed">Closed</option>
                </select>
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
                        "Delivery Date", "Received Qty (Kg)", "Remaining  (Kg)", "Status", 
                        "Delay Days", "Actions"].map((header, index) => (
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
                        className="border-b hover:bg-gray-50 transition-colors"
                      >
                        <td className="p-1 text-center">{order.supplier_name || "N/A"}</td>
                        <td className="p-1 text-center">{order.rm_grade || "N/A"}</td>
                        <td className="p-1 text-center">{order.rm_standard || "N/A"}</td>
                        <td className="p-1 text-center">{order.bar_dia || "N/A"}</td>
                        <td className="p-1 text-center">{order.qty || "N/A"}</td>
                        <td className="p-1 text-center">{order.po_date || "N/A"}</td>
                        <td className="p-1 text-center">{order.po_number || "N/A"}</td>
                        <td className="p-1 text-center">{order.delivery_date || "N/A"}</td>
                        <td className="p-1 text-center">{order.received_qty || 0}</td>
                        <td className="p-1 text-center">
                            {order.remaining_qty < 0 
                              ? `Extra (${Math.abs(order.remaining_qty)})` 
                              : order.remaining_qty || order.qty}
                          </td>

                        <td className={`p-1 font-bold text-center ${getStatusColor(order.status)}`}>
                          {order.status || "Open"}
                        </td>
                        <td className={`p-1 font-bold text-center ${
                            order.delay_days > 0 ? 'text-red-600' : order.delay_days < 0 ? 'text-green-600' : 'text-gray-600'
                          }`}>
                            {order.delay_days > 0 ? `${order.delay_days} days delay` : order.delay_days < 0 ? 'On Time' : '-'}
                          </td>

                        <td className="p-1 text-center flex gap-1 justify-center">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="bg-blue-500 text-white px-2 py-1 rounded-lg hover:bg-blue-600 transition-all text-sm"
                            onClick={() => setSelectedOrder(order)}
                          >
                            Details
                          </motion.button>
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
                          {/* {order.status === "Open" && (
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              className="bg-green-500 text-white px-2 py-1 rounded-lg hover:bg-red-600 transition-all text-sm"
                              onClick={() => deleteOrder(order.id)}
                            >
                              Delete PO
                            </motion.button>
                          )} */}
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

const OrderDetails = ({ order, onClose, onUpdate }) => {
  const [deliveries, setDeliveries] = useState([]);
  const [loadingDeliveries, setLoadingDeliveries] = useState(false);
  const [newDelivery, setNewDelivery] = useState({
    heat_no: "",
    received_qty: "",
    received_date: "",
    delay_reason: ""
  });
  const [message, setMessage] = useState("");
  const [forceClose, setForceClose] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    const fetchDeliveries = async () => {
      setLoadingDeliveries(true);
      try {
        const response = await axios.get(`${API_BASE_URL}/${order.id}/deliveries/`);
        setDeliveries(response.data);
      } catch (error) {
        console.error("Error fetching deliveries:", error);
      } finally {
        setLoadingDeliveries(false);
      }
    };

    fetchDeliveries();
  }, [order.id]);

  const handleForceCloseOrder = async () => {
    if (!window.confirm("Are you sure you want to close this order? This will mark it as complete regardless of remaining quantity.")) {
      return;
    }

    setIsClosing(true);
    try {
      const response = await axios.patch(`${API_BASE_URL}/${order.id}/`, {
        status: "Closed",
        actual_delivery_date: new Date().toISOString().split('T')[0], // Current date in YYYY-MM-DD
        force_close: true
      });
      
      setMessage("Order successfully closed!");
      onUpdate(); // Refresh the parent component
    } catch (error) {
      setMessage("Error closing order: " + (error.response?.data?.error || error.message));
    } finally {
      setIsClosing(false);
    }
  };

  const handleDeliveryInputChange = (e) => {
    const { name, value } = e.target;
    setNewDelivery(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const addDelivery = async () => {
    if (!newDelivery.heat_no || !newDelivery.received_qty || !newDelivery.received_date) {
      setMessage("Heat No, Received Qty, and Received Date are required");
      return;
    }

    try {
      await axios.patch(`${API_BASE_URL}/${order.id}/update-delivery/`, newDelivery);
      setMessage("Delivery added successfully!");
      setNewDelivery({
        heat_no: "",
        received_qty: "",
        received_date: "",
        delay_reason: ""
      });
      // Refresh deliveries and parent order
      const response = await axios.get(`${API_BASE_URL}/${order.id}/deliveries/`);
      setDeliveries(response.data);
      onUpdate();
    } catch (error) {
      setMessage("Error adding delivery: " + (error.response?.data?.error || error.message));
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
        className="bg-white p-8 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-between items-start mb-6">
          <h3 className="text-2xl font-bold text-gray-800">Order Details - {order.po_number}</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="space-y-2">
            <h4 className="font-semibold text-lg border-b pb-2">Order Information</h4>
            <DetailRow label="Supplier" value={order.supplier_name} />
            <DetailRow label="RM Grade" value={order.rm_grade} />
            <DetailRow label="Standard" value={order.rm_standard} />
            <DetailRow label="Bar Dia" value={order.bar_dia} />
            <DetailRow label="Price" value={order.price} />
          </div>
          <div className="space-y-2">
            <h4 className="font-semibold text-lg border-b pb-2">Delivery Information</h4>
            <DetailRow label="PO Date" value={order.po_date} />
            <DetailRow label="Delivery Date" value={order.delivery_date} />
            <DetailRow label="Order Qty" value={order.qty} />
            <DetailRow label="Received Qty" value={order.received_qty} />
            <DetailRow label="Remaining Qty" value={order.remaining_qty} />
            <DetailRow label="Status" value={order.status} />
            <DetailRow label="Delay Days" value={order.delay_days > 0 ? `${order.delay_days} days` : 'On Time'} />
          </div>
        </div>
        {order.status !== "Closed" && (
        <div className="mb-8">
          <h4 className="font-semibold text-lg border-b pb-2 mb-4">Add New Delivery</h4>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Heat No*</label>
              <input
                type="text"
                name="heat_no"
                value={newDelivery.heat_no}
                onChange={handleDeliveryInputChange}
                className="border p-2 rounded w-full"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Received Qty*</label>
              <input
                type="number"
                name="received_qty"
                value={newDelivery.received_qty}
                onChange={handleDeliveryInputChange}
                className="border p-2 rounded w-full"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Received Date*</label>
              <input
                type="date"
                name="received_date"
                value={newDelivery.received_date}
                onChange={handleDeliveryInputChange}
                className="border p-2 rounded w-full"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Delay Reason</label>
              <input
                type="text"
                name="delay_reason"
                value={newDelivery.delay_reason}
                onChange={handleDeliveryInputChange}
                className="border p-2 rounded w-full"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={addDelivery}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Add Delivery
            </button>
          </div>
          {message && (
            <div className={`mt-2 p-2 rounded ${
              message.includes("success") ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
            }`}>
              {message}
            </div>
          )}
        </div>
        )}
        {order.status !== "Closed" && (
          <div className="mb-6 p-4 border rounded-lg bg-yellow-50">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-lg text-yellow-800">Close Order</h4>
                <p className="text-yellow-700 text-sm">
                  {order.remaining_qty > 0 
                    ? `This order has ${order.remaining_qty} remaining quantity. Are you sure you want to close it?`
                    : "Mark this order as closed."}
                </p>
              </div>
              <button
                onClick={handleForceCloseOrder}
                disabled={isClosing}
                className={`px-4 py-2 rounded text-white ${
                  isClosing ? 'bg-gray-400' : 'bg-red-500 hover:bg-red-600'
                }`}
              >
                {isClosing ? 'Processing...' : 'Close Order'}
              </button>
            </div>
            {message && (
              <div className={`mt-2 p-2 rounded ${
                message.includes("success") ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
              }`}>
                {message}
              </div>
            )}
          </div>
        )}

        <div>
          <h4 className="font-semibold text-lg border-b pb-2 mb-4">Delivery History</h4>
          {loadingDeliveries ? (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : deliveries.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="py-2 px-4 border">Heat No</th>
                    <th className="py-2 px-4 border">Received Qty</th>
                    <th className="py-2 px-4 border">Received Date</th>
                    <th className="py-2 px-4 border">Delay Days</th>
                    <th className="py-2 px-4 border">Delay Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {deliveries.map((delivery, index) => (
                    <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      <td className="py-2 px-4 border text-center">{delivery.heat_no}</td>
                      <td className="py-2 px-4 border text-center">{delivery.received_qty}</td>
                      <td className="py-2 px-4 border text-center">{delivery.received_date}</td>
                      <td className="py-2 px-4 border text-center">{delivery.delay_days || 0}</td>
                      <td className="py-2 px-4 border text-center">{delivery.delay_reason || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500">No deliveries recorded yet</p>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

const DetailRow = ({ label, value }) => (
  <div className="flex">
    <span className="font-medium text-gray-700 w-32">{label}:</span>
    <span className="text-gray-900">{value || 'N/A'}</span>
  </div>
);

export { Orders };