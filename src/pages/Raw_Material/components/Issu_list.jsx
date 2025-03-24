import React, { useEffect, useState } from "react";
import axios from "axios";
import { Sidebar } from "../../Navigation/Sidebar";
import DashboardHeader from "../../Navigation/DashboardHeader";

const IssuList = () => {
  const [batchData, setBatchData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
      
        const toggleSidebar = () => {
          setIsSidebarVisible(!isSidebarVisible);
        };
        const pageTitle = "Material Issue List"; // Set the page title here

  useEffect(() => {
    axios
      .get("http://192.168.1.199:8001/raw_material/api/batch-tracking/")
      .then((response) => {
        const sortedData = response.data.sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        );
        setBatchData(sortedData);
        setFilteredData(sortedData);
      })
      .catch((err) => console.error(err));
  }, []);

  const handleSearch = (e) => {
    const value = e.target.value.toLowerCase();
    setSearchTerm(value);
    const filtered = batchData.filter((batch) =>
      Object.values(batch).some(
        (field) =>
          field &&
          field.toString().toLowerCase().includes(value)
      )
    );
    setFilteredData(filtered);
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

      {/* Search Input */}
      <input
        type="text"
        placeholder="Search"
        value={searchTerm}
        onChange={handleSearch}
        className="w-full p-3 mb-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
      />

      {/* Table */}
      <div className="overflow-y-auto max-h-[calc(100vh-130px)]">

<table className="w-full bg-white border border-gray-300 rounded-md">
    <thead className="sticky top-0 bg-gray-200 z-10">
    <tr className="bg-gray-200 ">
              <th className="p-2 text-left border">Batch Id</th>
              <th className="p-2 text-left border">Issue Id</th>
              <th className="p-2 text-left border">Customer</th>
              <th className="p-2 text-left border">Standard</th>
              <th className="p-2 text-left border">Component No</th>
              <th className="p-2 text-left border">Material Grade</th>
              <th className="p-2 text-left border">Heat No</th>
              <th className="p-2 text-left border">Rack No</th>
              <th className="p-2 text-left border">Bar Qty</th>
              <th className="p-2 text-left border">KG Qty</th>
              <th className="p-2 text-left border">Line</th>
              <th className="p-2 text-left border">Supplier</th>
              <th className="p-2 text-left border">Verify By</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((batch) => (
              <tr
                key={batch.id}
                className="hover:bg-gray-100 transition duration-300"
              >
                <td className="p-2 border">{batch.block_mt_id}</td>
                <td className="p-2 border">{batch.batch_number}</td>
                <td className="p-2 border">{batch.customer}</td>
                <td className="p-2 border">{batch.standerd}</td>
                <td className="p-2 border">{batch.component_no}</td>
                <td className="p-2 border">{batch.material_grade}</td>
                <td className="p-2 border">{batch.heat_no}</td>
                <td className="p-2 border">{batch.rack_no}</td>
                <td className="p-2 border">{batch.bar_qty}</td>
                <td className="p-2 border">{batch.kg_qty}</td>
                <td className="p-2 border">{batch.line}</td>
                <td className="p-2 border">{batch.supplier}</td>
                <td className="p-2 border">{batch.verified_by}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
    </div>
    </div>
  );
};

export default IssuList;
