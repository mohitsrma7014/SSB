import React, { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../api"; // Import your API utility

const Notification = () => {
  const [isOpen, setIsOpen] = useState(false); // Control dropdown visibility
  const [activeTab, setActiveTab] = useState("30days");
  const [notifications, setNotifications] = useState({
    "30days": [],
    "15days": [],
    "7days": [],
    overdue: [],
  });
  const [isLoading, setIsLoading] = useState(false);

  // Fetch all complaints for notifications
  const fetchAllComplaints = async () => {
    setIsLoading(true);
    try {
      const response = await api.get("/calibration/api/complaints/notifications/", {
        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
      });
      processNotifications(response.data);
    } catch (error) {
      console.error("Error fetching complaints for notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Process notifications based on all complaints
  const processNotifications = (complaints) => {
    const today = new Date();
    const thirtyDays = new Date(today);
    thirtyDays.setDate(today.getDate() + 30);

    const fifteenDays = new Date(today);
    fifteenDays.setDate(today.getDate() + 15);

    const sevenDays = new Date(today);
    sevenDays.setDate(today.getDate() + 7);

    const thirtyDaysList = [];
    const fifteenDaysList = [];
    const sevenDaysList = [];
    const overdueList = [];

    complaints.forEach((complaint) => {
      const dueDate = new Date(complaint.due_date);

      if (dueDate < today) {
        overdueList.push({
          id: complaint.id,
          uid: complaint.uid,
          instrument: complaint.name_of_instrument,
          dueDate: complaint.due_date,
          status: "Overdue",
        });
      } else if (dueDate <= sevenDays) {
        sevenDaysList.push({
          id: complaint.id,
          uid: complaint.uid,
          instrument: complaint.name_of_instrument,
          dueDate: complaint.due_date,
          status: "Due in 7 days",
        });
      } else if (dueDate <= fifteenDays) {
        fifteenDaysList.push({
          id: complaint.id,
          uid: complaint.uid,
          instrument: complaint.name_of_instrument,
          dueDate: complaint.due_date,
          status: "Due in 15 days",
        });
      } else if (dueDate <= thirtyDays) {
        thirtyDaysList.push({
          id: complaint.id,
          uid: complaint.uid,
          instrument: complaint.name_of_instrument,
          dueDate: complaint.due_date,
          status: "Due in 30 days",
        });
      }
    });

    setNotifications({
      "30days": thirtyDaysList,
      "15days": fifteenDaysList,
      "7days": sevenDaysList,
      overdue: overdueList,
    });
  };

  // Fetch notifications when the component mounts
  useEffect(() => {
    fetchAllComplaints();
  }, []);

  const totalNotifications =
    notifications["30days"].length +
    notifications["15days"].length +
    notifications["7days"].length +
    notifications.overdue.length;

  return (
    <div className="relative inline-block">
      {/* Notification Icon with Count */}
      <button
        onClick={() => setIsOpen(!isOpen)} // Toggle dropdown visibility
        className="relative rounded-full bg-gray-100 hover:bg-gray-200 transition"
      >
        <Bell className="w-6 h-6 text-gray-600" />
        {totalNotifications > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
            {totalNotifications}
          </span>
        )}
      </button>

      {/* Notification Dropdown (Visible only when isOpen is true) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-12 right-0 w-96 bg-white shadow-lg rounded-lg p-2 z-50 overflow-hidden border border-gray-200"
          >
            <div className="flex justify-around border-b pb-1 mb-1 bg-gray-100 p-1 rounded-md">
              {["30days", "15days", "7days", "overdue"].map((key) => (
                <button
                  key={key}
                  className={`px-2 py-2 rounded-md font-semibold transition-all text-sm ${
                    activeTab === key ? "bg-blue-500 text-white shadow-md" : "bg-gray-200 hover:bg-gray-300"
                  }`}
                  onClick={() => setActiveTab(key)}
                >
                  {key === "30days"
                    ? "30 Days"
                    : key === "15days"
                    ? "15 Days"
                    : key === "7days"
                    ? "7 Days"
                    : "Overdue"}
                  <span className="ml-4 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                    {notifications[key].length}
                  </span>
                </button>
              ))}
            </div>
            <div className="overflow-y-auto max-h-80 space-y-2">
              {isLoading ? (
                <p className="text-center text-gray-500">Loading notifications...</p>
              ) : (
                notifications[activeTab].map((note) => (
                  <div
                    key={note.id}
                    className="p-2 bg-gray-100 rounded-lg shadow-sm border-l-4 border-blue-500"
                  >
                    <p className="text-sm font-semibold">UID: {note.uid}</p>
                    <p className="text-xs text-gray-600">Instrument: {note.instrument}</p>
                    <p className="text-xs text-red-500">Due Date: {note.dueDate}</p>
                    <p className="text-xs text-red-500">Status: {note.status}</p>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Notification;