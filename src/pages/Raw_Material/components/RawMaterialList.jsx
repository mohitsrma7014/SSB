import React, { useEffect, useState } from "react";
import axios from "axios";
import { Sidebar } from "../../Navigation/Sidebar";
import DashboardHeader from "../../Navigation/DashboardHeader";
import { FaEye, FaCheckCircle, FaTimesCircle } from "react-icons/fa";

const RawMaterialList = ({ onSelectMaterial }) => {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  
      const toggleSidebar = () => {
          setIsSidebarVisible(!isSidebarVisible);
      };
  
      const pageTitle = "Material Information ";

  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        const response = await axios.get(
          "http://192.168.1.199:8001/raw_material/api/rawmaterials/"
        );
        setMaterials(response.data);
      } catch (error) {
        console.error("Error fetching materials:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMaterials();
  }, []);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Filter materials based on search term
  const filteredMaterials = materials.filter((material) =>
    material.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
    material.grade.toLowerCase().includes(searchTerm.toLowerCase()) ||
    material.invoice_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
    material.heatno.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedMaterials = filteredMaterials.sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return dateB - dateA;
  });

  if (loading) {
    return <p>Loading raw materials...</p>;
  }

  return (
    <div className="flex">
    <div className={`fixed top-0 left-0 h-full transition-all duration-300 ${isSidebarVisible ? "w-64" : "w-0 overflow-hidden"}`}>
        {isSidebarVisible && <Sidebar isVisible={isSidebarVisible} toggleSidebar={toggleSidebar} />}
    </div>

    <div className={`flex flex-col flex-grow transition-all duration-300 ${isSidebarVisible ? "ml-64" : "ml-0"}`}>
        <DashboardHeader isSidebarVisible={isSidebarVisible} toggleSidebar={toggleSidebar} title={pageTitle} />

        <main className="flex flex-col mt-20 justify-center flex-grow pl-2">

  <div className="flex items-center gap-2 mb-4">
    <input
      type="text"
      placeholder="Search materials..."
      value={searchTerm}
      onChange={handleSearchChange}
      className="px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
    <button
      onClick={() => setSearchTerm("")}
      className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition duration-200"
    >
      Clear Search
    </button>
  </div>

  {/* Scrollable table container */}
  <div className="overflow-y-auto max-h-[calc(100vh-130px)]">

<table className="w-full bg-white border border-gray-300 rounded-md">
    <thead className="sticky top-0 bg-gray-200 z-10">
    <tr className="bg-gray-200 ">
          <th className=" text-center">Date</th>
          <th className=" text-center">Supplier</th>
          <th className=" text-center">Grade</th>
          <th className=" text-center">Dia</th>
          <th className=" text-center">Invoice No</th>
          <th className="text-center">Heat No</th>
          <th className="text-center">Material Type</th>
          <th className=" text-center">Status</th>
          <th className=" text-center">Mill-TC</th>
          <th className=" text-center">Spectro</th>
          <th className="text-center">SSB Inspection</th>
          <th className="text-center">Actions</th>
        </tr>
      </thead>
      <tbody>
        {sortedMaterials.length === 0 ? (
          <tr>
            <td colSpan="12" className="text-center">
              No materials found.
            </td>
          </tr>
        ) : (
          sortedMaterials.map((material) => {
            const allFilesAttached = material.milltc && material.spectro && material.ssb_inspection_report;

            return (
              <tr
                  className={`${true ? 'bg-gray-50' : 'bg-white'} hover:bg-gray-100`}
                >

                <td className="text-center">{new Date(material.date).toLocaleDateString()}</td>
                <td className="text-center">{material.supplier}</td>
                <td className="text-center">{material.grade}</td>
                <td className="text-center">{material.dia}</td>
                <td className="text-center">{material.invoice_no}</td>
                <td className="text-center">{material.heatno}</td>
                <td className="text-center">{material.type_of_material}</td>
                <td className="text-center">{material.approval_status}</td>
                <td className="text-center">
                  {material.milltc ? (
                    <button onClick={() => window.open(material.milltc, "_blank")} className="text-blue-500 hover:text-blue-700 transition duration-200">
                      <FaEye className="inline-block" />
                    </button>
                  ) : (
                    <FaTimesCircle className="text-red-500 inline-block" />
                  )}
                </td>
                <td className="text-center text-center">
                  {material.spectro ? (
                    <button onClick={() => window.open(material.spectro, "_blank")} className="text-blue-500 hover:text-blue-700 transition duration-200">
                      <FaEye className="inline-block" />
                    </button>
                  ) : (
                    <FaTimesCircle className="text-red-500 inline-block" />
                  )}
                </td>
                <td className="text-center text-center">
                  {material.ssb_inspection_report ? (
                    <button onClick={() => window.open(material.ssb_inspection_report, "_blank")} className="text-blue-500 hover:text-blue-700 transition duration-200">
                      <FaEye className="inline-block" />
                    </button>
                  ) : (
                    <FaTimesCircle className="text-red-500 inline-block" />
                  )}
                </td>
                <td className="text-center text-center">
                  <button onClick={() => onSelectMaterial(material.id)} className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition duration-200">
                    Details
                  </button>
                </td>
              </tr>
            );
          })
        )}
      </tbody>
    </table>
  </div>
</main>
</div>
    </div>
  );
};

export default RawMaterialList;
