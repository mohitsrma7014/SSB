import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FiTruck, FiCalendar, FiFileText, FiBox } from 'react-icons/fi';

const UpcomingDeliveries = () => {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchUpcomingDeliveries = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        'http://192.168.1.199:8001/raw_material/api/orders/upcoming-deliveries/',
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
        }
      );
      setDeliveries(response.data);
    } catch (err) {
      console.error('Error fetching upcoming deliveries:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUpcomingDeliveries();
  }, []);

  const handleSeeAll = () => {
    navigate('/Orders');
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const options = { day: 'numeric', month: 'short' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const getDaysUntilDelivery = (deliveryDate) => {
    if (!deliveryDate) return '';
    const today = new Date();
    const delivery = new Date(deliveryDate);
    const diffTime = delivery - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`;
    return `${diffDays} days`;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex justify-between items-center mb-4">
          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full flex items-center">
            <FiTruck className="mr-1" /> Upcoming
          </span>
          <div className="animate-pulse h-4 w-20 bg-gray-200 rounded"></div>
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse h-20 bg-gray-100 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-red-500">
        Error loading deliveries: {error}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 h-full flex flex-col p-4">
      <div className="flex justify-between items-center mb-4 sticky top-0 bg-white z-10 pb-2">
        <h3 className="font-semibold text-lg flex items-center">
          <FiTruck className="mr-2 text-green-500" />
          Upcoming Deliveries
        </h3>
        <button
          onClick={handleSeeAll}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
        >
          View All <FiCalendar className="ml-1" />
        </button>
      </div>

      <div className="overflow-y-auto space-y-3 pr-1">

      {deliveries.length === 0 ? (
        <div className="text-center py-6 text-gray-400">
          <FiBox className="mx-auto text-2xl mb-2" />
          No upcoming deliveries found
        </div>
      ) : (
        <div className="space-y-3">
          {deliveries.map((delivery) => (
            <div 
              key={delivery.id} 
              className="border border-gray-100 rounded-lg p-3 hover:bg-gray-50 transition-colors"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="font-medium text-gray-900 flex items-center">
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded mr-2">
                      {delivery.rm_grade}
                    </span>
                    <span>{delivery.bar_dia}mm</span>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-600 mt-2">
                    <FiFileText className="mr-1 text-gray-400" />
                    <span className="mr-3">PO: {delivery.po_number}</span>
                    <span>Supplier: {delivery.supplier_name}</span>
                  </div>
                  
                  {delivery.description_of_good && (
                    <div className="text-xs text-gray-500 mt-1 truncate">
                      {delivery.description_of_good}
                    </div>
                  )}
                </div>
                
                <div className="text-right ml-4">
                  <div className={`font-medium flex items-center justify-end ${
                    getDaysUntilDelivery(delivery.delivery_date).includes('overdue') 
                      ? 'text-red-500'
                      : getDaysUntilDelivery(delivery.delivery_date) === 'Today' 
                        ? 'text-orange-500' 
                        : 'text-gray-700'
                  }`}>
                    <FiCalendar className="mr-1" />
                    {formatDate(delivery.delivery_date)}
                  </div>
                  <div className={`text-xs mt-1 ${
                    getDaysUntilDelivery(delivery.delivery_date).includes('overdue')
                      ? 'text-red-400'
                      : 'text-gray-400'
                  }`}>
                    {getDaysUntilDelivery(delivery.delivery_date)}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-100 text-sm">
                <span className="text-gray-700">
                  Qty: <span className="font-medium">{delivery.qty}</span>
                </span>
                <span className="text-gray-700">
                  Standard: <span className="font-medium">{delivery.rm_standard}</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
    </div>
  );
};

export default UpcomingDeliveries;