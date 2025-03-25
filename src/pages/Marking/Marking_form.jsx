import React, { useState, useEffect } from "react";
import axios from "axios";
import { Sidebar } from "../Navigation/Sidebar";
import DashboardHeader from "../Navigation/DashboardHeader";

const Marking_form = () => {
  const [date, setDate] = useState("");
  const [shift, setShift] = useState("");
  const [verifiedBy, setVerifiedBy] = useState("");
  const [rows, setRows] = useState([
    {
        batch_number: "",
        heat_no: "",
        component: "",
        machine: "",
        operator: "",
        target: "",
        total_produced:"",
        qty: "",
    },
  ]);
  const [rowSuggestions, setRowSuggestions] = useState([]); // To store suggestions for each row
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const shiftOptions = ["DAY", "NIGHT"]; // Dropdown options for shift
  const lineOptions = ["Kamal", "Anil", "Anoop","Sandeep","Sorav","Chetan","Mahaveer","Deendyal","Satish","Shyamu","Keshav","Guddu","Manoj","Vinod","Aniket"]; // Dropdown options for line
  const formanOptions = ["Jitendra", "Ram", "Shambhu","Rajkumar"]; // Dropdown options for forman
  const lineInchargeOptions = ["Santosh", "Devendra", "Rahul","Neeraj","Somveer","Lal Chand"];

  const [isSidebarVisible, setIsSidebarVisible] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarVisible(!isSidebarVisible);
  };
  const pageTitle = "Add Marking  Data"; // Set the page title here


  const fetchComponentSuggestions = async (query, index) => {
    if (!query) {
      setRowSuggestions((prevSuggestions) => {
        const newSuggestions = [...prevSuggestions];
        newSuggestions[index] = [];
        return newSuggestions;
      });
      return;
    }

    setLoadingSuggestions(true);
    try {
      const response = await axios.get(
       
        "http://192.168.1.199:8001/raw_material/autocompleteforging/",
        { params: { block_mt_id: query } }
    );
      setRowSuggestions((prevSuggestions) => {
        const newSuggestions = [...prevSuggestions];
        newSuggestions[index] = response.data;
        return newSuggestions;
      });
    } catch (error) {
      console.error("Error fetching component suggestions:", error);
    } finally {
      setLoadingSuggestions(false);
    }
  };
  const [componentSuggestionss, setComponentSuggestionss] = useState([]); // Component suggestions state
  const [isQuerying, setIsQuerying] = useState(false); // Track if a query is ongoing

  const fetchComponentSuggestionss = async (query, index) => {
    if (!query || isQuerying) {
        // Clear suggestions for this row if query is empty
        setComponentSuggestions((prev) => {
            const newSuggestions = [...prev];
            newSuggestions[index] = [];
            return newSuggestions;
        });
        return;
    }
    setIsQuerying(true);
    setLoadingSuggestions(true);
    try {
        const response = await axios.get(
            "http://192.168.1.199:8001/raw_material/components/",
            { params: { component: query } }
        );
        setComponentSuggestionss((prev) => {
            const newSuggestions = [...prev];
            newSuggestions[index] = response.data;
            return newSuggestions;
        });
    } catch (error) {
        console.error("Error fetching component suggestions:", error);
    } finally {
        setIsQuerying(false);
        setLoadingSuggestions(false);
    }
};


  const fetchPartDetails = async (batch_number, index) => {
    try {
      // First API call to get part details
      const partDetailsResponse = await axios.get(
       "http://192.168.1.199:8001/raw_material/get_part_detailsforging/",
        { params: { block_mt_id: batch_number } }
      );
      const partData = partDetailsResponse.data;
  
      // Second API call to get target details (total production)
      const targetDetailsResponse = await axios.get(
        "http://192.168.1.199:8001/marking/get-target-details3/",
        { params: { batch_no: batch_number } }
      );
      const targetData = targetDetailsResponse.data;
  
      // Update the rows state with the fetched data
      setRows((prevRows) => {
        const updatedRows = [...prevRows];
        updatedRows[index] = {
          ...updatedRows[index],
          component: partData.component || "",
          heat_no: partData.heatno || "",
          target: partData.pices || "",
          total_produced: targetData.total_production || "", // Fill the total production field
        };
        return updatedRows;
      });
  
      // Clear suggestions after successful data retrieval
      setRowSuggestions((prevSuggestions) => {
        const newSuggestions = [...prevSuggestions];
        newSuggestions[index] = [];
        return newSuggestions;
      });
    } catch (error) {
      console.error("Error fetching part details or target details:", error);
      alert("Please enter a correct batch number.");
      setRows((prevRows) => {
        const updatedRows = [...prevRows];
        updatedRows[index] = {
          ...updatedRows[index],
          batch_number: "",
          component: "",
          heat_no: "",
          target:"",
          total_produced: "", // Clear total production on error
        };
        return updatedRows;
      });
      // Clear suggestions after failed fetch
      setRowSuggestions((prevSuggestions) => {
        const newSuggestions = [...prevSuggestions];
        newSuggestions[index] = [];
        return newSuggestions;
      });
    }
  };
  

  const handleRowChange = (index, field, value) => {
    // Define fields that should be read-only
    const readOnlyFields = [ "heat_no","total_produced","target"];
    // Prevent updating read-only fields
    if (readOnlyFields.includes(field)) {
      return;
    }

    // Validate the 'production' field
    if (field === "qty") {
      const currentRow = rows[index];
      const totalProduction = parseFloat(currentRow.total_produced) || 0;
      const target = parseFloat(currentRow.target) || 0;
      const production = parseFloat(value) || 0;
      const productionLimit = target - totalProduction + 5000;
      // Check if production exceeds the sum of target + total_production
      if (production > productionLimit) {
        alert("Production cannot exceed.");
        return;
      }
    }
    if (field === "component" && value) {
      fetchComponentSuggestionss(value, index);
    }
  
    const updatedRows = [...rows];
    updatedRows[index][field] = value;
    setRows(updatedRows);
  
    // Only fetch suggestions when 'batch_number' field changes
    if (field === "batch_number" && value) {
      fetchComponentSuggestions(value, index);
    }
  };
  
  const handleSelectSuggestion = (index, suggestion) => {
    // Set the batch number from the selected suggestion
    handleRowChange(index, "batch_number", suggestion);
    // Fetch part details for the selected suggestion
    fetchPartDetails(suggestion, index);
  };

  const addRow = () => {
    setRows([
      ...rows,
      {
        batch_number: "",
        heat_no: "",
        component: "",
        machine: "",
        operator: "",
        target: "",
        total_produced:"",
        qty: "",
     
      },
    ]);
    setRowSuggestions([...rowSuggestions, []]); // Initialize an empty suggestions array for the new row
    setComponentSuggestionss([...componentSuggestionss, []]);
  };

  const removeRow = (index) => {
    setRows(rows.filter((_, i) => i !== index));
    setRowSuggestions(rowSuggestions.filter((_, i) => i !== index)); // Remove the suggestions for the deleted row
  };
  const handleSelectComponent = (index, suggestion) => {
    setRows((prevRows) => {
      const updatedRows = [...prevRows];
      updatedRows[index].component = suggestion; // Update the component value for the specific row
      return updatedRows;
    });
    setComponentSuggestionss([]); // Clear suggestions globally
    setIsQuerying(false); // Mark querying as completed
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation for required fields (line, line_incharge, and forman)
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (!row.qty| !row.operator  ) {
        alert(`Please fill in all required fields for row ${i + 1}.`);
        return;
      }
    }

    // Automatically set missing values to 0
    const updatedRows = rows.map((row) => ({
      ...row,
      total_produced: row.total_produced || 0,
      
    }));

    if (!date || !shift ) {
      alert("Please fill in the date fields.");
      return;
    }

    const dataToSubmit = updatedRows.map(({ total_production, ...row }) => ({
      ...row,
      date,
      shift,
      verified_by: verifiedBy,
    }));

    console.log(dataToSubmit)

    try {
      await axios.post(
        "http://192.168.1.199:8001/marking/api/marking/bulk-add/",
        dataToSubmit
      );
      alert("Data submitted successfully!");
      setTimeout(() => {
        window.location.reload();
      }, 2);  // 1000 milliseconds = 1 second
    } catch (error) {
      console.error("Error submitting data:", error);
      alert("Failed to submit data.");
    }
  };
  
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
        setVerifiedBy(`${name} ${lastname}`);
      } catch (error) {
        console.error("Error fetching user details:", error);
        alert("Failed to fetch user details.");
      }
    };

    fetchUserData();
  }, []);

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
      <form onSubmit={handleSubmit}>
        <div className="mb-6 flex space-x-4"> {/* Flex container for Date, Shift, Verified By */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-600 mb-1">Date:</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full px-1 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex-1">
              <label className="block text-sm font-medium text-gray-600 mb-1">Shift:</label>
              <select
                value={shift}
                onChange={(e) => setShift(e.target.value)}
                required
                className="w-full px-1 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="" disabled>Select Shift</option>
                {shiftOptions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-600 mb-1">Verified By:</label>
            <input
              type="text"
              value={verifiedBy}
              readOnly
              className="w-full px-1 py-1 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
            />
          </div>
        </div> {/* End of flex container */}
        <div className="overflow-x-auto mb-6" style={{ maxHeight: "calc(100vh - 200px)"  , maxWidth: "100vw"}}> {/* Add maxHeight to allow sticky positioning */}
        <table className="table-auto border-collapse min-w-full table-layout-auto">
            <thead>
              <tr className="bg-gray-100">
                <th className="min-w-[150px] text-left text-sm text-gray-600">Batch Number</th>
                <th className="min-w-[125px] text-left text-sm text-gray-600">Heat No.</th>
                <th className="min-w-[125px] text-left text-sm text-gray-600">Component</th>
                <th className="min-w-[90px] text-left text-sm text-gray-600">Machine</th>
                <th className="min-w-[90px] text-left text-sm text-gray-600">Operator</th>
                <th className="min-w-[50px] text-left text-sm text-gray-600">Batch Size</th>
                <th className="min-w-[50px] text-left text-sm text-gray-600">Privious production</th>
                <th className="min-w-[50px] text-left text-sm text-gray-600">Pcs.</th>
                <th className="text-left text-sm text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={index} className="border-b hover:bg-gray-50">
                  {Object.keys(row).map((field) => (
                    <td key={field} className="">
                      {field === "operator"  ? (
                        <select
                          value={row[field]}
                          disabled={["component", "heat_no", "total_produced", "target"].includes(field)}
                          onChange={(e) => handleRowChange(index, field, e.target.value)}
                          className="w-full py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="" disabled>Select {field}</option>
                          {(field === "operator" ? lineOptions : field === "line_incharge" ? lineInchargeOptions : formanOptions).map((option) => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={row[field]}
                          onChange={(e) => handleRowChange(index, field, e.target.value)}
                          className="w-full px-1 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      )}
                      {field === "batch_number" && rowSuggestions[index] && rowSuggestions[index].length > 0 && (
                        <ul className="absolute bg-white border border-gray-300 mt-1 w-[170px] max-h-40 overflow-y-auto z-10">
                          {rowSuggestions[index].map((suggestion, i) => (
                            <li
                              key={i}
                              onClick={() => handleSelectSuggestion(index, suggestion)}
                              className="py-2 cursor-pointer hover:bg-gray-100"
                            >
                              {suggestion}
                            </li>
                          ))}
                        </ul>
                      )}
                      {field === "component" && componentSuggestionss[index] && componentSuggestionss[index].length > 0 && (
                            <ul className="absolute bg-white border border-gray-300 mt-1 w-[170px] max-h-40 overflow-y-auto z-10">
                                {componentSuggestionss[index].map((suggestion, i) => (
                                    <li
                                        key={i}
                                        onClick={() => handleSelectComponent(index, suggestion)}
                                        className="px-4 py-2 cursor-pointer hover:bg-gray-100"
                                    >
                                        {suggestion}
                                    </li>
                                ))}
                            </ul>
                        )}

                    </td>
                  ))}
                  <td className="px-4 py-2 text-center">
                    <button
                      type="button"
                      onClick={() => removeRow(index)}
                      className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div> {/* End of overflow-x-auto */}
        <div className="flex justify-between">
          <button
            type="button"
            onClick={addRow}
            className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
          >
            Add Row
          </button>
          <button
            type="submit"
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
          >
            Submit
          </button>
        </div>
      </form>
      </main>
      </div>
    </div>
  );
};

export default Marking_form;