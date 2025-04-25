import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Sidebar } from "../Navigation/Sidebar";
import DashboardHeader from "../Navigation/DashboardHeader";

const DispatchList = () => {
    const [dispatches, setDispatches] = useState([]);
    const [filteredDispatches, setFilteredDispatches] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isSidebarVisible, setIsSidebarVisible] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [itemsPerPage] = useState(20);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({
        date: '',
        component: '',
        batch: '',
        heatno: '',
        invoice: ''
    });
    const [tempPageInput, setTempPageInput] = useState(1);

    const toggleSidebar = () => {
        setIsSidebarVisible(!isSidebarVisible);
    };

    const pageTitle = "Dispatch Details";

    useEffect(() => {
        fetchDispatches();
    }, [currentPage]);

    const fetchDispatches = async () => {
        setLoading(true);
        try {
            let params = {
                page: currentPage,
                page_size: itemsPerPage,
                ordering: '-date,-invoiceno', // Sort by date then invoice number (descending)
                ...(filters.date && { date: filters.date }),
                ...(filters.component && { component: filters.component }),
                ...(filters.batch && { batch_number: filters.batch }),
                ...(filters.heatno && { heat_no: filters.heatno }),
                ...(filters.invoice && { invoiceno: filters.invoice })
            };

            const response = await axios.get('http://192.168.1.199:8001/raw_material/api/dispatches/', { params });
            
            setDispatches(response.data.results);
            setFilteredDispatches(response.data.results);
            setTotalPages(Math.ceil(response.data.count / itemsPerPage));
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const applyFilters = () => {
        setCurrentPage(1);
        fetchDispatches();
    };

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
        if (e.target.value === '') {
            setFilteredDispatches(dispatches);
        } else {
            const filtered = dispatches.filter(dispatch => {
                return (
                    dispatch.date.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    dispatch.component.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    dispatch.invoiceno.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    dispatch.heat_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    dispatch.batch_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (dispatch.addpdf && dispatch.addpdf.toLowerCase().includes(searchTerm.toLowerCase()))
                );
            });
            setFilteredDispatches(filtered);
        }
    };

    const handlePageInputChange = (e) => {
        const value = parseInt(e.target.value);
        if (!isNaN(value)) {
            setTempPageInput(Math.max(1, Math.min(totalPages, value)));
        }
    };

    const goToPage = () => {
        if (tempPageInput >= 1 && tempPageInput <= totalPages) {
            setCurrentPage(tempPageInput);
        }
    };

    // Sort by date then invoice number (descending) in frontend as well
    const sortedDispatches = [...filteredDispatches].sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        
        // First sort by date (descending)
        if (dateA > dateB) return -1;
        if (dateA < dateB) return 1;
        
        // If dates are equal, sort by invoice number (descending)
        return b.invoiceno.localeCompare(a.invoiceno);
    });

    return (
        <div className="flex">
            <div className={`fixed top-0 left-0 h-full transition-all duration-300 ${isSidebarVisible ? "w-64" : "w-0 overflow-hidden"}`}>
                {isSidebarVisible && <Sidebar isVisible={isSidebarVisible} toggleSidebar={toggleSidebar} />}
            </div>

            <div className={`flex flex-col flex-grow transition-all duration-300 ${isSidebarVisible ? "ml-64" : "ml-0"}`}>
                <DashboardHeader isSidebarVisible={isSidebarVisible} toggleSidebar={toggleSidebar} title={pageTitle} />

                <main className="flex flex-col mt-20 justify-center flex-grow pl-2">
                    <div className="flex flex-wrap gap-4 mb-4 p-2 bg-gray-100 rounded-md">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Date</label>
                            <input
                                type="date"
                                name="date"
                                value={filters.date}
                                onChange={handleFilterChange}
                                className="border border-gray-300 rounded-md p-1"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Component</label>
                            <input
                                type="text"
                                name="component"
                                value={filters.component}
                                onChange={handleFilterChange}
                                placeholder="Component"
                                className="border border-gray-300 rounded-md p-1"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Batch</label>
                            <input
                                type="text"
                                name="batch"
                                value={filters.batch}
                                onChange={handleFilterChange}
                                placeholder="Batch"
                                className="border border-gray-300 rounded-md p-1"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Heat No</label>
                            <input
                                type="text"
                                name="heatno"
                                value={filters.heatno}
                                onChange={handleFilterChange}
                                placeholder="Heat No"
                                className="border border-gray-300 rounded-md p-1"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Invoice No</label>
                            <input
                                type="text"
                                name="invoice"
                                value={filters.invoice}
                                onChange={handleFilterChange}
                                placeholder="Invoice No"
                                className="border border-gray-300 rounded-md p-1"
                            />
                        </div>
                        <div className="flex items-end">
                            <button 
                                onClick={applyFilters}
                                className="bg-blue-500 text-white px-4 py-1 rounded-md hover:bg-blue-600"
                            >
                                Apply Filters
                            </button>
                        </div>
                    </div>

                    <div className="search-container mb-2">
                        <input
                            type="text"
                            placeholder="Search in current page..."
                            value={searchTerm}
                            onChange={handleSearch}
                            className="search-box border border-gray-300 rounded-md p-1"
                        />
                    </div>

                    {loading ? (
                        <div className="text-center py-4">Loading...</div>
                    ) : (
                        <>
                            <div className="overflow-y-auto max-h-[calc(100vh-230px)]">
                                <table className="w-full bg-white border border-gray-300 rounded-md">
                                    <thead className="sticky top-0 bg-gray-200 z-10">
                                        <tr className="bg-gray-200">
                                            <th className='p-2'>Date</th>
                                            <th>Component</th>
                                            <th>Pices</th>
                                            <th>Invoice No</th>
                                            <th>PDF</th>
                                            <th>Verified By</th>
                                            <th>Heat No</th>
                                            <th>Batch Number</th>
                                        </tr>
                                    </thead>
                                    <tbody className='text-center'>
                                        {sortedDispatches.length > 0 ? (
                                            sortedDispatches.map((dispatch, index) => (
                                                <tr 
                                                    key={dispatch.id || index} 
                                                    className={`${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-gray-100`}
                                                >
                                                    <td>{dispatch.date}</td>
                                                    <td>{dispatch.component}</td>
                                                    <td>{dispatch.pices}</td>
                                                    <td>{dispatch.invoiceno}</td>
                                                    <td>
                                                        {dispatch.addpdf ? (
                                                            <a 
                                                                href={`http://192.168.1.199:8001${dispatch.addpdf}`} 
                                                                target="_blank" 
                                                                rel="noopener noreferrer"
                                                                className="text-blue-600 hover:underline"
                                                            >
                                                                View Invoice
                                                            </a>
                                                        ) : (
                                                            'No PDF'
                                                        )}
                                                    </td>
                                                    <td>{dispatch.verified_by}</td>
                                                    <td>{dispatch.heat_no}</td>
                                                    <td className="p-2 border">
                                                <span
                                                    style={{ cursor: 'pointer', color: 'blue', textDecoration: 'underline' }}
                                                    onClick={() => {
                                                    const traceabilityUrl = `/TraceabilityCard?batch=${dispatch.batch_number}`;
                                                    window.open(traceabilityUrl, '_blank');
                                                    }}
                                                >
                                                    {dispatch.batch_number}
                                                </span>
                                                </td>

                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="8" className="py-4 text-center">No dispatches found</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            <div className="flex justify-between items-center mt-4 p-2 bg-gray-100 rounded-md">
                                <div>
                                    <span>Page {currentPage} of {totalPages}</span>
                                </div>
                                <div className="flex gap-2 items-center">
                                    <button 
                                        onClick={() => {
                                            setTempPageInput(1);
                                            setCurrentPage(1);
                                        }}
                                        disabled={currentPage === 1}
                                        className={`px-3 py-1 rounded ${currentPage === 1 ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-500 text-white'}`}
                                    >
                                        First
                                    </button>
                                    <button 
                                        onClick={() => {
                                            setTempPageInput(currentPage - 1);
                                            setCurrentPage(prev => prev - 1);
                                        }}
                                        disabled={currentPage === 1}
                                        className={`px-3 py-1 rounded ${currentPage === 1 ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-500 text-white'}`}
                                    >
                                        Previous
                                    </button>
                                    <div className="flex items-center gap-1">
                                        <input
                                            type="number"
                                            min="1"
                                            max={totalPages}
                                            value={tempPageInput}
                                            onChange={handlePageInputChange}
                                            className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
                                        />
                                        <button 
                                            onClick={goToPage}
                                            className="bg-blue-500 text-white px-3 py-1 rounded"
                                        >
                                            Go
                                        </button>
                                    </div>
                                    <button 
                                        onClick={() => {
                                            setTempPageInput(currentPage + 1);
                                            setCurrentPage(prev => prev + 1);
                                        }}
                                        disabled={currentPage === totalPages}
                                        className={`px-3 py-1 rounded ${currentPage === totalPages ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-500 text-white'}`}
                                    >
                                        Next
                                    </button>
                                    <button 
                                        onClick={() => {
                                            setTempPageInput(totalPages);
                                            setCurrentPage(totalPages);
                                        }}
                                        disabled={currentPage === totalPages}
                                        className={`px-3 py-1 rounded ${currentPage === totalPages ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-500 text-white'}`}
                                    >
                                        Last
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </main>
            </div>
        </div>
    );
};

export default DispatchList;