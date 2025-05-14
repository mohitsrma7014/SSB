import React from "react";
import KPIHighlights from "./KPIHighlights";
import GraphicalAnalysis from "./GraphicalAnalysis";
import DataTable from "./DataTable";
import LineChartAnalysis from "./LineChartAnalysis";

const Dashboard = ({ scheduleData, lineChartData, customerChartData, darkMode }) => {
  if (!scheduleData || scheduleData.length === 0 || scheduleData[0]?.noData) {
    return (
      <div className={`text-center p-4 ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
        No data available for this month.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <KPIHighlights data={scheduleData} darkMode={darkMode} />
      
      <GraphicalAnalysis data={scheduleData} darkMode={darkMode} />
      <DataTable data={scheduleData} darkMode={darkMode} />
    </div>
  );
};

export default Dashboard;