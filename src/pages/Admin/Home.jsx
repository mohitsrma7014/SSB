import { useState } from "react";
import { Typography ,Box, Container, Grid } from '@mui/material';
import { Sidebar } from "../Navigation/Sidebar";
import DashboardHeader from "../Navigation/DashboardHeader";
import  RejectionTrendChart  from './Components/RejectionTrendChart';
import  MonthlyGraph  from './Components/MonthlyGraph';
import  MonthlyReceivingTrend  from './Components//MonthlyReceivingTrend';
import  ProductionComparison  from './Components/ProductionComparison';
import  ProductionTrendChart  from './Components/ProductionTrendChart';
import  DispatchTonnageCharts  from './Components/DispatchTonnageCharts';

export default function HomePage() {
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarVisible(!isSidebarVisible);
  };
  const pageTitle = "Admin Home Page"; // Set the page title here

  return (
    <div className="flex">
      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full transition-all duration-300 ${
          isSidebarVisible ? "w-64" : "w-0 overflow-hidden"
        }`}
        style={{ zIndex: 50 }} // Add this line
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
        <div className="content" style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', marginBottom: '0' }}>
            

            {/* Right Side: Both Graphs taking 50% each */}
            <div style={{ display: 'flex', flexDirection: 'row', flex: 1 ,gap: '10px'}}>
                <div style={{ flex: .5}}>
                    <div className="App">
                        <ProductionTrendChart />
                    </div>
                </div>

                <div style={{ flex: .5 }}>
                    <div className="App">
                        <RejectionTrendChart />
                    </div>
                </div>
            </div>
        </div>

       
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', marginBottom: '0' }}>
            {/* Left Side: Greeting Box and Production Comparison */}
            <div style={{ display: 'flex', flexDirection: 'column', width: '500px'}}>
              {/* Left Side: Greeting Box and Production Comparison */}
            <div style={{ display: 'flex', flexDirection: 'column', width: '500px' }}>
                <div className="App" style={{ marginBottom: '0' }}>
                <ProductionComparison />
                </div>
                <div className="App">
                <MonthlyReceivingTrend />
                </div>
            </div>
                <div className="App">
                 
                </div>
            </div>

            {/* Right Side: Both Graphs taking 50% each */}
            <div style={{ display: 'flex', flexDirection: 'row', flex: 1 ,gap: '10px'}}>
                <div style={{ flex: 1}}>
                    <div className="App">
                    <MonthlyGraph />
                    </div>
                </div>
            </div>
        </div>
         {/* New Row Below Production Comparison: Dispatch Tonnage Charts */}
         <div style={{ marginTop: '10px' }}>
            <div className="App">
                <DispatchTonnageCharts />
            </div>
        </div>
    </div>
        </main>

        
      </div>
    </div>
  );
}
