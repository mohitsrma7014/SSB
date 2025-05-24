import { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "../../Navigation/Sidebar";
import DashboardHeader from "../../Navigation/DashboardHeader";

const CreateOrder = () => {
  const [form, setForm] = useState({
    supplier: "",
    rm_grade: "",
    rm_standard: "",
    bar_dia: "",
    qty: "",
    po_date: "",
    po_number: "",
    verified_by: "",
    supplier_details: "",
    supplier_gstin: "",
    price: "", // New field
    payment_terms:"",
    note:"",
    manual_date:"",
    price_basis:"",
    blank_note:"",
  });
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState([]);
  const [grades, setGrades] = useState([]); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
    
  const toggleSidebar = () => {
    setIsSidebarVisible(!isSidebarVisible);
  };
  const pageTitle = "Create Order";

  // Fetch suppliers
  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const response = await fetch("http://192.168.1.199:8001/raw_material/suppliers/");
        if (!response.ok) throw new Error("Failed to fetch suppliers");
        const data = await response.json();
        setSuppliers(data);
      } catch (err) {
        setError("Error fetching suppliers: " + err.message);
      }
    };

    fetchSuppliers();
  }, []);

  // Fetch RM Grades
  useEffect(() => {
    const fetchGrades = async () => {
      try {
        const response = await fetch("http://192.168.1.199:8001/raw_material/grades/");
        if (!response.ok) throw new Error("Failed to fetch grades");
        const data = await response.json();
        setGrades(data);
      } catch (err) {
        setError("Error fetching grades: " + err.message);
      }
    };

    fetchGrades();
  }, []);

  // Fetch user details for "verified_by"
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axios.get(
          "http://192.168.1.199:8001/api/user-details/",
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
          }
        );
        const { name, lastname } = response.data;
        setForm((prevForm) => ({
          ...prevForm,
          verified_by: `${name} ${lastname}`,
        }));
      } catch (error) {
        console.error("Error fetching user details:", error);
        alert("Failed to fetch user details.");
      }
    };

    fetchUserData();
  }, []);

  // Handle supplier selection change
  const handleSupplierChange = async (e) => {
    const supplierId = e.target.value;
    setForm({...form, supplier: supplierId});
    
    if (supplierId) {
      try {
        const response = await fetch(`http://192.168.1.199:8001/raw_material/supplier/${supplierId}/`);
        if (!response.ok) throw new Error("Failed to fetch supplier details");
        const data = await response.json();
        
        setForm(prev => ({
          ...prev,
          supplier_details: data.supplier_details || "",
          supplier_gstin: data.supplier_gstin || "",
        }));
      } catch (err) {
        console.error("Error fetching supplier details:", err);
      }
    } else {
      // Clear supplier details if no supplier selected
      setForm(prev => ({
        ...prev,
        supplier_details: "",
        supplier_gstin: "",
      }));
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("http://192.168.1.199:8001/raw_material/api/orders/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplier: parseInt(form.supplier, 10),
          rm_grade: form.rm_grade,
          rm_standard: form.rm_standard,
          bar_dia: parseFloat(form.bar_dia),
          qty: parseInt(form.qty, 10),
          po_date: form.po_date,
          po_number: form.po_number,
          verified_by: form.verified_by || null,
          price: parseFloat(form.price) || 0, // Include price in submission
          supplier_details: form.supplier_details,
          supplier_gstin: form.supplier_gstin,
          payment_terms: form.payment_terms,
          note: form.note,
          manual_date: form.manual_date,
          price_basis: form.price_basis,
          blank_note: form.blank_note,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Something went wrong!");
      }

      alert("Order Created Successfully!");
      setForm({
        supplier: "",
        rm_grade: "",
        rm_standard: "",
        bar_dia: "",
        qty: "",
        po_date: "",
        po_number: "",
        verified_by: form.verified_by,
        supplier_details: "",
        supplier_gstin: "",
        price: "",
        payment_terms:"",
        note:"",
        manual_date:"",
         price_basis:"",
          blank_note:"",
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
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

        <main className="flex flex-col mt-20 justify-center flex-grow pl-2 p-6">
          <div className="flex justify-between items-center mb-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-green-500 text-white px-2 py-1 rounded-lg shadow-md hover:bg-green-600 transition-all flex items-center gap-2"
              onClick={() => navigate("/Orders")}
            >
              <span>Back To List</span>
            </motion.button>
          </div>
          {error && <p className="text-red-500">{error}</p>}
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            {/* Supplier Dropdown */}
            <select
              className="border p-2 rounded col-span-2"
              name="supplier"
              value={form.supplier}
              onChange={handleSupplierChange} // Changed to handleSupplierChange
              required
            >
              <option value="">Select Supplier</option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </select>

            {/* Auto-filled supplier details */}
            <input
              className="border p-2 rounded bg-gray-100"
              name="supplier_details"
              placeholder="Supplier Details"
              value={form.supplier_details}
              required
            />
            <input
              className="border p-2 rounded bg-gray-100"
              name="supplier_gstin"
              placeholder="Supplier GSTIN"
              value={form.supplier_gstin}
              required
            />
            

            {/* New price field */}
           

            {/* RM Grade Dropdown */}
            <select
              className="border p-2 rounded col-span-2"
              name="rm_grade"
              value={form.rm_grade}
              onChange={handleChange}
              required
            >
              <option value="">Select RM Grade</option>
              {grades.map((grade) => (
                <option key={grade.id} value={grade.name}>
                  {grade.name}
                </option>
              ))}
            </select>
            <input className="border p-2 rounded" name="payment_terms" placeholder="Payment Term Days" value={form.payment_terms} onChange={handleChange} required />

            <input className="border p-2 rounded" name="rm_standard" placeholder="RM Standard" value={form.rm_standard} onChange={handleChange} required />
            <input className="border p-2 rounded" name="bar_dia" type="number" step="0.01" placeholder="Bar Diameter" value={form.bar_dia} onChange={handleChange} required />
            <input className="border p-2 rounded" name="qty" type="number" placeholder="Quantity" value={form.qty} onChange={handleChange} required />
            <input
              className="border p-2 rounded"
              name="price"
              type="number"
              step="0.01"
              placeholder="Price"
              value={form.price}
              onChange={handleChange}
              required
            />
            <input className="border p-2 rounded" name="po_date" type="date" value={form.po_date} onChange={handleChange} required />
            <input className="border p-2 rounded" name="note"  step="0.01" placeholder="Note" value={form.note} onChange={handleChange} required />
            <input className="border p-2 rounded" name="manual_date"  placeholder="Develary Time" value={form.manual_date} onChange={handleChange} required />
            <input className="border p-2 rounded" name="price_basis"  placeholder="Price Basis" value={form.price_basis} onChange={handleChange} required />
            <input className="border p-2 rounded" name="blank_note"  placeholder="Any Additional Note" value={form.blank_note} onChange={handleChange} required />
            {/* Verified By (Auto-filled & Readonly) */}
            <input
              className="border p-2 rounded bg-gray-100"
              name="verified_by"
              placeholder="Verified By"
              value={form.verified_by}
              readOnly
            />

            <button className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600 col-span-2" type="submit" disabled={loading}>
              {loading ? "Submitting..." : "Submit"}
            </button>
          </form>
        </main>
      </div>
    </div>
  );
};

export default CreateOrder;