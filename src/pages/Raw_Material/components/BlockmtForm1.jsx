import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Sidebar } from "../../Navigation/Sidebar";
import DashboardHeader from "../../Navigation/DashboardHeader";


const BlockmtForm = ({ schedule, onClose }) => {
  const [formData, setFormData] = useState({
    component: schedule?.component || '',
    customer: '',
    supplier: '',
    grade1: '',
    standerd: '',
    heatno: '',
    slug_weight: '',
    dia: '',
    rack_no: '',
    pices: '',
    line: '',
    weight: '',
    
    verified_by: '',
    Available_Rm: '',
  });
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
    
      const toggleSidebar = () => {
        setIsSidebarVisible(!isSidebarVisible);
      };
      const pageTitle = "Planning Cheq For Component & Material"; // Set the page title here

  // Fetch user details on component mount
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

  // Fetch component suggestions
  const fetchComponentSuggestions = async (query) => {
    setLoadingSuggestions(true);
    try {
      const response = await axios.get('http://192.168.1.199:8001/raw_material/components/', {
        params: { component: query },
      });
      setSuggestions(response.data);
    } catch (error) {
      console.error('Error fetching component suggestions:', error);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleInputChange = async (field, value) => {
    setFormData((prevFormData) => ({
      ...prevFormData,
      [field]: value,
    }));

    // Fetch component suggestions if the 'component' field is being updated
    if (field === 'component' && value) {
      fetchComponentSuggestions(value);
    }

    // Handle other field changes, like "pices" (pieces)
    if (field === 'pices') {
      const pieces = parseFloat(value);
      const slugWeight = parseFloat(formData.slug_weight);
      const availableRm = parseFloat(formData.Available_Rm);

      if (!isNaN(slugWeight) && !isNaN(pieces)) {
        const calculatedWeight = (slugWeight * pieces) * 1.03;

        if (!isNaN(availableRm) && calculatedWeight > availableRm) {
          alert('RM not available: Calculated weight exceeds the Available RM.');
          setFormData((prevFormData) => ({
            ...prevFormData,
            weight: '',
            pices: '',
          }));
        } else {
          setFormData((prevFormData) => ({
            ...prevFormData,
            weight: calculatedWeight.toFixed(2),
          }));
        }
      } else {
        setFormData((prevFormData) => ({
          ...prevFormData,
          weight: '',
        }));
      }
    }
  };

  const handleSelectSuggestion = (component) => {
    setFormData((prevFormData) => ({
      ...prevFormData,
      component,
    }));

    // Fetch part details for the selected component
    const fetchPartDetails = async () => {
      try {
        const response = await axios.get('http://192.168.1.199:8001/raw_material/get-part-details/', {
          params: { component },
        });
        const data = response.data;

        setFormData((prevFormData) => ({
          ...prevFormData,
          customer: data.customer,
          grade1: data.material_grade,
          dia: data.bar_dia,
          slug_weight: data.slug_weight,
        }));

        if (data.material_grade && data.bar_dia && data.customer) {
          const additionalResponse = await axios.get('http://192.168.1.199:8001/raw_material/get-part-details1/', {
            params: {
              grade: data.material_grade,
              dia: data.bar_dia,
              customer: data.customer,
            },
          });
          const additionalData = additionalResponse.data;

          setFormData((prevFormData) => ({
            ...prevFormData,
            supplier: additionalData.supplier,
            grade: additionalData.grade,
            standerd: additionalData.standerd_rm,
            heatno: additionalData.heatno,
            rack_no: additionalData.rack_no,
            Available_Rm: additionalData.weight_diff,
          }));
        } else {
          console.log('Grade or diameter value is missing');
        }
      } catch (error) {
        console.error('Error fetching part details:', error);
        alert('Material not Avaliable.');
        setFormData((prevFormData) => ({
          ...prevFormData,
          component: '',
          customer: '',
          grade1: '',
          dia: '',
          slug_weight: '',
        }));
      }
    };

    fetchPartDetails();
    setSuggestions([]); // Clear suggestions after selection
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://192.168.1.199:8001/raw_material/create-blockmt/', formData);
      alert(`Blockmt created successfully. Blockmt ID: ${response.data.block_mt_id}`);
      
      // Clear all fields and suggestions after successful submission
      setFormData({
        component: '',
        customer: '',
        supplier: '',
        grade1: '',
        standerd: '',
        heatno: '',
        dia: '',
        rack_no: '',
        pices: '',
        line: '',
        weight: '',
        slug_weight: '',
        verified_by: '',
        Available_Rm: '',
      });
      setSuggestions([]); // Clear suggestions
      // Refresh the page
    window.location.reload();
  
    } catch (error) {
      alert('Failed to add Blockmt.');
      console.error('Error:', error);
    }
  };
  

  return (
    <div className="flex">
    {/* Sidebar */}
    <div
      className={`fixed top-0 left-0 h-full transition-all duration-300 ${
        isSidebarVisible ? "w-64" : "w-0 overflow-hidden"
      }`}
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
    <form onSubmit={handleSubmit} className="bg-white shadow-lg rounded-2xl p-6 w-full " autoComplete="off">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {Object.keys(formData).map((key) => {
          if (key === 'line') {
            return (
              <div key={key} className="flex flex-col">
                <label className="text-gray-700 font-medium mb-1 capitalize">Line:</label>
                <select
                  name="line"
                  value={formData.line}
                  onChange={(e) => handleInputChange(key, e.target.value)}
                  className="form-input"
                  required
                >
                  <option value="">Select Line</option>
                  <option value="FFL">FFL</option>
                  <option value="NHF-1000">NHF-1000</option>
                  <option value="1600 TON">1600 TON</option>
                  <option value="HAMMER1">HAMMER1</option>
                  <option value="HAMMER2">HAMMER2</option>
                  <option value="A-SET">A-SET</option>
                  <option value="W-SET">W-SET</option>
                  <option value="CNC">CNC</option>
                  
                </select>
              </div>
            );
          }

          return (
            <div key={key} className="flex flex-col">
              <label className="text-gray-700 font-medium mb-1 capitalize">{key.replace('_', ' ')}:</label>
              <input
                type={key === 'weight' || key === 'slug_weight' ? 'number' : 'text'}
                name={key}
                value={formData[key]}
                onChange={(e) => handleInputChange(key, e.target.value)}
                step={key === 'weight' || key === 'slug_weight' ? '0.01' : undefined}
                className="border rounded-lg p-2 text-gray-700 focus:ring focus:ring-blue-300"
                required={key !== 'verified_by'}
                readOnly={['customer', 'supplier','slug_weight', 'grade','grade1', 'standerd', 'heatno', 'dia', 'rack_no', 'Available_Rm','verified_by'].includes(key)}
              />
              {key === 'component' && (
                <ul className="absolute z-50 border rounded-lg mt-20 p-2 bg-white shadow-lg max-h-40 overflow-auto w-80">
                  {loadingSuggestions ? (
                    <li>Loading...</li>
                  ) : (
                    suggestions.map((suggestion) => (
                      <li key={suggestion} onClick={() => handleSelectSuggestion(suggestion)}>
                        {suggestion}
                      </li>
                    ))
                  )}
                </ul>
              )}
            </div>
          );
        })}
      </div>
      
    </form>
    </main>
  </div>
</div>

  );
};

export default BlockmtForm;
