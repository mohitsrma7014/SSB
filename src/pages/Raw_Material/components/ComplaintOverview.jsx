import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FiAlertTriangle, FiImage, FiCalendar, FiLayers, FiHash, FiX } from "react-icons/fi";

const ComplaintOverview = () => {
  const [openComplaints, setOpenComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const navigate = useNavigate();

  const fetchOpenComplaints = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        "http://192.168.1.199:8001/raw_material/api/complaints/open/",
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
        }
      );
      setOpenComplaints(response.data);
    } catch (err) {
      console.error("Error fetching open complaints:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOpenComplaints();
  }, []);

  const handleSeeAll = () => {
    navigate("/Complant");
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const options = { day: 'numeric', month: 'short' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const handleImageClick = (imageUrl) => {
    setSelectedImage(imageUrl);
  };

  const closeImageModal = () => {
    setSelectedImage(null);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex justify-between items-center mb-4">
          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full flex items-center">
            <FiAlertTriangle className="mr-1" /> Open
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
        Error loading complaints: {error}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      {/* Image Preview Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={closeImageModal}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img 
              src={selectedImage} 
              alt="Complaint Preview" 
              className="max-w-full max-h-[80vh] object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={closeImageModal}
              className="absolute top-2 right-2 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100"
            >
              <FiX className="text-gray-800" />
            </button>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-lg flex items-center">
          <FiAlertTriangle className="mr-2 text-yellow-500" />
          Open Complaints
        </h3>
        <button
          onClick={handleSeeAll}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
        >
          View All <FiCalendar className="ml-1" />
        </button>
      </div>

      {openComplaints.length === 0 ? (
        <div className="text-center py-6 text-gray-400">
          <FiAlertTriangle className="mx-auto text-2xl mb-2" />
          No open complaints found
        </div>
      ) : (
        <div className="space-y-3">
          {openComplaints.map((complaint) => (
            <div 
              key={complaint.id} 
              className="border border-gray-100 rounded-lg p-3 hover:bg-gray-50 transition-colors"
            >
              <div className="flex justify-between items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 flex items-center flex-wrap gap-2">
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded whitespace-nowrap">
                      Heat: {complaint.heat || 'N/A'}
                    </span>
                    <span className="text-sm text-gray-600 truncate">
                      {complaint.grade || 'N/A'} - {complaint.dia || 'N/A'}mm
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap items-center text-sm text-gray-600 mt-2 gap-2">
                    {complaint.component && (
                      <span className="flex items-center whitespace-nowrap">
                        <FiLayers className="mr-1 text-gray-400 flex-shrink-0" />
                        <span className="truncate">{complaint.component}</span>
                      </span>
                    )}
                    {complaint.pices && (
                      <span className="flex items-center whitespace-nowrap">
                        <FiHash className="mr-1 text-gray-400 flex-shrink-0" />
                        {complaint.pices} pcs
                      </span>
                    )}
                  </div>
                  
                  <div className="text-xs text-gray-500 mt-2 flex items-center whitespace-nowrap">
                    <FiCalendar className="mr-1 flex-shrink-0" />
                    Opened: {formatDate(complaint.complaint_date)}
                  </div>
                </div>
                
                {complaint.Complaint_photo ? (
                  <div 
                    className="flex-shrink-0 w-14 h-14 rounded border border-gray-200 overflow-hidden relative group cursor-pointer"
                    onClick={() => handleImageClick(complaint.Complaint_photo)}
                  >
                  <img 
                    src={complaint.Complaint_photo} 
                    alt="Complaint" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.error("Image failed to load:", e.target.src);
                      e.target.src = "https://via.placeholder.com/48?text=No+Image"; // Fallback image
                    }}
                    loading="lazy" // Lazy loading for performance
                  />



                   
                  </div>
                ) : (
                  <div className="flex-shrink-0 w-14 h-14 rounded border border-gray-200 bg-gray-100 flex items-center justify-center text-gray-400">
                    <FiImage className="text-xl" />
                  </div>
                )}
              </div>
              
              {complaint.issue && (
                <div className=" pt-1 mt-2 border-t border-gray-100">
                  <div className="text-sm font-medium text-gray-700 mb-1">Issue:</div>
                  <p className="text-sm text-gray-600 line-clamp-1 break-words">
                    {complaint.issue}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ComplaintOverview;