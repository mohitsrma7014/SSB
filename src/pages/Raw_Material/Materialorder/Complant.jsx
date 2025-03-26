import CreateComplaint from "./CreateComplaint";
import ComplaintList from "./ComplaintList";
import { Sidebar } from "../../Navigation/Sidebar";
import DashboardHeader from "../../Navigation/DashboardHeader";
import { useState } from "react";

function Complaint() {
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [isPopupVisible, setIsPopupVisible] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarVisible(!isSidebarVisible);
  };

  const openPopup = () => {
    setIsPopupVisible(true);
  };

  const closePopup = () => {
    setIsPopupVisible(false);
    window.location.reload(); // Refresh the page when closing the popup
  };
  
  const pageTitle = "Complaint Management";

  return (
    <div className="flex">
      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full transition-all duration-300 ${
          isSidebarVisible ? "w-64" : "w-0 overflow-hidden"
        }`}
        style={{ zIndex: 50 }}
      >
        {isSidebarVisible && <Sidebar isVisible={isSidebarVisible} toggleSidebar={toggleSidebar} />}
      </div>

      {/* Main Content */}
      <div className={`flex flex-col flex-grow transition-all duration-300 ${isSidebarVisible ? "ml-64" : "ml-0"}`}>
        <DashboardHeader isSidebarVisible={isSidebarVisible} toggleSidebar={toggleSidebar} title={pageTitle} />

        <main className="flex flex-col mt-20 justify-center flex-grow  relative">
          <div className="min-h-screen bg-gray-100 p-2 relative z-10">
           
            <button 
              onClick={openPopup} 
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              New Complaint
            </button>
            <div className="mt-6 overflow-auto relative z-0">
              <ComplaintList />
            </div>
          </div>
        </main>
      </div>

      {/* Popup Modal */}
      {isPopupVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded shadow-lg w-1/2 relative">
            <button 
              onClick={closePopup} 
              className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 z-50 rounded"
            >
              Close
            </button>
            <CreateComplaint />
          </div>
        </div>
      )}
    </div>
  );
}

export default Complaint;