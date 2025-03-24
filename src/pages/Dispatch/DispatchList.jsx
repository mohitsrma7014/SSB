import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Sidebar } from "../Navigation/Sidebar";
import DashboardHeader from "../Navigation/DashboardHeader";

const DispatchList = () => {
    const [dispatches, setDispatches] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isSidebarVisible, setIsSidebarVisible] = useState(true);

    const toggleSidebar = () => {
        setIsSidebarVisible(!isSidebarVisible);
    };

    const pageTitle = "Dispatch Details";

    useEffect(() => {
        axios.get('http://192.168.1.199:8001/raw_material/api/dispatches/')
            .then(response => {
                const sortedDispatches = response.data.sort((a, b) => {
                    const dateA = new Date(a.date);
                    const dateB = new Date(b.date);
                    if (isNaN(dateA) || isNaN(dateB)) {
                        return 0;
                    }
                    return dateB - dateA;
                });
                setDispatches(sortedDispatches);
            })
            .catch(error => {
                console.error('Error fetching data:', error);
            });
    }, []);

    const filteredDispatches = dispatches.filter(dispatch => {
        return (
            dispatch.date.toLowerCase().includes(searchTerm.toLowerCase()) ||
            dispatch.component.toLowerCase().includes(searchTerm.toLowerCase()) ||
            dispatch.invoiceno.toLowerCase().includes(searchTerm.toLowerCase()) ||
            dispatch.heat_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
            dispatch.batch_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (dispatch.addpdf && dispatch.addpdf.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    });

    return (
        <div className="flex">
            <div className={`fixed top-0 left-0 h-full transition-all duration-300 ${isSidebarVisible ? "w-64" : "w-0 overflow-hidden"}`}>
                {isSidebarVisible && <Sidebar isVisible={isSidebarVisible} toggleSidebar={toggleSidebar} />}
            </div>

            <div className={`flex flex-col flex-grow transition-all duration-300 ${isSidebarVisible ? "ml-64" : "ml-0"}`}>
                <DashboardHeader isSidebarVisible={isSidebarVisible} toggleSidebar={toggleSidebar} title={pageTitle} />

                <main className="flex flex-col mt-20 justify-center flex-grow pl-2">

                    <div className="search-container">
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-box border border-gray-300 rounded-md p-1 mb-2 "
                        />
                    </div>

                    <div className="overflow-y-auto max-h-[calc(100vh-130px)]">

                    <table className="w-full bg-white border border-gray-300 rounded-md">
                        <thead className="sticky top-0 bg-gray-200 z-10">
                        <tr className="bg-gray-200 ">
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
                        {filteredDispatches.map((dispatch, index) => (

                            <tr key={dispatch.id || index} 
                                className={`${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-gray-100`}>
                            
                            
                                    <td>{dispatch.date}</td>
                                    <td>{dispatch.component}</td>
                                    <td>{dispatch.pices}</td>
                                    <td>{dispatch.invoiceno}</td>
                                    <td>
                                        {dispatch.addpdf ? (
                                            <a href={`http://192.168.1.199:8001${dispatch.addpdf}`} target="_blank" rel="noopener noreferrer">
                                                View Invoice
                                            </a>
                                        ) : (
                                            'No PDF'
                                        )}
                                    </td>
                                    <td>{dispatch.verified_by}</td>
                                    <td>{dispatch.heat_no}</td>
                                    <td>{dispatch.batch_number}</td>
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

export default DispatchList;