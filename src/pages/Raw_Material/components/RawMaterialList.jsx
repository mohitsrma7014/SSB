import React, { useState, useEffect } from "react";
import axios from "axios";
import { Sidebar } from "../../Navigation/Sidebar";
import DashboardHeader from "../../Navigation/DashboardHeader";
import { FaEye, FaCheckCircle, FaTimesCircle, FaFilter, FaSearch } from "react-icons/fa";
import { DatePicker, Select, Input, Button } from "antd";

const { Option } = Select;
const { RangePicker } = DatePicker;

const RawMaterialList = ({ onSelectMaterial }) => {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });
  const [filters, setFilters] = useState({
    dateRange: null,
    supplier: '',
    grade: '',
    dia: '',
    invoice_no: '',
    heatno: '',
    type_of_material: '',
    approval_status: '',
    rack_no:'',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  
  const toggleSidebar = () => {
    setIsSidebarVisible(!isSidebarVisible);
  };

  const pageTitle = "Material Information";

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      let params = {
        page: pagination.current,
        page_size: pagination.pageSize,
      };

      // Add filters to params if they exist
      if (filters.dateRange) {
        params['date__gte'] = filters.dateRange[0].format('YYYY-MM-DD');
        params['date__lte'] = filters.dateRange[1].format('YYYY-MM-DD');
      }
      if (filters.supplier) params['supplier__icontains'] = filters.supplier;
      if (filters.grade) params['grade__icontains'] = filters.grade;
      if (filters.dia) params['dia'] = filters.dia;
      if (filters.invoice_no) params['invoice_no__icontains'] = filters.invoice_no;
      if (filters.heatno) params['heatno__icontains'] = filters.heatno;
      if (filters.type_of_material) params['type_of_material'] = filters.type_of_material;
      if (filters.approval_status) params['approval_status'] = filters.approval_status;
      if (filters.rack_no) params['rack_no'] = filters.rack_no;

      const response = await axios.get(
        "http://192.168.1.199:8001/raw_material/api/rawmaterials/",
        { params }
      );
      
      setMaterials(response.data.results);
      setPagination({
        ...pagination,
        total: response.data.count,
      });
    } catch (error) {
      console.error("Error fetching materials:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, [pagination.current, pagination.pageSize]);

  const handleTableChange = (pagination) => {
    setPagination(pagination);
  };

  const handleFilterChange = (name, value) => {
    setFilters({
      ...filters,
      [name]: value,
    });
    setPagination({
      ...pagination,
      current: 1, // Reset to first page when filters change
    });
  };

  const resetFilters = () => {
  setFilters({
    dateRange: null,
    supplier: '',
    grade: '',
    dia: '',
    invoice_no: '',
    heatno: '',
    type_of_material: '',
    approval_status: '',
    rack_no:'rack_no'
  });

  setPagination((prev) => ({
    ...prev,
    current: 1,
  }));

  // Fetch data after resetting
  setTimeout(() => {
    fetchMaterials();
  }, 0);
};


  return (
    <div className="flex">
      <div className={`fixed top-0 left-0 h-full transition-all duration-300 ${isSidebarVisible ? "w-64" : "w-0 overflow-hidden"}`}>
        {isSidebarVisible && <Sidebar isVisible={isSidebarVisible} toggleSidebar={toggleSidebar} />}
      </div>

      <div className={`flex flex-col flex-grow transition-all duration-300 ${isSidebarVisible ? "ml-64" : "ml-0"}`}>
        <DashboardHeader isSidebarVisible={isSidebarVisible} toggleSidebar={toggleSidebar} title={pageTitle} />

        <main className="flex flex-col mt-20 justify-center flex-grow pl-2">
          {/* Filter Section */}
          <div className="bg-white pl-3 pr-2 mb-2 shadow rounded">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-semibold">Filters</h3>
              <div className="flex gap-2">
                <Button 
                  type={showFilters ? "primary" : "default"} 
                  icon={<FaFilter />} 
                  onClick={() => setShowFilters(!showFilters)}
                >
                  {showFilters ? 'Hide Filters' : 'Show Filters'}
                </Button>
                <Button onClick={resetFilters}>Reset</Button>
                <Button type="primary" onClick={() => fetchMaterials()}>Apply</Button>
              </div>

            </div>

            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Date Range</label>
                  <RangePicker 
                    className="w-full"
                    onChange={(dates) => handleFilterChange('dateRange', dates)}
                    value={filters.dateRange}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Supplier</label>
                  <Input
                    placeholder="Search supplier"
                    value={filters.supplier}
                    onChange={(e) => handleFilterChange('supplier', e.target.value)}
                    suffix={<FaSearch />}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Grade</label>
                  <Input
                    placeholder="Search grade"
                    value={filters.grade}
                    onChange={(e) => handleFilterChange('grade', e.target.value)}
                    suffix={<FaSearch />}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Diameter</label>
                  <Input
                    placeholder="Enter diameter"
                    value={filters.dia}
                    onChange={(e) => handleFilterChange('dia', e.target.value)}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Invoice No</label>
                  <Input
                    placeholder="Search invoice"
                    value={filters.invoice_no}
                    onChange={(e) => handleFilterChange('invoice_no', e.target.value)}
                    suffix={<FaSearch />}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Heat No</label>
                  <Input
                    placeholder="Search heat no"
                    value={filters.heatno}
                    onChange={(e) => handleFilterChange('heatno', e.target.value)}
                    suffix={<FaSearch />}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Rack No</label>
                  <Input
                    placeholder="Search Rack no"
                    value={filters.rack_no}
                    onChange={(e) => handleFilterChange('rack_no', e.target.value)}
                    suffix={<FaSearch />}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Material Type</label>
                  <Select
                    className="w-full"
                    placeholder="Select type"
                    value={filters.type_of_material || undefined}
                    onChange={(value) => handleFilterChange('type_of_material', value)}
                    allowClear
                  >
                    <Option value="">Show All</Option>
                    <Option value="SALE WORK">SALE WORK</Option>
                    <Option value="JOB WORK">JOB WORK</Option>
                    {/* Add other options as needed */}
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <Select
                    className="w-full mb-2"
                    placeholder="Select status"
                    value={filters.approval_status || undefined}
                    onChange={(value) => handleFilterChange('approval_status', value)}
                    allowClear
                  >
                     <Option value="">Show All</Option>
                    <Option value="Under Inspection">Under Inspection</Option>
                    <Option value="Approved">Approved</Option>
                    <Option value="Hold">Hold</Option>
                    <Option value="Rejected">Rejected</Option>
                  </Select>
                </div>
              </div>
            )}
          </div>

          {/* Material Table */}
          <div className="bg-white shadow rounded overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 max-w-[100px] truncate uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 max-w-[100px] truncate uppercase tracking-wider">Supplier</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 max-w-[100px] truncate uppercase tracking-wider">Grade</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 max-w-[100px] truncate uppercase tracking-wider">Dia</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 max-w-[100px] truncate uppercase tracking-wider">Invoice No</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 max-w-[100px] truncate uppercase tracking-wider">Heat No</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 max-w-[100px] truncate uppercase tracking-wider">Qty</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 max-w-[100px] truncate uppercase tracking-wider">Rack</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 max-w-[100px] truncate uppercase tracking-wider">Material Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 max-w-[100px] truncate uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 max-w-[100px] truncate uppercase tracking-wider">Mill-TC</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 max-w-[100px] truncate uppercase tracking-wider">Spectro</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 max-w-[100px] truncate uppercase tracking-wider">SSB Inspection</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 max-w-[100px] truncate uppercase tracking-wider">Customer Approval</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 max-w-[100px] truncate uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan="12" className="px-2 py-2 text-center">
                        Loading...
                      </td>
                    </tr>
                  ) : materials.length === 0 ? (
                    <tr>
                      <td colSpan="12" className="px-2 py-2 text-center">
                        No materials found.
                      </td>
                    </tr>
                  ) : (
                    materials.map((material) => (
                      <tr key={material.id} className="hover:bg-gray-50">
                        <td className="px-2 py-2 max-w-[100px] truncate text-sm text-gray-500">
                          {new Date(material.date).toLocaleDateString()}
                        </td>
                       <td className="px-2 py-2 max-w-[100px] truncate text-sm text-gray-500">
                          {material.supplier}
                        </td>
                       <td className="px-2 py-2 max-w-[100px] truncate text-sm text-gray-500">
                          {material.grade}
                        </td>
                       <td className="px-2 py-2 max-w-[100px] truncate text-sm text-gray-500">
                          {material.dia}
                        </td>
                        <td className="px-2 py-2 max-w-[100px] truncate text-sm text-gray-500">
                          {material.invoice_no}
                        </td>
                        <td className="px-2 py-2 max-w-[100px] truncate text-sm text-gray-500">
                          {material.heatno}
                        </td>
                        <td className="px-2 py-2 max-w-[100px] truncate text-sm text-gray-500">
                          {material.weight}
                        </td>
                        <td className="px-2 py-2 max-w-[100px] truncate text-sm text-gray-500">
                          {material.rack_no}
                        </td>
                       <td className="px-2 py-2 max-w-[100px] truncate text-sm text-gray-500">
                          {material.type_of_material}
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${material.approval_status === 'Approved' ? 'bg-green-100 text-green-800' : 
                              material.approval_status === 'Rejected' ? 'bg-red-100 text-red-800' : 
                              'bg-yellow-100 text-yellow-800'}`}>
                            {material.approval_status}
                          </span>
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500">
                          {material.milltc ? (
                            <a href={material.milltc} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700">
                              <FaEye className="inline-block" />
                            </a>
                          ) : (
                            <FaTimesCircle className="text-red-500 inline-block" />
                          )}
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500">
                          {material.spectro ? (
                            <a href={material.spectro} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700">
                              <FaEye className="inline-block" />
                            </a>
                          ) : (
                            <FaTimesCircle className="text-red-500 inline-block" />
                          )}
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500">
                          {material.ssb_inspection_report ? (
                            <a href={material.ssb_inspection_report} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700">
                              <FaEye className="inline-block" />
                            </a>
                          ) : (
                            <FaTimesCircle className="text-red-500 inline-block" />
                          )}
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500">
                          {material.customer_approval ? (
                            <a href={material.customer_approval} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700">
                              <FaEye className="inline-block" />
                            </a>
                          ) : (
                            <FaTimesCircle className="text-red-500 inline-block" />
                          )}
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => onSelectMaterial(material.id)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Details
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-6 py-3 flex items-center justify-between border-t border-gray-200">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setPagination({...pagination, current: pagination.current - 1})}
                  disabled={pagination.current === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPagination({...pagination, current: pagination.current + 1})}
                  disabled={pagination.current * pagination.pageSize >= pagination.total}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{(pagination.current - 1) * pagination.pageSize + 1}</span> to{' '}
                    <span className="font-medium">
                      {Math.min(pagination.current * pagination.pageSize, pagination.total)}
                    </span>{' '}
                    of <span className="font-medium">{pagination.total}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => setPagination({...pagination, current: 1})}
                      disabled={pagination.current === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                    >
                      <span className="sr-only">First</span>
                      «
                    </button>
                    <button
                      onClick={() => setPagination({...pagination, current: pagination.current - 1})}
                      disabled={pagination.current === 1}
                      className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                    >
                      <span className="sr-only">Previous</span>
                      ‹
                    </button>
                    
                    {/* Page numbers */}
                    {Array.from({ length: Math.min(5, Math.ceil(pagination.total / pagination.pageSize)) }, (_, i) => {
                      let pageNum;
                      if (Math.ceil(pagination.total / pagination.pageSize) <= 5) {
                        pageNum = i + 1;
                      } else if (pagination.current <= 3) {
                        pageNum = i + 1;
                      } else if (pagination.current >= Math.ceil(pagination.total / pagination.pageSize) - 2) {
                        pageNum = Math.ceil(pagination.total / pagination.pageSize) - 4 + i;
                      } else {
                        pageNum = pagination.current - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setPagination({...pagination, current: pageNum})}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            pagination.current === pageNum
                              ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    
                    <button
                      onClick={() => setPagination({...pagination, current: pagination.current + 1})}
                      disabled={pagination.current * pagination.pageSize >= pagination.total}
                      className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                    >
                      <span className="sr-only">Next</span>
                      ›
                    </button>
                    <button
                      onClick={() => setPagination({...pagination, current: Math.ceil(pagination.total / pagination.pageSize)})}
                      disabled={pagination.current * pagination.pageSize >= pagination.total}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                    >
                      <span className="sr-only">Last</span>
                      »
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default RawMaterialList;