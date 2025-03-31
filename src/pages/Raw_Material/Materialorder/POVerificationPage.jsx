import { useState } from 'react';
import axios from 'axios';
import { Sidebar } from "../../Navigation/Sidebar";
import DashboardHeader from "../../Navigation/DashboardHeader";
const POVerificationPage = () => {
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [error, setError] = useState('');

  const API_ENDPOINT = 'http://192.168.1.199:8001/raw_material/api/verify-po/';

  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
        
          const toggleSidebar = () => {
            setIsSidebarVisible(!isSidebarVisible);
          };
          const pageTitle = "Verify Purchase Order Digital Signature "; // Set the page title here

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setFileName(e.target.files[0].name);
      setVerificationResult(null);
      setError('');
    }
  };

  const verifyPO = async () => {
    if (!file) {
      setError('Please select a PDF file first');
      return;
    }

    setIsLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('po_file', file);

    try {
      const response = await axios.post(API_ENDPOINT, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem("accessToken")}`,
        }
      });

      setVerificationResult(response.data);
    } catch (err) {
      const errorMsg = err.response?.data?.message || 
                      err.response?.data?.detail || 
                      'Failed to verify PO. Please try again.';
      setError(errorMsg);
      
      if (err.response?.status === 401) {
        console.error('Authentication failed - please login again');
      }
      
      console.error('Verification error:', err.response?.data || err.message);
    } finally {
      setIsLoading(false);
    }
  };

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
    <div className="max-w-3xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-card p-8">
        <div className="flex flex-col space-y-2 mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Purchase Order Verification</h1>
          <p className="text-gray-500">Upload your PO document to verify its authenticity</p>
        </div>

        {/* File Upload Card */}
        <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 mb-8 hover:border-blue-400 transition-colors">
          <div className="flex flex-col items-center justify-center space-y-4">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
            </svg>
            
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">
                <span className="font-semibold text-blue-600">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-gray-500">PDF files only (MAX. 10MB)</p>
            </div>
            
            <input
              type="file"
              id="file-upload"
              accept=".pdf"
              onChange={handleFileChange}
              className="hidden"
            />
            <label 
              htmlFor="file-upload"
              className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium cursor-pointer hover:bg-blue-100 transition-colors"
            >
              Select File
            </label>
          </div>
          
          {fileName && (
            <div className="mt-4 flex items-center justify-center space-x-2">
              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
              <span className="text-sm font-medium text-gray-700 truncate max-w-xs">{fileName}</span>
            </div>
          )}
        </div>

        <button
          onClick={verifyPO}
          disabled={isLoading || !file}
          className={`w-full py-3 px-4 rounded-xl text-white font-medium flex items-center justify-center space-x-2 transition-colors ${
            isLoading || !file ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Processing...</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
              </svg>
              <span>Verify Document</span>
            </>
          )}
        </button>

        {error && (
          <div className="mt-6 p-4 bg-red-50 rounded-lg border-l-4 border-red-500 flex items-start space-x-3">
            <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <div>
              <p className="text-red-700 font-medium">{error}</p>
              {error.includes('Authentication') && (
                <button 
                  onClick={() => window.location.href = '/login'}
                  className="mt-2 text-blue-600 text-sm font-medium hover:underline"
                >
                  Go to login page
                </button>
              )}
            </div>
          </div>
        )}

        {verificationResult && (
          <div className={`mt-8 p-6 rounded-xl ${verificationResult.status === 'valid' ? 'bg-green-50' : 'bg-yellow-50'} border-l-4 ${
            verificationResult.status === 'valid' ? 'border-green-500' : 'border-yellow-500'
          }`}>
            <div className="flex items-center space-x-3 mb-4">
              {verificationResult.status === 'valid' ? (
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              ) : (
                <svg className="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                </svg>
              )}
              <h2 className="text-xl font-bold text-gray-900">Verification Results</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-white p-4 rounded-lg shadow-xs">
                <p className="text-sm font-medium text-gray-500">PO Number</p>
                <p className="text-lg font-semibold text-gray-900">{verificationResult.po_number}</p>
              </div>
              
              <div className="bg-white p-4 rounded-lg shadow-xs">
                <p className="text-sm font-medium text-gray-500">Status</p>
                <p className={`text-lg font-bold ${
                  verificationResult.status === 'valid' ? 'text-green-600' : 'text-yellow-600'
                }`}>
                  {verificationResult.status.charAt(0).toUpperCase() + verificationResult.status.slice(1)}
                </p>
              </div>
              
              <div className="bg-white p-4 rounded-lg shadow-xs">
                <p className="text-sm font-medium text-gray-500">Approved By</p>
                <p className="text-lg font-semibold text-gray-900">{verificationResult.document_approved_by}</p>
              </div>
              
              <div className="bg-white p-4 rounded-lg shadow-xs">
                <p className="text-sm font-medium text-gray-500">Approval Time</p>
                <p className="text-lg font-semibold text-gray-900">{verificationResult.document_approval_time}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Message</p>
                <p className="text-gray-900">{verificationResult.message}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Verification Time</p>
                <p className="text-gray-900">{verificationResult.verification_time}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
    </main>
    </div>
    </div>
  );
};

export default POVerificationPage;