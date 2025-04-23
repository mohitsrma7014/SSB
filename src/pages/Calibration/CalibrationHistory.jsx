import React, { useState, useEffect } from "react";
import api from "../../api";
import { toast } from "react-toastify";

const CalibrationHistory = ({ complaint, onClose }) => {
  const [history, setHistory] = useState([]);
  const API_URL = `http://192.168.1.199:8001/calibration/api/complaints/${complaint?.id}/history/`;

  useEffect(() => {
    if (complaint?.id) {
      fetchHistory();
    }
  }, [complaint]);

  const fetchHistory = async () => {
    try {
      const response = await api.get(API_URL, {
        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
      });
      setHistory(response.data);
    } catch (error) {
      toast.error("Error fetching complaint history");
    }
  };

  // Function to determine if a value is a PDF file URL
  const isPdfFile = (value) => {
    return value?.toLowerCase()?.endsWith('.pdf') || false;
  };

  // Function to construct the new file URL if it's a filename change in the same directory
  const getNewFileUrl = (entry) => {
    if (["complaintfile", "evidencefile", "add_pdf"].includes(entry.field_changed) && 
        entry.old_value?.startsWith("http") && entry.new_value) {
      const oldFilePath = entry.old_value.substring(0, entry.old_value.lastIndexOf("/") + 1);
      return oldFilePath + entry.new_value;
    }
    return entry.new_value;
  };

  return (
    <div 
      className="modal show d-flex align-items-center justify-content-center"
      style={{ zIndex: 1050, position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", backgroundColor: "rgba(0, 0, 0, 0.5)" }}
    >
      <div className="modal-dialog" style={{ maxWidth: "800px", width: "90%" }}>  
        <div className="modal-content" style={{ height: "600px", top: 50}}> 
          <div className="modal-header">
            <h5 className="modal-title">Complaint History</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body" style={{ overflowY: "auto", maxHeight: "500px" }}>
            {history.length > 0 ? (
              <ul className="list-group">
                {history.map((entry, index) => {
                  const isFileField = ["complaintfile", "evidencefile", "add_pdf"].includes(entry.field_changed);
                  const newFileUrl = getNewFileUrl(entry);
                  const isOldPdf = isPdfFile(entry.old_value);
                  const isNewPdf = isPdfFile(newFileUrl);

                  return (
                    <li key={index} className="list-group-item">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <strong className="text-capitalize">{entry.field_changed.replace(/_/g, ' ')}</strong>
                        <small className="text-muted">by {entry.changed_by} • {new Date(entry.changed_at).toLocaleString()}</small>
                      </div>
                      
                      <div className="d-flex flex-wrap gap-2">
                        {isFileField ? (
                          <>
                            {entry.old_value?.startsWith("http") && (
                              <div className="d-flex flex-column">
                                <span className="text-muted small mb-1">Previous:</span>
                                {isOldPdf ? (
                                  <a 
                                    href={entry.old_value} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="btn btn-outline-secondary btn-sm"
                                  >
                                    <i className="bi bi-file-earmark-pdf me-1"></i> View Old PDF
                                  </a>
                                ) : (
                                  <a 
                                    href={entry.old_value} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="btn btn-outline-secondary btn-sm"
                                  >
                                    <i className="bi bi-file-earmark me-1"></i> View Old File
                                  </a>
                                )}
                              </div>
                            )}
                            
                            {newFileUrl?.startsWith("http") && (
                              <div className="d-flex flex-column">
                                <span className="text-muted small mb-1">Updated:</span>
                                {isNewPdf ? (
                                  <a 
                                    href={newFileUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="btn btn-outline-primary btn-sm"
                                  >
                                    <i className="bi bi-file-earmark-pdf me-1"></i> View New PDF
                                  </a>
                                ) : (
                                  <a 
                                    href={newFileUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="btn btn-outline-primary btn-sm"
                                  >
                                    <i className="bi bi-file-earmark me-1"></i> View New File
                                  </a>
                                )}
                              </div>
                            )}
                          </>
                        ) : (
                          <>
                            <div className="bg-light p-2 rounded">
                              <span className="text-muted small">From:</span>
                              <div>{entry.old_value || <em>Empty</em>}</div>
                            </div>
                            <div className="bg-light p-2 rounded">
                              <span className="text-muted small">To:</span>
                              <div>{entry.new_value || <em>Empty</em>}</div>
                            </div>
                          </>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p>No history available.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalibrationHistory;