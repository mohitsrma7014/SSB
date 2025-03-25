import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Sidebar } from "../../Navigation/Sidebar";
import DashboardHeader from "../../Navigation/DashboardHeader";

const RawMaterialForm = () => {
  const initialFormData = {
    date: '',
    supplier: '',
    grade: '',
    customer: '',
    standerd: '',
    heatno: '',
    dia: '',
    weight: '',
    rack_no: '',
    location: '',
    type_of_material: '',
    cost_per_kg: '',
    invoice_no: '',
    verified_by: '',
  };
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
    
      const toggleSidebar = () => {
        setIsSidebarVisible(!isSidebarVisible);
      };
      const pageTitle = "Raw Material reciving"; // Set the page title here

  const [formData, setFormData] = useState(initialFormData);
  const [suggestions, setSuggestions] = useState({
    supplier: [],
    grade: [],
    customer: [],
    type_of_material: [],
    location: [],
  });

  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axios.get('http://192.168.1.199:8001/api/user-details/', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
        });
        const { name, lastname } = response.data;
        const fullName = `${name} ${lastname}`;
        setFormData((prevFormData) => ({ ...prevFormData, verified_by: fullName }));
      } catch (err) {
        console.error('Error fetching user details:', err);
        alert('Failed to fetch user details. Please check your credentials and try again.');
      }
    };

    fetchUserData();
  }, []);

  const handleInputChange = async (field, value) => {
    setErrorMessage('');
    setFormData({ ...formData, [field]: value });

    // Fetch suggestions only for the specified fields
    const suggestionFields = ['supplier', 'grade', 'customer', 'location', 'type_of_material'];
    if (suggestionFields.includes(field) && value.length > 1) {
      try {
        const response = await axios.get(`http://192.168.1.199:8001/raw_material/${field}s_suggestions/`, {
          params: { q: value },
        });
        setSuggestions((prev) => ({ ...prev, [field]: response.data }));
      } catch (error) {
        console.error(`Failed to fetch ${field} suggestions:`, error);
      }
    } else {
      // If the field is not in the list, clear suggestions
      setSuggestions((prev) => ({ ...prev, [field]: [] }));
    }
  };

  const handleSuggestionClick = (field, value) => {
    setFormData({ ...formData, [field]: value });
    setSuggestions((prev) => ({ ...prev, [field]: [] })); // Clear suggestions
  };

  const handleBlur = (field) => {
    const suggestionFields = ['supplier', 'grade', 'customer', 'location', 'type_of_material'];
    if (suggestionFields.includes(field)) {
      // If suggestions are empty or the field value is not a valid suggestion, clear the field
      if (!suggestions[field]?.includes(formData[field])) {
        setFormData((prevData) => ({ ...prevData, [field]: '' }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    if (!formData.verified_by) {
      alert('Verified By field is required and cannot be empty.');
      return;
    }
  
    try {
      const response = await axios.post('http://192.168.1.199:8001/raw_material/api/raw-materials/', formData);
      console.log('Success:', response.data);
      alert('Raw material added successfully!');
  
      // Reset form but keep "verified_by" intact
      setFormData((prevData) => ({
        ...initialFormData,
        verified_by: prevData.verified_by, // Keep verified_by
      }));
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to add raw material.');
    }
  };
  

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
    <div
      className={`flex flex-col flex-grow transition-all duration-300 ${
        isSidebarVisible ? "ml-64" : "ml-0"
      }`}
    >
      <DashboardHeader isSidebarVisible={isSidebarVisible} toggleSidebar={toggleSidebar} title={pageTitle} />


    

      {/* Main Content */}
      <main className="flex flex-col mt-20  justify-center flex-grow pl-2">
        <form onSubmit={handleSubmit} className="bg-white shadow-lg rounded-2xl p-6 w-full " autoComplete="off"> {/* Add autoComplete="off" */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {Object.keys(formData).map((key) => (
              <div key={key} className="flex flex-col">
                <label className="text-gray-700 font-medium mb-1 capitalize">{key.replace('_', ' ')}:</label>
                <input
                  type={
                    key === 'date'
                      ? 'date'
                      : key === 'weight' || key === 'cost_per_kg'
                      ? 'number'
                      : 'text'
                  }
                  name={key}
                  value={formData[key]}
                  onChange={(e) => handleInputChange(key, e.target.value)}
                  onBlur={() => handleBlur(key)} // Clear value if suggestions are empty for the relevant fields
                  onFocus={() => setErrorMessage('')} // Clear error message on focus
                  step={key === 'weight' || key === 'cost_per_kg' ? '0.01' : undefined}
                  className="border rounded-lg p-2 text-gray-700 focus:ring focus:ring-blue-300"
                  readOnly={key === 'verified_by'} // Make verified_by field non-editable
                  required={key !== 'verified_by'} // Optional for the verified_by field
                  autoComplete="off" // Disable autocomplete on each input field
                />
                {suggestions[key]?.length > 0 && (
                  <ul className="absolute z-50 border rounded-lg mt-20 p-2 bg-white shadow-lg max-h-40 overflow-auto w-80">
                    {suggestions[key].map((suggestion, index) => (
                      <li
                        key={index}
                        onClick={() => handleSuggestionClick(key, suggestion)}
                        className="cursor-pointer hover:bg-blue-100 p-1 rounded"
                      >
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
          {errorMessage && <p className="error-message">{errorMessage}</p>}
          <button type="submit" className="w-full mt-6 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition">Recive Material</button>
        </form>
      </main>
      </div>
      
    </div>
  );
};

export default RawMaterialForm;
