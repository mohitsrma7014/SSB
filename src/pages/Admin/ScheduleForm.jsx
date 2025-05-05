import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css"; // Import styles
import { Sidebar } from "../Navigation/Sidebar";
import DashboardHeader from "../Navigation/DashboardHeader";

function ScheduleForm() {
    
    const [formData, setFormData] = useState({
        component: '',
        customer: '',
        grade: '',
        standerd: '',
        dia: '',
        slug_weight: '',
        pices: '',
        weight: '',
        date1: null, // Set to null for DatePicker
        location: '',
        verified_by: '',
    });

    const [suggestions, setSuggestions] = useState([]);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);
    const [isSidebarVisible, setIsSidebarVisible] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarVisible(!isSidebarVisible);
  };
  const pageTitle = "Add Customer Schedule"; // Set the page title here

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await axios.get(`http://192.168.1.199:8001/api/user-details/`, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
                    },
                });
                const { name, lastname } = response.data;
                setFormData((prevFormData) => ({
                    ...prevFormData,
                    verified_by: `${name} ${lastname}`,
                }));
            } catch (err) {
                console.error('Error fetching user details:', err);
                alert('Failed to fetch user details. Please check your credentials and try again.');
            }
        };

        fetchUserData();
    }, []);

    const fetchComponentSuggestions = async (query) => {
        setLoadingSuggestions(true);
        try {
            const response = await axios.get(`http://192.168.1.199:8001/raw_material/components/`, {
                params: { component: query },
            });
            setSuggestions(response.data);
        } catch (error) {
            console.error('Error fetching component suggestions:', error);
        } finally {
            setLoadingSuggestions(false);
        }
    };

    const handleInputChange = (field, value) => {
        setFormData((prevFormData) => ({
            ...prevFormData,
            [field]: value,
        }));

        if (field === 'component' && value) {
            fetchComponentSuggestions(value);
        }

        if (field === 'pices') {
            const pieces = parseFloat(value);
            const slugWeight = parseFloat(formData.slug_weight);

            if (!isNaN(slugWeight) && !isNaN(pieces)) {
                const calculatedWeight = (slugWeight * pieces) * 1.03;
                setFormData((prevFormData) => ({
                    ...prevFormData,
                    weight: calculatedWeight.toFixed(2),
                }));
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

        const fetchPartDetails = async () => {
            try {
                const response = await axios.get(`http://192.168.1.199:8001/raw_material/get-part-details/`, {
                    params: { component },
                });
                const data = response.data;

                setFormData((prevFormData) => ({
                    ...prevFormData,
                    standerd: data.standerd,
                    customer: data.customer,
                    grade: data.material_grade,
                    dia: data.bar_dia,
                    slug_weight: data.slug_weight,
                }));
            } catch (error) {
                console.error('Error fetching part details:', error);
                alert('Please enter a correct part number.');
                setFormData((prevFormData) => ({
                    ...prevFormData,
                    component: '',
                    customer: '',
                    grade: '',
                    dia: '',
                    slug_weight: '',
                }));
            }
        };

        fetchPartDetails();
        setSuggestions([]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
    
        // Validation for required fields
        if (!formData.date1 || !formData.location || !formData.verified_by) {
            alert('Please fill out all required fields: Date1, Location, Verified By.');
            return;
        }
    
        try {
            const response = await axios.post(
                `http://192.168.1.199:8001/raw_material/ScheduleViewSet/`,
                formData,
                {
                    headers: { 'Content-Type': 'application/json' },
                }
            );
            console.log('Success:', response.data);
            alert('Form submitted successfully!');
    
            // Instead of reloading, reset the form
            setFormData({
                component: '',
                customer: '',
                grade: '',
                standerd: '',
                dia: '',
                slug_weight: '',
                pices: '',
                weight: '',
                date1: null,
                location: '',
                verified_by: formData.verified_by, // Keep the verified_by value
            });
    
            // If this component is used within Schedule, you might want to:
            // 1. Pass a callback from parent to refresh data
            // 2. Or use a state management solution
            // For now, we'll just clear the form
    
        } catch (error) {
            console.error('Error submitting the form:', error);
            alert('Failed to submit the form. Please try again.');
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
        <form onSubmit={handleSubmit} className="bg-white shadow-lg rounded-2xl p-6 w-full ">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {Object.keys(formData).map((key) => (
                        <div key={key} className="flex flex-col">
                            <label className="text-gray-700 font-medium mb-1 capitalize">{key.replace('_', ' ')}:</label>
                            {key === 'location' ? (
                                <select
                                    name={key}
                                    value={formData[key]}
                                    onChange={(e) => handleInputChange(key, e.target.value)}
                                    className="border rounded-lg p-2 text-gray-700 focus:ring focus:ring-blue-300"
                                    required
                                >
                                    <option value="">Select Location</option>
                                    <option value=" ">Without location</option>
                                    <option value="Noida">Noida</option>
                                    <option value="Sanand">Sanand</option>
                                    <option value="Belgaum">Belgaum</option>
                                </select>
                            ) : key === 'date1' ? (
                                <DatePicker
                                    selected={formData.date1}
                                    onChange={(date) => handleInputChange('date1', date)}
                                    dateFormat="yyyy-MM-dd"
                                    className="border rounded-lg p-2 text-gray-700 focus:ring focus:ring-blue-300"
                                    placeholderText="Select a date"
                                    required
                                />
                            ) : (
                                <input
                                    type={['weight', 'slug_weight'].includes(key) ? 'number' : 'text'}
                                    name={key}
                                    value={formData[key]}
                                    onChange={(e) => handleInputChange(key, e.target.value)}
                                    step={['weight', 'slug_weight'].includes(key) ? '0.01' : undefined}
                                    className="border rounded-lg p-2 text-gray-700 focus:ring focus:ring-blue-300"
                                    required={['date1', 'location', 'verified_by'].includes(key)}
                                    readOnly={['customer', 'slug_weight', 'grade', 'standerd', 'dia', 'verified_by'].includes(key)}
                                />
                            )}
                            {key === 'component' && (
                                <ul className="absolute z-50 border rounded-lg mt-20 p-2 bg-white shadow-lg max-h-40 overflow-auto w-80">
                                    {loadingSuggestions ? (
                                        <li className="text-gray-500">Loading...</li>
                                    ) : (
                                        suggestions.map((suggestion) => (
                                            <li 
                                                key={suggestion} 
                                                className="cursor-pointer hover:bg-blue-100 p-1 rounded" 
                                                onClick={() => handleSelectSuggestion(suggestion)}
                                            >
                                                {suggestion}
                                            </li>
                                        ))
                                    )}
                                </ul>
                            )}

                        </div>
                    ))}
                </div>
                <button type="submit" className="w-full mt-6 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition">
                Add Schedule
                </button>
            </form>
            </main>
        </div>
        </div>

    );
}

export default ScheduleForm;
