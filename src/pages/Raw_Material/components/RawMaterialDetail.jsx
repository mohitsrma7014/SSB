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
  const [showCustomerSwitch, setShowCustomerSwitch] = useState(false);
  const [showRackMove, setShowRackMove] = useState(false);
  const [newCustomer, setNewCustomer] = useState("");
  const [moveQty, setMoveQty] = useState("");
  const [newRackNo, setNewRackNo] = useState("");
  const [availableWeight, setAvailableWeight] = useState(0);
  const [error, setError] = useState("");
  const [fetchingWeight, setFetchingWeight] = useState(false);
  const [customerSuggestions, setCustomerSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);

   const fetchCustomerSuggestions = async (query) => {
    if (query.length < 2) {
      setCustomerSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    
    setIsFetchingSuggestions(true);
    try {
      const response = await axios.get(
        `http://192.168.1.199:8001/raw_material/customers_suggestions/`,
        { params: { q: query } }
      );
      // Handle both array response and potential object response
      let suggestions = Array.isArray(response.data) ? 
        response.data : 
        (response.data.suggestions || []);
      
      // Ensure we have an array of strings
      suggestions = suggestions.map(item => String(item).trim());
      
      setCustomerSuggestions(suggestions);
      setShowSuggestions(suggestions.length > 0);
    } catch (error) {
      console.error("Error fetching customer suggestions:", error);
      setCustomerSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setIsFetchingSuggestions(false);
    }
  };

  const handleCustomerInputChange = (e) => {
    const value = e.target.value;
    setNewCustomer(value);
    fetchCustomerSuggestions(value);
  };

  const selectCustomerSuggestion = (suggestion) => {
    setNewCustomer(suggestion);
    setShowSuggestions(false);
    setCustomerSuggestions([]);
  };


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

  const normalizeString = (str) => {
    if (!str) return '';
    return String(str).trim().toLowerCase();
  };

  const checkMaterialAvailability = async () => {
  setFetchingWeight(true);
  setError("");
  
  try {
    const response = await axios.get(
      `http://192.168.1.199:8001/raw_material/api/material-availability-check/`,
      {
        params: {
          heatno: normalizeString(material.heatno),
          dia: normalizeString(material.dia),
          supplier: normalizeString(material.supplier),
          customer: normalizeString(material.customer),
          invoice_no: normalizeString(material.invoice_no),
          grade: normalizeString(material.grade),
            date: material.date,
            rack_no: material.rack_no
        }
      }
    );

    if (response.data.available) {
      setAvailableWeight(response.data.available_weight);
      return true;
    } else {
      setError(response.data.message || "Material not available");
      setAvailableWeight(0);
      return false;
    }
  } catch (error) {
    console.error("Error checking material availability:", error);
    setError(`API Error: ${error.message}`);
    setAvailableWeight(0);
    return false;
  } finally {
    setFetchingWeight(false);
  }
};

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
      await axios.put(
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

  const isSpecialCustomer = () => {
    return material && (normalizeString(material.customer).includes('hero motors') || 
                       normalizeString(material.customer).includes('dana'));
  };

  const areAllRequiredFilesAttached = () => {
    if (isSpecialCustomer()) {
      return files.milltc && files.spectro && files.ssb_inspection_report;
    }
    return files.milltc && files.spectro && files.ssb_inspection_report;
  };

  const isFilesPreAttached = material && (
    (material.milltc && !files.milltc) ||
    (material.spectro && !files.spectro) ||
    (material.ssb_inspection_report && !files.ssb_inspection_report) ||
    (isSpecialCustomer() && material.customer_approval && !files.customer_approval)
  );

  const handleSwitchCustomer = async () => {
    if (!newCustomer || !moveQty) {
      setError("Please fill all fields");
      return;
    }

    const qty = parseFloat(moveQty);
    if (isNaN(qty) || qty <= 0) {
      setError("Please enter a valid quantity");
      return;
    }

    if (qty > availableWeight) {
      setError(`Quantity cannot exceed available weight (${availableWeight})`);
      return;
    }

    try {
      // Create new material with the specified quantity
      const newMaterialData = {
        ...material,
        customer: newCustomer,
        weight: qty,
        id: null // This will create a new record
      };

      // Update current material with remaining weight
      // Update current material with remaining weight
      const remainingWeight = parseFloat(material.weight) - qty;
      const updateCurrentData = {
        ...material,
        weight: remainingWeight
      };

      const updateFormData = new FormData();
for (const key in material) {
  if (
    material[key] !== null &&
    material[key] !== undefined &&
    key !== "milltc" &&
    key !== "spectro" &&
    key !== "ssb_inspection_report" &&
    key !== "customer_approval"
  ) {
    updateFormData.append(key, material[key]);
  }
}
updateFormData.set("weight", remainingWeight); // override weight

// Optional: if you also want to update files in PUT (not necessary here), append them
if (files.milltc) updateFormData.append("milltc", files.milltc);
if (files.spectro) updateFormData.append("spectro", files.spectro);
if (files.ssb_inspection_report) updateFormData.append("ssb_inspection_report", files.ssb_inspection_report);
if (files.customer_approval) updateFormData.append("customer_approval", files.customer_approval);

// Send PUT with multipart/form-data
await axios.put(
  `http://192.168.1.199:8001/raw_material/api/RawMaterialCreateViewput/${materialId}/`,
  updateFormData,
  {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  }
);

      const formData = new FormData();

    // Append all regular fields
    for (const key in newMaterialData) {
      if (
        newMaterialData[key] !== null &&
        newMaterialData[key] !== undefined &&
        key !== "milltc" &&
        key !== "spectro" &&
        key !== "ssb_inspection_report" &&
        key !== "customer_approval"
      ) {
        formData.append(key, newMaterialData[key]);
      }
    }

    // Append file fields from the files state
    if (files.milltc) formData.append("milltc", files.milltc);
    if (files.spectro) formData.append("spectro", files.spectro);
    if (files.ssb_inspection_report) formData.append("ssb_inspection_report", files.ssb_inspection_report);
    if (files.customer_approval) formData.append("customer_approval", files.customer_approval);

    // POST new material (create in new rack)
    await axios.post(
      "http://192.168.1.199:8001/raw_material/api/RawMaterialCreateViewput/",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      }
    );

      alert("Material successfully allocated to new customer!");
      window.location.reload();
    } catch (error) {
      console.error("Error switching customer:", error);
      setError(`Failed to switch customer: ${error.message}`);
    }
  };

  const handleMoveRack = async () => {
  if (!newRackNo) {
    setError("Please enter a rack number");
    return;
  }

  const qty = parseFloat(moveQty);
  if (isNaN(qty) || qty <= 0) {
    setError("Please enter a valid quantity");
    return;
  }

  if (qty > availableWeight) {
    setError(`Quantity cannot exceed available weight (${availableWeight})`);
    return;
  }

  try {
    // Step 1: Prepare FormData for POST
    const newMaterialData = {
      ...material,
      rack_no: newRackNo,
      weight: qty,  // Use the moved quantity
      id: null // This ensures it's treated as a new record
    };

     // Update current material with remaining weight
      const remainingWeight = parseFloat(material.weight) - qty;
      const updateCurrentData = {
        ...material,
        weight: remainingWeight
      };

      const updateFormData = new FormData();
for (const key in material) {
  if (
    material[key] !== null &&
    material[key] !== undefined &&
    key !== "milltc" &&
    key !== "spectro" &&
    key !== "ssb_inspection_report" &&
    key !== "customer_approval"
  ) {
    updateFormData.append(key, material[key]);
  }
}
updateFormData.set("weight", remainingWeight); // override weight

// Optional: if you also want to update files in PUT (not necessary here), append them
if (files.milltc) updateFormData.append("milltc", files.milltc);
if (files.spectro) updateFormData.append("spectro", files.spectro);
if (files.ssb_inspection_report) updateFormData.append("ssb_inspection_report", files.ssb_inspection_report);
if (files.customer_approval) updateFormData.append("customer_approval", files.customer_approval);

// Send PUT with multipart/form-data
await axios.put(
  `http://192.168.1.199:8001/raw_material/api/RawMaterialCreateViewput/${materialId}/`,
  updateFormData,
  {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  }
);

    const formData = new FormData();

    // Append all regular fields
    for (const key in newMaterialData) {
      if (
        newMaterialData[key] !== null &&
        newMaterialData[key] !== undefined &&
        key !== "milltc" &&
        key !== "spectro" &&
        key !== "ssb_inspection_report" &&
        key !== "customer_approval"
      ) {
        formData.append(key, newMaterialData[key]);
      }
    }

    // Append file fields from the files state
    if (files.milltc) formData.append("milltc", files.milltc);
    if (files.spectro) formData.append("spectro", files.spectro);
    if (files.ssb_inspection_report) formData.append("ssb_inspection_report", files.ssb_inspection_report);
    if (files.customer_approval) formData.append("customer_approval", files.customer_approval);

    // POST new material (create in new rack)
    await axios.post(
      "http://192.168.1.199:8001/raw_material/api/RawMaterialCreateViewput/",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      }
    );
    alert("Material successfully moved to new rack!");
    onBack();
  } catch (error) {
    console.error("Error moving rack:", error);
    setError(`Failed to move rack: ${error.message}`);
  }
};


  const openCustomerSwitchModal = async () => {
  setShowCustomerSwitch(true);
  setNewCustomer("");
  setMoveQty("");
  
  // Check availability before showing modal
  const isAvailable = await checkMaterialAvailability();
  
  if (!isAvailable) {
    setShowCustomerSwitch(false);
  }
};

const openRackMoveModal = async () => {
  setShowRackMove(true);
  setNewRackNo("");
  
  // Check availability before showing modal
  const isAvailable = await checkMaterialAvailability();
  
  if (isAvailable) {
    // Set the move quantity to the available weight by default
    setMoveQty(availableWeight.toString());
  } else {
    setShowRackMove(false);
  }
};


  if (loading) {
    return <p>Loading material details...</p>;
  }

  return (
    <div className='bg-gray-100 p-20'>
      {showPrintSlip ? (
        <PrintSlip material={material} />
      ) : (
        <>
          {/* Customer Switch Modal */}
          {showCustomerSwitch && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded shadow-lg w-96">
                <h3 className="text-lg font-bold mb-4">Switch to Other Customer</h3>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">New Customer:</label>
          <input
            type="text"
            value={newCustomer}
            onChange={handleCustomerInputChange}
            onFocus={() => newCustomer.length >= 2 && setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            className="w-full border rounded p-2"
            autoComplete="off"
          />
          {showSuggestions && (
            <ul className="absolute z-10 w-120 mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
              {isFetchingSuggestions ? (
                <li className="px-4 py-2 text-gray-500">Loading...</li>
              ) : customerSuggestions.length > 0 ? (
                customerSuggestions.map((customer, index) => (
                  <li
                    key={index}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                    onMouseDown={() => selectCustomerSuggestion(customer)}
                  >
                    {customer}
                  </li>
                ))
              ) : (
                <li className="px-4 py-2 text-gray-500">No suggestions found</li>
              )}
            </ul>
          )}
        </div>
                <div className="mb-4">
  <label className="block text-sm font-medium text-gray-700 mb-1">
    Quantity to Move (Available: {availableWeight > 0 ? availableWeight : 'Not Available'}):
  </label>
  <input
    type="number"
    step="0.01"
    value={moveQty}
    onChange={(e) => setMoveQty(e.target.value)}
    className="w-full border rounded p-2"
    disabled={fetchingWeight || availableWeight <= 0}
  />
</div>
                {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
                {fetchingWeight && <p className="text-sm text-gray-500 mb-4">Checking available weight...</p>}
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => {
                      setShowCustomerSwitch(false);
                      setError("");
                    }}
                    className="bg-gray-500 text-white px-4 py-2 rounded"
                    disabled={fetchingWeight}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSwitchCustomer}
                    className="bg-blue-600 text-white px-4 py-2 rounded"
                    disabled={fetchingWeight}
                  >
                    OK
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Rack Move Modal */}
            {showRackMove && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded shadow-lg w-96">
                  <h3 className="text-lg font-bold mb-4">Move to Another Rack</h3>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">New Rack No:</label>
                    <input
                      type="text"
                      value={newRackNo}
                      onChange={(e) => setNewRackNo(e.target.value)}
                      className="w-full border rounded p-2"
                      disabled={fetchingWeight}
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quantity to Move (Available: {availableWeight > 0 ? availableWeight : 'Not Available'}):
                    </label>
                    <input
    type="number"
    step="0.01"
    value={moveQty}
    onChange={(e) => setMoveQty(e.target.value)}
    className="w-full border rounded p-2"
    disabled={fetchingWeight || availableWeight <= 0}
  />
                  </div>
                  {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
                  {fetchingWeight && <p className="text-sm text-gray-500 mb-4">Checking available weight...</p>}
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => {
                        setShowRackMove(false);
                        setError("");
                      }}
                      className="bg-gray-500 text-white px-4 py-2 rounded"
                      >
                        Cancel
                      </button>
                    <button
                      onClick={handleMoveRack}
                      className="bg-blue-600 text-white px-4 py-2 rounded"
                      disabled={fetchingWeight}
                    >
                      Move
                    </button>
                  </div>
                </div>
              </div>
            )}

          {/* Rest of your form remains the same */}
            <form onSubmit={handleUpdate} className='bg-white p-6 rounded shadow'>
            {/* First row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className='border-b border-gray-300 pb-2'>
                <label className='text-sm font-medium text-gray-700'>Date:</label>
                <input
                  type="date"
                  name="date"
                  value={material.date || ""}
                  onChange={handleChange}
                  className='w-full border-0 focus:ring-0 p-1'
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
                  className='w-full border-0 focus:ring-0 p-1 bg-gray-100' 
                />
              </div>
              
              <div className='border-b border-gray-300 pb-2'>
                <label className='text-sm font-medium text-gray-700'>Grade:</label>
                <input
                  type="text"
                  name="grade"
                  value={material.grade || ""}
                  onChange={handleChange}
                  disabled
                  className='w-full border-0 focus:ring-0 p-1 bg-gray-100'
                />
              </div>
              
              <div className='border-b border-gray-300 pb-2'>
                <label className='text-sm font-medium text-gray-700'>Customer:</label>
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
              <div className='border-b border-gray-300 pb-2' >
                <label className='text-sm font-medium text-gray-700'>Standard:</label>
                <input
                  type="text"
                  name="standerd"
                  value={material.standerd || ""}
                  onChange={handleChange}
                  className='w-full border-0 focus:ring-0 p-1' 
                />
              </div>
              
              <div className='border-b border-gray-300 pb-2'>
                <label className='text-sm font-medium text-gray-700'>Heat No:</label>
                <input
                  type="text"
                  name="heatno"
                  value={material.heatno || ""}
                  onChange={handleChange}
                  disabled
                  className='w-full border-0 focus:ring-0 p-1 bg-gray-100' 
                />
              </div>
              
              <div className='border-b border-gray-300 pb-2' >
                <label className='text-sm font-medium text-gray-700'>Diameter:</label>
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
                <label className='text-sm font-medium text-gray-700'>Weight:</label>
                <input
                  type="number"
                  step="0.01"
                  name="weight"
                  value={material.weight || ""}
                  onChange={handleChange}
                  className='w-full border-0 focus:ring-0 p-1' 
                />
              </div>
            </div>

            {/* Third row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className='border-b border-gray-300 pb-2' >
                <label className='text-sm font-medium text-gray-700'>Rack No:</label>
                <input
                  type="text"
                  name="rack_no"
                  value={material.rack_no || ""}
                  onChange={handleChange}
                  disabled
                  className='w-full border-0 focus:ring-0 p-1 bg-gray-100' 
                />
              </div>
              
              <div className='border-b border-gray-300 pb-2'>
                <label className='text-sm font-medium text-gray-700'>Location:</label>
                <input
                  type="text"
                  name="location"
                  value={material.location || ""}
                  onChange={handleChange}
                  disabled
                  className='w-full border-0 focus:ring-0 p-1 bg-gray-100' 
                />
              </div>
              
              <div className='border-b border-gray-300 pb-2'>
                <label className='text-sm font-medium text-gray-700'>Type of Material:</label>
                <input
                  type="text"
                  name="type_of_material"
                  value={material.type_of_material || ""}
                  onChange={handleChange}
                  disabled
                  className='w-full border-0 focus:ring-0 p-1 bg-gray-100'
                />
              </div>
              
              <div className='border-b border-gray-300 pb-2' >
                <label className='text-sm font-medium text-gray-700'>Cost Per Kg:</label>
                <input
                  type="number"
                  step="0.01"
                  name="cost_per_kg"
                  value={material.cost_per_kg || ""}
                  onChange={handleChange}
                  disabled
                  className='w-full border-0 focus:ring-0 p-1 bg-gray-100' 
                />
              </div>
            </div>

            {/* Fourth row with file inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className='border-b border-gray-300 pb-2'>
                <label className='text-sm font-medium text-gray-700'>Invoice No:</label>
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
                  className='w-full text-sm' 
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
              
              <div className='border-b border-gray-300 pb-2' >
                <label className='text-sm font-medium text-gray-700'>Spectro:</label>
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
                <label className='text-sm font-medium text-gray-700'>SSB Inspection Report:</label>
                <input
                  type="file"
                  name="ssb_inspection_report"
                  onChange={handleFileChange}
                  className='w-full text-sm' 
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
                <div className='border-b border-gray-300 pb-2'>
                  <label className='text-sm font-medium text-gray-700'>Customer Approval:</label>
                  <input
                    type="file"
                    name="customer_approval"
                    onChange={handleFileChange}
                    className='w-full text-sm' 
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
                  className='w-full border-0 focus:ring-0 p-1 bg-gray-100' 
                />
              </div>
              
              <div className='border-b border-gray-300 pb-2' >
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
                <label className='text-sm font-medium text-gray-700'>Comments:</label>
                <textarea
                  name="comments"
                  value={material.comments || ""}
                  onChange={handleChange}
                  className='w-full border-0 focus:ring-0 p-1' 
                />
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-4 flex-wrap">
              <button 
                type="submit" 
                className='bg-blue-600 text-white px-4 py-2 rounded text-sm' 
              >
                Update
              </button>
              <button
                type="button"
                onClick={onBack}
                className='bg-gray-500 text-white px-4 py-2 rounded text-sm' 
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
              <button
  type="button"
  onClick={openCustomerSwitchModal}
  className='bg-purple-600 text-white px-4 py-2 rounded text-sm' 
  disabled={fetchingWeight || !material}
>
  Switch to Other Customer
</button>
<button
  type="button"
  onClick={openRackMoveModal}
  className='bg-yellow-600 text-white px-4 py-2 rounded text-sm' 
  disabled={fetchingWeight || !material}
>
  Move Rack
</button>
            </div>
          </form>
        </>
      )}
    </div>
  );
};

export default RawMaterialDetail;