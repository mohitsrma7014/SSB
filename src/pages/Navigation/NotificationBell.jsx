import { useState, useEffect } from 'react';
import { Bell, Check, X, Clock, Loader2, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [department, setDepartment] = useState('');
  const [userDetails, setUserDetails] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(null);
  const navigate = useNavigate();

  // API endpoints
  const API_BASE = 'http://192.168.1.199:8001/raw_material/api';
  const PENDING_API = `${API_BASE}/pending-po-approvals/`;
  const UPDATE_API = `${API_BASE}/update-approval-status/`;
  const USER_API = 'http://192.168.1.199:8001/api/user-details/';

  // Convert kg to metric tons (1 MT = 1000 kg)
  const kgToMT = (kg) => (kg / 1000).toFixed(2);
  
  // Calculate total price
  const calculateTotalPrice = (pricePerKg, qtyKg) => {
    const total = pricePerKg * qtyKg;
    const gst = total * 0.18; // 18% GST
    const totalWithGst = total + gst;

    return totalWithGst.toLocaleString('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    });
};


  // Fetch user details
  const fetchUserDetails = async () => {
    try {
      const response = await fetch(USER_API, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch user details');
      const data = await response.json();
      setUserDetails(data);
      setDepartment(data.department.toLowerCase());
    } catch (err) {
      console.error("Failed to fetch user details:", err);
      navigate("/");
    }
  };

  // Fetch pending approvals
  const fetchPendingApprovals = async () => {
    if (department !== 'admin') return;
    
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(PENDING_API, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });
      if (!response.ok) throw new Error(`Failed to fetch: ${response.status}`);
      const data = await response.json();
      setPendingApprovals(data.pending_approvals || []);
    } catch (err) {
      setError(err.message);
      console.error('Fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Update approval status
  const updateApprovalStatus = async (orderId, status) => {
    try {
      if (!userDetails) {
        await fetchUserDetails();
        if (!userDetails) throw new Error("User details not available");
      }

      const response = await fetch(UPDATE_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        body: JSON.stringify({
          order_id: orderId,
          status: status,
          approved_by: `${userDetails.name} ${userDetails.lastname}`.trim()
        }),
      });
      
      if (!response.ok) throw new Error("Approval update failed");
      setPendingApprovals(prev => prev.filter(po => po.id !== orderId));
    } catch (err) {
      setError(err.message);
      console.error("Update error:", err);
      fetchPendingApprovals();
    }
  };

  // Handle approval/reject actions with confirmation
  const handleApprovalAction = (po, action) => {
    setShowConfirmation({ action, po });
  };

  const confirmAction = async () => {
    if (!showConfirmation) return;
    
    try {
      const { po, action } = showConfirmation;
      await updateApprovalStatus(po.id, action === 'approve' ? 'Approved' : 'Rejected');
    } catch (err) {
      console.error("Action failed:", err);
    } finally {
      setShowConfirmation(null);
    }
  };

  const cancelAction = () => {
    setShowConfirmation(null);
  };

  // Initial data loading
  useEffect(() => {
    fetchUserDetails();
  }, []);

  // Auto-refresh approvals
  useEffect(() => {
    if (department === 'admin') {
      fetchPendingApprovals();
      const interval = setInterval(fetchPendingApprovals, 30000000);
      return () => clearInterval(interval);
    }
  }, [department]);

  if (department !== 'admin') return null;

  return (
    <div className="relative">
      {/* Notification Bell with Count */}
      <div 
        className="relative cursor-pointer hover:bg-gray-100 rounded-full transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="h-5 w-5 text-gray-600 hover:text-gray-900" />
        {pendingApprovals.length > 0 && (
          <span className={`absolute -top-1 -right-1 bg-red-500 text-white text-[0.6rem] rounded-full h-3 flex items-center justify-center ${
            pendingApprovals.length > 9 ? 'px-1 w-auto min-w-[1.1rem]' : 'w-3'
          }`}>
            {pendingApprovals.length > 9 ? '9+' : pendingApprovals.length}
          </span>
        )}
      </div>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-100 z-50 overflow-hidden">
          <div className="p-3 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
            <div>
              <h3 className="font-medium text-sm text-gray-800">Pending Approvals</h3>
              <p className="text-xs text-gray-500">{pendingApprovals.length} pending items</p>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-200"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
          
          {isLoading ? (
            <div className="p-4 flex justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            </div>
          ) : error ? (
            <div className="p-3 text-red-500 text-center text-xs">
              {error}
              <button 
                onClick={fetchPendingApprovals}
                className="mt-1 text-xs text-blue-600 hover:text-blue-800"
              >
                Retry
              </button>
            </div>
          ) : pendingApprovals.length === 0 ? (
            <div className="p-4 text-center text-gray-500 text-xs">
              No pending approvals found
            </div>
          ) : (
            <div className="max-h-[60vh] overflow-y-auto divide-y divide-gray-100">
              {pendingApprovals.map((po) => (
                <div key={po.id} className="p-3 hover:bg-gray-50 transition-colors">
                  {/* PO Information */}
                  <div className="flex justify-between items-start mb-1">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm text-gray-900 truncate">
                        PO #{po.po_number || 'N/A'}
                      </h4>
                      <p className="text-xs text-gray-500 truncate">
                        {po.supplier || 'Unknown Supplier'}
                      </p>
                    </div>
                    <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full whitespace-nowrap ml-2">
                      {po.days_pending || '?'}d
                    </span>
                  </div>
                  
                  <div className="flex items-center text-xs text-gray-600 mb-2">
                    <span className="font-medium mr-2">{po.grade || 'N/A'}</span>
                    <span className="mr-2">•</span>
                    <span>{po.dia || 'N/A'}mm</span>
                    <span className="mx-2">•</span>
                    <span>{kgToMT(po.qty || 0)} MT</span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 text-xs mb-2">
                    <div>
                      <p className="text-gray-500">Price/kg</p>
                      <p>₹{po.price?.toLocaleString('en-IN') || '0'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Total</p>
                      <p>{calculateTotalPrice(po.price || 0, po.qty || 0)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Delivery</p>
                      <p>{po.delivery_date || 'N/A'}</p>
                    </div>
                  </div>
                  
                  {/* Action Buttons - Now trigger confirmation dialog */}
                  <div className="flex justify-end space-x-2 mt-1">
                    <button
                      onClick={() => handleApprovalAction(po, 'reject')}
                      className="px-2 py-1 text-xs flex items-center bg-red-50 text-red-600 rounded hover:bg-red-100 border border-red-100"
                    >
                      <X className="h-3 w-3 mr-1" />
                      Reject
                    </button>
                    <button
                      onClick={() => handleApprovalAction(po, 'approve')}
                      className="px-2 py-1 text-xs flex items-center bg-green-50 text-green-600 rounded hover:bg-green-100 border border-green-100"
                    >
                      <Check className="h-3 w-3 mr-1" />
                      Approve
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Confirmation Dialog */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-3 max-w-sm w-full mx-4 shadow-xl">
            <div className="flex items-start mb-4">
              <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5 mr-2" />
              <div>
                <h3 className="font-medium text-gray-900">
                  Confirm {showConfirmation.action === 'approve' ? 'Approval' : 'Rejection'}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Are you sure you want to {showConfirmation.action} PO #{showConfirmation.po?.po_number}, 
                  Dia #{showConfirmation.po?.dia}, 
                  Grade #{showConfirmation.po?.grade}, <br/>
                  Price #{calculateTotalPrice(showConfirmation.po?.price || 0, showConfirmation.po?.qty || 0)}?
                  
                                  </p>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-4">
              <button
                onClick={cancelAction}
                className="px-3 py-1.5 text-sm text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={confirmAction}
                className={`px-3 py-1.5 text-sm text-white rounded ${
                  showConfirmation.action === 'approve' 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {showConfirmation.action === 'approve' ? 'Approve' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;