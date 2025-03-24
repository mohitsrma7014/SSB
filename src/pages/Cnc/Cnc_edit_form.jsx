import React, { useState, useEffect } from "react";
import axios from "axios";

const Cnc_edit_form = ({ forging, onClose }) => {
  const [formData, setFormData] = useState({
    batch_number: "",
    date: "",
    shift: "",
    component: "",
    machine_no: "",
    mc_type: "",
    operator: "",
    inspector: "",
    setup: "",
    target: "",
    production: "",
    remark: "",
    cnc_height: "",
    cnc_od: "",
    cnc_bore: "",
    cnc_groove: "",
    cnc_dent: "",
    forging_height: "",
    forging_od: "",
    forging_bore: "",
    forging_crack: "",
    forging_dent: "",
    pre_mc_height: "",
    pre_mc_od: "",
    pre_mc_bore: "",
    rework_height: "",
    rework_od: "",
    rework_bore: "",
    rework_groove: "",
    rework_dent: "",
    verified_by: "",
    heat_no: "",
  });

  // Set form data when editing a forging
  useEffect(() => {
    if (forging && forging.id) {
      setFormData(forging);
    }
  }, [forging]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (formData.id) {
        // Update record
        await axios.put(
          `http://192.168.1.199:8001/cnc/MachiningViewSet/${formData.id}/`,
          formData
        );
      } else {
        // Create new record
        await axios.post(
          "http://192.168.1.199:8001/cnc/MachiningViewSet/",
          formData
        );
      }
      onClose(); // Close the form after saving
    } catch (error) {
      console.error("Error saving the Heat-Treatment m/c", error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start z-50 pt-16">
      <div className="bg-white p-6 rounded-lg w-full max-w-7xl shadow-lg overflow-y-auto">
        <h2 className="text-2xl mb-6">{formData.id ? "Edit Forging" : "Add Forging"}</h2>
        <form onSubmit={handleSubmit}>
          {/* Grid Layout for Fields */}
          <div className="grid grid-cols-2 md:grid-cols-8 gap-2">
            <div className="mb-4">
              <label className="block font-medium">Batch Number:</label>
              <input
                type="text"
                name="batch_number"
                value={formData.batch_number}
                onChange={handleChange}
                disabled
                className="w-full px-4 py-2 border rounded-md"
              />
            </div>
            <div className="mb-4">
              <label className="block font-medium">Date:</label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-md"
              />
            </div>
            <div className="mb-4">
              <label className="block font-medium">shift:</label>
              <input
                type="text"
                name="shift"
                value={formData.shift}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-md"
              />
            </div>
            
            <div className="mb-4">
              <label className="block font-medium">Component:</label>
              <input
                type="text"
                name="component"
                disabled
                value={formData.component}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-md"
              />
            </div>
            <div className="mb-4">
              <label className="block font-medium">Heat No:</label>
              <input
                type="text"
                name="heat_no"
                disabled
                value={formData.heat_no}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-md"
              />
            </div>
            <div className="mb-4">
              <label className="block font-medium">Machine no.:</label>
              <input
                type="text"
                name="machine_no"
                value={formData.machine_no}
                
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-md"
              />
            </div>
            <div className="mb-4">
              <label className="block font-medium">Machine Type:</label>
              <input
                type="text"
                name="mc_type"
                value={formData.mc_type}
                disabled
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-md"
              />
            </div>
            
            <div className="mb-4">
              <label className="block font-medium">Operator:</label>
              <input
                type="text"
                name="operator"
                value={formData.operator}
                disabled
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-md"
              />
            </div>
            <div className="mb-4">
              <label className="block font-medium">Inspector:</label>
              <input
                type="text"
                name="inspector"
                value={formData.inspector}
                disabled
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-md"
              />
            </div>
            <div className="mb-4">
              <label className="block font-medium">Setup:</label>
              <input
                type="text"
                name="setup"
                value={formData.setup}
                disabled
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-md"
              />
            </div>
            <div className="mb-4">
              <label className="block font-medium">Target:</label>
              <input
                type="number"
                name="target"
                value={formData.target}
                disabled
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-md"
              />
            </div>
            <div className="mb-4">
              <label className="block font-medium">Production:</label>
              <input
                type="number"
                name="production"
                value={formData.production}
                
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-md"
              />
            </div>
            <div className="mb-4">
              <label className="block font-medium">Remark:</label>
              <input
                type="text"
                name="remark"
                value={formData.remark}
                
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-md"
              />
            </div>
            <div className="mb-4">
              <label className="block font-medium">Cnc-Height:</label>
              <input
                type="number"
                name="cnc_height"
                value={formData.cnc_height}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-md"
              />
            </div>
            <div className="mb-4">
              <label className="block font-medium">Cnc-Od:</label>
              <input
                type="number"
                name="cnc_od"
                value={formData.cnc_od}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-md"
              />
            </div>
            <div className="mb-4">
              <label className="block font-medium">Cnc-Bore:</label>
              <input
                type="number"
                name="cnc_bore"
                value={formData.cnc_bore}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-md"
              />
            </div>
            <div className="mb-4">
              <label className="block font-medium">Cnc-Groove:</label>
              <input
                type="number"
                name="cnc_groove"
                value={formData.cnc_groove}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-md"
              />
            </div>
            <div className="mb-4">
              <label className="block font-medium">Cnc-Dent:</label>
              <input
                type="number"
                name="cnc_dent"
                value={formData.cnc_dent}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-md"
              />
            </div>
            <div className="mb-4">
              <label className="block font-medium">Forging-Height:</label>
              <input
                type="number"
                name="forging_height"
                value={formData.forging_height}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-md"
              />
            </div>
            <div className="mb-4">
              <label className="block font-medium">Forging-Od:</label>
              <input
                type="number"
                name="forging_od"
                value={formData.forging_od}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-md"
              />
            </div>
            <div className="mb-4">
              <label className="block font-medium">Forging-Bore:</label>
              <input
                type="number"
                name="forging_bore"
                value={formData.forging_bore}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-md"
              />
            </div>
            <div className="mb-4">
              <label className="block font-medium">Forging-Crack:</label>
              <input
                type="number"
                name="forging_crack"
                value={formData.forging_crack}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-md"
              />
            </div>
            <div className="mb-4">
              <label className="block font-medium">Forging-Dent:</label>
              <input
                type="number"
                name="forging_dent"
                value={formData.forging_dent}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-md"
              />
            </div>
            <div className="mb-4">
              <label className="block font-medium">Pre-Mc-Height:</label>
              <input
                type="number"
                name="pre_mc_height"
                value={formData.pre_mc_height}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-md"
              />
            </div>
            <div className="mb-4">
              <label className="block font-medium">Pre-Mc-Od:</label>
              <input
                type="number"
                name="pre_mc_od"
                value={formData.pre_mc_od}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-md"
              />
            </div>
            <div className="mb-4">
              <label className="block font-medium">Pre-Mc-Bore:</label>
              <input
                type="number"
                name="pre_mc_bore"
                value={formData.pre_mc_bore}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-md"
              />
            </div>
            <div className="mb-4">
              <label className="block font-medium">Rework-Bore:</label>
              <input
                type="number"
                name="rework_height"
                value={formData.rework_height}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-md"
              />
            </div>
            <div className="mb-4">
              <label className="block font-medium">Rework-Bore:</label>
              <input
                type="number"
                name="rework_od"
                value={formData.rework_od}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-md"
              />
            </div>
            <div className="mb-4">
              <label className="block font-medium">Rework-Bore:</label>
              <input
                type="number"
                name="rework_bore"
                value={formData.rework_bore}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-md"
              />
            </div>
            <div className="mb-4">
              <label className="block font-medium">Rework-Groove:</label>
              <input
                type="number"
                name="rework_groove"
                value={formData.rework_groove}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-md"
              />
            </div>
            <div className="mb-4">
              <label className="block font-medium">Rework-Dent:</label>
              <input
                type="number"
                name="rework_dent"
                value={formData.rework_dent}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-md"
              />
            </div>
           
            
            
            
            
            
            <div className="mb-4">
              <label className="block font-medium">Verified By:</label>
              <input
                type="text"
                name="verified_by"
                disabled
                value={formData.verified_by}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-md"
              />
            </div>
          </div>

          {/* Submit and Cancel Buttons */}
          <div className="flex justify-between mt-6">
            <button
              type="submit"
              className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600"
            >
              Save
            </button>
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-500 text-white px-6 py-2 rounded-md hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Cnc_edit_form;