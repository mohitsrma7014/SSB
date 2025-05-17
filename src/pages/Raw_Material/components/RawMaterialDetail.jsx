import React, { useState, useEffect } from "react";
import axios from "axios";
import PrintSlip from './PrintSlip';

const RawMaterialDetail = ({ materialId, onBack }) => {
  const [material, setMaterial] = useState(null);
  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState({
    milltc: null,
    spectro: null,
    ssb_inspection_report: null,
    customer_approval: null
  });
  const [showPrintSlip, setShowPrintSlip] = useState(false);

  const handlePrint = () => {
    setShowPrintSlip(true);
  };

  useEffect(() => {
    const fetchMaterial = async () => {
      try {
        const response = await axios.get(
          `http://192.168.1.199:8001/raw_material/api/rawmaterials/${materialId}/`
        );
        setMaterial(response.data);
      } catch (error) {
        console.error("Error fetching material details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMaterial();
  }, [materialId]);

  const handleUpdate = async (e) => {
    e.preventDefault();

    const formData = new FormData();

    formData.append("weight", material.weight);
    formData.append("approval_status", material.approval_status);
    formData.append("comments", material.comments);

    Object.keys(files).forEach((key) => {
      if (files[key]) {
        formData.append(key, files[key]);
      }
    });

    try {
      const response = await axios.put(
        `http://192.168.1.199:8001/raw_material/api/rawmaterials/${materialId}/`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      alert("Material updated successfully!");
      window.location.reload();
    } catch (error) {
      console.error("Error updating material:", error.message);
      alert(`Failed to update material: ${error.message}`);
    }
  };

  const handleDelete = async () => {
    const confirmDelete = window.confirm("Are you sure you want to delete this material?");
    if (confirmDelete) {
      try {
        await axios.delete(
          `http://192.168.1.199:8001/raw_material/api/rawmaterials/${materialId}/`
        );
        alert("Material deleted successfully!");
        onBack();
      } catch (error) {
        console.error("Error deleting material:", error.message);
        alert(`Failed to delete material: ${error.message}`);
      }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setMaterial((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const { name, files: fileList } = e.target;
    if (fileList.length > 0) {
      setFiles((prev) => ({ ...prev, [name]: fileList[0] }));
    } else {
      setFiles((prev) => ({ ...prev, [name]: null }));
    }
  };

  // Check if customer is Hi-Tech or Dana
  const isSpecialCustomer = () => {
    return material && (material.customer?.toLowerCase().includes('hi-tech') || 
                       material.customer?.toLowerCase().includes('dana'));
  };

  // Check if all required files are attached
  const areAllRequiredFilesAttached = () => {
    if (isSpecialCustomer()) {
      return files.milltc && files.spectro && files.ssb_inspection_report;
    }
    return files.milltc && files.spectro && files.ssb_inspection_report;
  };

  // Check if files were pre-attached
  const isFilesPreAttached = material && (
    (material.milltc && !files.milltc) ||
    (material.spectro && !files.spectro) ||
    (material.ssb_inspection_report && !files.ssb_inspection_report) ||
    (isSpecialCustomer() && material.customer_approval && !files.customer_approval)
  );

  if (loading) {
    return <p>Loading material details...</p>;
  }

  return (
    <div className='bg-gray-100 p-20'>
      {showPrintSlip ? (
        <PrintSlip material={material} />
      ) : (
        <>
         

          <form onSubmit={handleUpdate} className= 'bg-white p-6 rounded shadow'>
            {/* First row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className= 'border-b border-gray-300 pb-2'>
                <label className='text-sm font-medium text-gray-700'>Date:</label>
                <input
                  type="date"
                  name="date"
                  value={material.date || ""}
                  onChange={handleChange}
                  className= 'w-full border-0 focus:ring-0 p-1'
                />
              </div>
              
              <div className='border-b border-gray-300 pb-2' >
                <label className='text-sm font-medium text-gray-700'>Supplier:</label>
                <input
                  type="text"
                  name="supplier"
                  value={material.supplier || ""}
                  onChange={handleChange}
                  disabled
                  className= 'w-full border-0 focus:ring-0 p-1 bg-gray-100' 
                />
              </div>
              
              <div className= 'border-b border-gray-300 pb-2'>
                <label className= 'text-sm font-medium text-gray-700' >Grade:</label>
                <input
                  type="text"
                  name="grade"
                  value={material.grade || ""}
                  onChange={handleChange}
                  disabled
                  className= 'w-full border-0 focus:ring-0 p-1 bg-gray-100'
                />
              </div>
              
              <div className= 'border-b border-gray-300 pb-2'>
                <label className= 'text-sm font-medium text-gray-700'>Customer:</label>
                <input
                  type="text"
                  name="customer"
                  value={material.customer || ""}
                  onChange={handleChange}
                  disabled
                  className='w-full border-0 focus:ring-0 p-1 bg-gray-100'
                />
              </div>
            </div>

            {/* Second row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className= 'border-b border-gray-300 pb-2' >
                <label className= 'text-sm font-medium text-gray-700'>Standard:</label>
                <input
                  type="text"
                  name="standerd"
                  value={material.standerd || ""}
                  onChange={handleChange}
                  className='w-full border-0 focus:ring-0 p-1' 
                />
              </div>
              
              <div className='border-b border-gray-300 pb-2'>
                <label className= 'text-sm font-medium text-gray-700'>Heat No:</label>
                <input
                  type="text"
                  name="heatno"
                  value={material.heatno || ""}
                  onChange={handleChange}
                  disabled
                  className= 'w-full border-0 focus:ring-0 p-1 bg-gray-100' 
                />
              </div>
              
              <div className= 'border-b border-gray-300 pb-2' >
                <label className= 'text-sm font-medium text-gray-700'>Diameter:</label>
                <input
                  type="text"
                  name="dia"
                  value={material.dia || ""}
                  onChange={handleChange}
                  disabled
                  className='w-full border-0 focus:ring-0 p-1 bg-gray-100' 
                />
              </div>
              
              <div className='border-b border-gray-300 pb-2'>
                <label className= 'text-sm font-medium text-gray-700'>Weight:</label>
                <input
                  type="number"
                  step="0.01"
                  name="weight"
                  value={material.weight || ""}
                  onChange={handleChange}
                  className= 'w-full border-0 focus:ring-0 p-1' 
                />
              </div>
            </div>

            {/* Third row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className= 'border-b border-gray-300 pb-2' >
                <label className= 'text-sm font-medium text-gray-700'>Rack No:</label>
                <input
                  type="text"
                  name="rack_no"
                  value={material.rack_no || ""}
                  onChange={handleChange}
                  disabled
                  className= 'w-full border-0 focus:ring-0 p-1 bg-gray-100' 
                />
              </div>
              
              <div className='border-b border-gray-300 pb-2'>
                <label className= 'text-sm font-medium text-gray-700'>Location:</label>
                <input
                  type="text"
                  name="location"
                  value={material.location || ""}
                  onChange={handleChange}
                  disabled
                  className= 'w-full border-0 focus:ring-0 p-1 bg-gray-100' 
                />
              </div>
              
              <div className= 'border-b border-gray-300 pb-2'>
                <label className= 'text-sm font-medium text-gray-700' >Type of Material:</label>
                <input
                  type="text"
                  name="type_of_material"
                  value={material.type_of_material || ""}
                  onChange={handleChange}
                  disabled
                  className='w-full border-0 focus:ring-0 p-1 bg-gray-100'
                />
              </div>
              
              <div className= 'border-b border-gray-300 pb-2' >
                <label className='text-sm font-medium text-gray-700'>Cost Per Kg:</label>
                <input
                  type="number"
                  step="0.01"
                  name="cost_per_kg"
                  value={material.cost_per_kg || ""}
                  onChange={handleChange}
                  disabled
                  className= 'w-full border-0 focus:ring-0 p-1 bg-gray-100' 
                />
              </div>
            </div>

            {/* Fourth row with file inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className= 'border-b border-gray-300 pb-2'>
                <label className= 'text-sm font-medium text-gray-700' >Invoice No:</label>
                <input
                  type="text"
                  name="invoice_no"
                  value={material.invoice_no || ""}
                  onChange={handleChange}
                  className='w-full border-0 focus:ring-0 p-1' 
                />
              </div>
              
              <div className='border-b border-gray-300 pb-2' >
                <label className='text-sm font-medium text-gray-700'>Mill TC:</label>
                <input 
                  type="file" 
                  name="milltc" 
                  onChange={handleFileChange} 
                  className= 'w-full text-sm' 
                />
                {material.milltc && (
                  <div className="mt-1">
                    <a
                      href={material.milltc}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 underline text-sm"
                    >
                      View Existing File
                    </a>
                  </div>
                )}
              </div>
              
              <div className= 'border-b border-gray-300 pb-2' >
                <label className='text-sm font-medium text-gray-700' >Spectro:</label>
                <input 
                  type="file" 
                  name="spectro" 
                  onChange={handleFileChange} 
                  className='w-full text-sm' 
                />
                {material.spectro && (
                  <div className="mt-1">
                    <a
                      href={material.spectro}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 underline text-sm"
                    >
                      View Existing File
                    </a>
                  </div>
                )}
              </div>
              
              <div className='border-b border-gray-300 pb-2'>
                <label className='text-sm font-medium text-gray-700' >SSB Inspection Report:</label>
                <input
                  type="file"
                  name="ssb_inspection_report"
                  onChange={handleFileChange}
                  className= 'w-full text-sm' 
                />
                {material.ssb_inspection_report && (
                  <div className="mt-1">
                    <a
                      href={material.ssb_inspection_report}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 underline text-sm"
                    >
                      View Existing File
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Customer Approval row (conditionally shown) */}
            {isSpecialCustomer() && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className= 'border-b border-gray-300 pb-2'>
                  <label className= 'text-sm font-medium text-gray-700'>Customer Approval:</label>
                  <input
                    type="file"
                    name="customer_approval"
                    onChange={handleFileChange}
                    className= 'w-full text-sm' 
                  />
                  {material.customer_approval && (
                    <div className="mt-1">
                      <a
                        href={material.customer_approval}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 underline text-sm"
                      >
                        View Existing File
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Final row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className='border-b border-gray-300 pb-2' >
                <label className='text-sm font-medium text-gray-700'>Verified By:</label>
                <input
                  type="text"
                  name="verified_by"
                  value={material.verified_by || ""}
                  onChange={handleChange}
                  disabled
                  className= 'w-full border-0 focus:ring-0 p-1 bg-gray-100' 
                />
              </div>
              
              <div className= 'border-b border-gray-300 pb-2' >
                <label className='text-sm font-medium text-gray-700'>Approval Status:</label>
                <select
                  name="approval_status"
                  value={material.approval_status || ""}
                  onChange={handleChange}
                  className='w-full border-0 focus:ring-0 p-1'
                >
                  <option value="Under Inspection">Under Inspection</option>
                  {isFilesPreAttached && (
                    <>
                      {(areAllRequiredFilesAttached() || isFilesPreAttached) && (
                        <option value="Approved">Approved</option>
                      )}
                      <option value="Hold">Hold</option>
                      <option value="Rejected">Rejected</option>
                    </>
                  )}
                </select>
              </div>
              
              <div className='border-b border-gray-300 pb-2'>
                <label className= 'text-sm font-medium text-gray-700'>Comments:</label>
                <textarea
                  name="comments"
                  value={material.comments || ""}
                  onChange={handleChange}
                  className= 'w-full border-0 focus:ring-0 p-1' 
                />
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-4">
              <button 
                type="submit" 
                className='bg-blue-600 text-white px-4 py-2 rounded text-sm' 
              >
                Update
              </button>
              <button
                type="button"
                onClick={onBack}
                className= 'bg-gray-500 text-white px-4 py-2 rounded text-sm' 
              >
                Back to List
              </button>
              <button
                type="button"
                onClick={() => {
                  handlePrint();
                  setTimeout(() => {
                    window.location.reload();
                  }, 1000);
                }}
                className='bg-green-600 text-white px-4 py-2 rounded text-sm' 
              >
                Print Tag
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className='bg-red-600 text-white px-4 py-2 rounded text-sm' 
              >
                Delete Material
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
};

export default RawMaterialDetail;