import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import { Sidebar } from "../../Navigation/Sidebar";
import DashboardHeader from "../../Navigation/DashboardHeader";

function CreateComplaint() {
  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm();
  const [heatSuggestions, setHeatSuggestions] = useState([]);
  const [componentSuggestions, setComponentSuggestions] = useState([]);
  const [selectedHeat, setSelectedHeat] = useState(false);
  const [selectedComponents, setSelectedComponents] = useState([]);
  const [componentInput, setComponentInput] = useState("");
  const [isComponentDropdownOpen, setIsComponentDropdownOpen] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [complaintPhoto, setComplaintPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  
  const heatNo = watch("heat") || "";
  const components = watch("components") || "";

  // Fetch heat suggestions
  useEffect(() => {
    if (heatNo.length > 2 && !selectedHeat) {
      axios.get(`http://192.168.1.199:8001/raw_material/heat-suggestions/?q=${heatNo}`)
        .then((res) => setHeatSuggestions(res.data.heatno || []))
        .catch(() => setHeatSuggestions([]));
    } else {
      setHeatSuggestions([]);
    }
  }, [heatNo, selectedHeat]);

  // Fetch component suggestions
  useEffect(() => {
    if (componentInput.length > 1) {
      axios.get('http://192.168.1.199:8001/raw_material/components/', {
        params: { component: componentInput },
      })
      .then((res) => {
        const suggestions = Array.isArray(res.data) ? res.data : [];
        setComponentSuggestions(suggestions);
        setIsComponentDropdownOpen(suggestions.length > 0);
      })
      .catch(() => {
        setComponentSuggestions([]);
        setIsComponentDropdownOpen(false);
      });
    } else {
      setComponentSuggestions([]);
      setIsComponentDropdownOpen(false);
    }
  }, [componentInput]);

  // Handle heat selection
  const handleHeatSelection = (heat) => {
    setValue("heat", heat);
    setSelectedHeat(true);
    setHeatSuggestions([]);

    axios.get(`http://192.168.1.199:8001/raw_material/heat-details/${heat}/`)
      .then((res) => {
        setValue("supplier", res.data.supplier);
        setValue("grade", res.data.grade);
        setValue("dia", res.data.dia);
      })
      .catch(() => {
        setValue("supplier", "");
        setValue("grade", "");
        setValue("dia", "");
        setSelectedHeat(false);
      });
  };

  // Handle component selection
  const handleComponentSelection = (component) => {
    if (!selectedComponents.includes(component)) {
      const newComponents = [...selectedComponents, component];
      setSelectedComponents(newComponents);
      setValue("components", newComponents.join(", "), { shouldValidate: true });
      setComponentInput("");
      setComponentSuggestions([]);
      setIsComponentDropdownOpen(false);
    }
  };

  // Handle component input change
  const handleComponentInputChange = (e) => {
    const value = e.target.value;
    setComponentInput(value);
    
    if (value.endsWith(",")) {
      const componentToAdd = value.slice(0, -1).trim();
      if (componentSuggestions.includes(componentToAdd)) {
        handleComponentSelection(componentToAdd);
      } else if (componentToAdd) {
        alert(`"${componentToAdd}" is not a valid component. Please select from suggestions.`);
        setComponentInput("");
      }
    }
  };

  // Handle component input focus
  const handleComponentFocus = () => {
    if (componentInput.length > 1 && componentSuggestions.length > 0) {
      setIsComponentDropdownOpen(true);
    }
  };

  // Remove invalid components when form loses focus
  const handleComponentBlur = () => {
    setTimeout(() => {
      setIsComponentDropdownOpen(false);
      if (componentInput) {
        setComponentInput("");
      }
    }, 200);
  };

  // Remove a selected component
  const removeComponent = (indexToRemove) => {
    const updated = selectedComponents.filter((_, idx) => idx !== indexToRemove);
    setSelectedComponents(updated);
    setValue("components", updated.join(", "), { shouldValidate: true });
  };

  // Handle complaint photo upload
  const handleComplaintPhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setComplaintPhoto(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Remove complaint photo
  const removeComplaintPhoto = () => {
    setComplaintPhoto(null);
    setPhotoPreview(null);
    setValue("Complaint_photo", null);
  };

  // Fetch user data for verified_by
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
        setValue("verified_by", fullName);
      } catch (err) {
        console.error('Error fetching user details:', err);
      }
    };

    fetchUserData();
  }, [setValue]);

  // Submit form
  const onSubmit = async (data) => {
    try {
      // Create FormData for file upload
      const formData = new FormData();
      
      
      // Append all form data
      for (const key in data) {
        if (key !== "Complaint_photo") {
          formData.append(key, data[key]);
        }
      }
      
      // Append components as singular 'component'
      formData.append("component", selectedComponents.join(", "));
      
      // Append the complaint photo if exists
      if (complaintPhoto) {
        formData.append("Complaint_photo", complaintPhoto);
      }
      
      await axios.post("http://192.168.1.199:8001/raw_material/create-complaint/", formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      // Show success popup
      setShowSuccessPopup(true);
      
      // Reset form after 2 seconds
      setTimeout(() => {
        resetForm();
        setShowSuccessPopup(false);
      }, 2000);
      
    } catch (error) {
      console.error("Error details:", error.response?.data);
      alert(`Error creating complaint: ${error.response?.data?.message || error.message}`);
    }
  };

  // Reset form to initial state
  const resetForm = () => {
    reset({
      heat: "",
      supplier: "",
      grade: "",
      dia: "",
      complaint_date: "",
      location: "",
      components: "",
      issue: "",
      remark: "",
      pices: "",
      verified_by: watch("verified_by"), // Keep the verified_by value
      Complaint_photo: null
    });
    setSelectedHeat(false);
    setSelectedComponents([]);
    setComponentInput("");
    setComplaintPhoto(null);
    setPhotoPreview(null);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md relative">
      {/* Success Popup */}
      {showSuccessPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                <svg
                  className="h-6 w-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h3 className="mt-3 text-lg font-medium text-gray-900">Success!</h3>
              <div className="mt-2 px-4 py-3">
                <p className="text-sm text-gray-500">Complaint created successfully!</p>
              </div>
              <div className="mt-4">
                <button
                  type="button"
                  className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm"
                  onClick={() => {
                    setShowSuccessPopup(false);
                    resetForm();
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <h2 className="text-xl font-bold mb-6">Create New Complaint</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Row 1 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">Heat Number*</label>
            <input 
              {...register("heat", { required: true })} 
              placeholder="Enter heat number" 
              className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500" 
              required 
            />
            {heatSuggestions.length > 0 && (
              <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded shadow-lg">
                {heatSuggestions.map((heat, index) => (
                  <li 
                    key={index} 
                    onClick={() => handleHeatSelection(heat)} 
                    className="p-2 hover:bg-blue-50 cursor-pointer"
                  >
                    {heat}
                  </li>
                ))}
              </ul>
            )}
          </div>
  
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Supplier*</label>
            <input 
              {...register("supplier", { required: true })} 
              className="w-full p-2 border border-gray-300 rounded bg-gray-100" 
              readOnly 
              required 
            />
          </div>
  
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Grade*</label>
            <input 
              {...register("grade", { required: true })} 
              className="w-full p-2 border border-gray-300 rounded bg-gray-100" 
              readOnly 
              required 
            />
          </div>
  
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Diameter*</label>
            <input 
              {...register("dia", { required: true })} 
              type="number" 
              className="w-full p-2 border border-gray-300 rounded bg-gray-100" 
              readOnly 
              required 
            />
          </div>
        </div>
  
        {/* Row 2 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Complaint Date*</label>
            <input 
              {...register("complaint_date", { required: true })} 
              type="date" 
              className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500" 
              required 
            />
          </div>

  
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location*</label>
            <select 
              {...register("location", { required: true })} 
              className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Select Location</option>
              <option value="Internal">Internal</option>
              <option value="External">External</option>
            </select>
          </div>
  
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">Components*</label>
            <input 
              value={componentInput}
              onChange={handleComponentInputChange}
              onFocus={handleComponentFocus}
              onBlur={handleComponentBlur}
              placeholder="Type and select components" 
              className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500" 
            />
            <input 
              type="hidden" 
              {...register("components", { required: true })} 
            />
            
            {isComponentDropdownOpen && componentSuggestions.length > 0 && (
              <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded shadow-lg max-h-60 overflow-auto">
                {componentSuggestions.map((component, index) => (
                  <li 
                    key={index} 
                    onClick={() => handleComponentSelection(component)} 
                    className="p-2 hover:bg-blue-50 cursor-pointer"
                  >
                    {component}
                  </li>
                ))}
              </ul>
            )}
            
            {selectedComponents.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {selectedComponents.map((comp, idx) => (
                  <span key={idx} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm flex items-center">
                    {comp}
                    <button 
                      type="button"
                      onClick={() => removeComponent(idx)}
                      className="ml-1 text-red-500 hover:text-red-700"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
            {errors.components && (
              <p className="mt-1 text-sm text-red-600">Please select valid components</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Verified By*</label>
            <input 
              {...register("verified_by", { required: true })} 
              className="w-full p-2 border border-gray-300 rounded bg-gray-100" 
              readOnly 
              required 
            />
          </div>
        </div>

        {/* Row 3 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">No Of Pieces*</label>
            <input 
              {...register("pices", { required: true })} 
              type="number"
              placeholder="Enter number of pieces" 
              className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500" 
              required 
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Complaint Photo</label>
            <div className="flex items-center">
              <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded border border-gray-300">
                <span>Choose File</span>
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/*"
                  onChange={handleComplaintPhotoChange}
                />
              </label>
              {photoPreview && (
                <div className="ml-2 relative">
                  <img src={photoPreview} alt="Preview" className="h-10 w-10 object-cover rounded" />
                  <button 
                    type="button"
                    onClick={removeComplaintPhoto}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
  
        {/* Full-width fields */}
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Issue*</label>
            <textarea 
              {...register("issue", { required: true })} 
              placeholder="Describe the issue" 
              className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500" 
              rows={3}
              required 
            />
          </div>
  
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Remark</label>
            <textarea 
              {...register("remark")} 
              placeholder="Additional remarks" 
              className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500" 
              rows={3}
            />
          </div>
        </div>
  
        <div className="flex justify-end pt-4">
          <button 
            type="submit" 
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
          >
            Submit Complaint
          </button>
        </div>
      </form>
    </div>
  );
}

function Complant() {
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const toggleSidebar = () => setIsSidebarVisible(!isSidebarVisible);
  const pageTitle = "Complaint Management";

  return (
    <div className="flex">
      <CreateComplaint />
    </div>
  );
}

export default Complant;