import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { useState } from 'react';

const lineCapacities = {
  'HAMMER1': 180000,
  'A-SET': 150000,
  'B-set': 150000,
  '1000 Ton': 150000,
  '1600 TON': 175000,
  'HAMMER2': 180000,
  'W-SET': 150000,
  'FFL': 150000,
  'NHF-1000': 140000,
};

export default function BlockMtAnalysis({ data = [], forgingData = [] }) {
  const [selectedLine, setSelectedLine] = useState(null);
  const [showPopup, setShowPopup] = useState(false);

  // Process data for line-wise production
  const lineData = data.reduce((acc, item) => {
    const line = item.line || 'Unknown';
    if (!acc[line]) {
      acc[line] = { 
        line, 
        totalPlannedPices: 0, 
        totalPlannedWeight: 0,
        components: [],
        completed: true,
        capacity: lineCapacities[line.toUpperCase()] || 150000 // Default capacity
      };
    }
    acc[line].totalPlannedPices += item.pices || 0;
    acc[line].totalPlannedWeight += parseFloat(item.weight || 0);
    
    const productionRecords = (forgingData || []).filter(f => f.component === item.component) || [];
    const totalProduced = productionRecords.reduce((sum, item) => sum + (item.production || 0), 0);
    const isCompleted = totalProduced >= (item.pices || 0);
    
    if (!isCompleted) {
      acc[line].completed = false;
    }
    
    acc[line].components.push({
      component: item.component,
      plannedPices: item.pices || 0,
      plannedWeight: parseFloat(item.weight || 0),
      producedPices: totalProduced,
      producedWeight: productionRecords.reduce(
        (sum, item) => sum + (parseFloat(item.slug_weight || 0) * (item.production || 0)),
        0
      ),
      isCompleted,
      productionDates: [...new Set(productionRecords.map(p => p.date || '').filter(Boolean))].join(', ')
    });
    return acc;
  }, {});

  const chartData = Object.values(lineData).map(line => {
    const capacityUtilization = (line.totalPlannedWeight / line.capacity) * 100;
    let color;
    
    if (capacityUtilization < 60) {
      color = '#4CAF50'; // Green (under 60%)
    } else if (capacityUtilization < 80) {
      color = '#FFC107'; // Yellow (60-80%)
    } else if (capacityUtilization < 100) {
      color = '#FF9800'; // Orange (80-100%)
    } else {
      color = '#F44336'; // Red (over 100%)
    }
    
    return {
      name: line.line,
      plannedPices: line.totalPlannedPices,
      plannedWeight: line.totalPlannedWeight,
      producedPices: line.components.reduce((sum, c) => sum + (c.producedPices || 0), 0),
      producedWeight: line.components.reduce((sum, c) => sum + (c.producedWeight || 0), 0),
      completionRate: line.totalPlannedPices > 0 
        ? (line.components.reduce((sum, c) => sum + (c.producedPices || 0), 0) / line.totalPlannedPices * 100 )
        : 0,
      isLineCompleted: line.completed,
      capacity: line.capacity,
      capacityUtilization,
      color,
      components: line.components
    };
  });

  const handleBarClick = (entry) => {
    setSelectedLine(entry);
    setShowPopup(true);
  };

  const closePopup = () => {
    setShowPopup(false);
  };

  const renderCustomizedLabel = (props) => {
    const { x, y, width, value } = props;
    const formattedValue = parseFloat(value).toFixed(1);
    
    return (
      <text
        x={x + width / 2}
        y={y +20}
        fill="#000"
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={12}
      >
        {formattedValue} kg
      </text>
    );
  };

  return (
    <div className="relative">
      <h2 className="text-xl font-semibold mb-4">Line-wise Production Planning</h2>
      
      {/* Color Legend */}
      <div className="flex flex-wrap gap-4 mb-4">
        <div className="flex items-center">
          <div className="w-4 h-4 bg-[#4CAF50] mr-2"></div>
          <span>Below 60% capacity</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-[#FFC107] mr-2"></div>
          <span>60-80% capacity</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-[#FF9800] mr-2"></div>
          <span>80-100% capacity</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-[#F44336] mr-2"></div>
          <span>Over 100% capacity</span>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow mb-6">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={500}>
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 20, right: 30, left: 40, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis 
                dataKey="name" 
                type="category" 
                width={100} 
                tick={{ fontSize: 12 }}
              />
              <Legend />
              <Bar 
                dataKey="plannedWeight" 
                name="Planned Weight (kg)" 
                fill="#8884d8"
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color}
                    onClick={() => handleBarClick(entry)}
                  />
                ))}
                <LabelList dataKey="plannedWeight" content={renderCustomizedLabel} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center py-8 text-gray-500">No production data available</div>
        )}
      </div>

      {/* Custom Popup - Same as before */}
      {showPopup && selectedLine && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-[150vh] w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold">{selectedLine.name}</h3>
              <button 
                onClick={closePopup}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                &times;
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded">
                <h4 className="font-semibold mb-2">Planned</h4>
                <p className="text-2xl font-bold">{selectedLine.plannedPices} pcs</p>
                <p className="text-lg">{selectedLine.plannedWeight.toFixed(2)} kg</p>
                <p className="text-sm">Capacity: {selectedLine.capacity} kg</p>
              </div>
              <div className="bg-gray-50 p-4 rounded">
                <h4 className="font-semibold mb-2">Produced</h4>
                <p className="text-2xl font-bold">{selectedLine.producedPices} pcs</p>
                <p className="text-lg">{selectedLine.producedWeight.toFixed(2)} kg</p>
                <p className="text-sm">Utilization: {selectedLine.capacityUtilization.toFixed(1)}%</p>
              </div>
            </div>
            
            <div className="mb-6">
              <h4 className="font-semibold mb-2">Completion Status</h4>
              <div className="flex items-center">
                <div className="w-full mr-4">
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div 
                      className="bg-blue-600 h-4 rounded-full" 
                      style={{ width: `${Math.min(100, selectedLine.completionRate)}%` }}
                    ></div>
                  </div>
                </div>
                <span className="text-xl font-bold">{selectedLine.completionRate.toFixed(1)}%</span>
              </div>
              <div className="mt-2 text-right">
                {selectedLine.isLineCompleted ? (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    Completed ✓
                  </span>
                ) : (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                    In Progress
                  </span>
                )}
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3">Component Details</h4>
              <div className="space-y-3">
                {selectedLine.components.map((comp, i) => (
                  <div key={i} className="border rounded-lg p-3">
                    <div className="flex justify-between items-start">
                      <span className={`font-medium ${comp.isCompleted ? 'text-green-600' : ''}`}>
                        {comp.component} {comp.isCompleted && '✓'}
                      </span>
                      <span className="text-sm text-gray-600">
                        {comp.producedPices}/{comp.plannedPices} pcs
                      </span>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-sm">
                        {comp.producedWeight.toFixed(2)}/{comp.plannedWeight.toFixed(2)} kg
                      </span>
                      {comp.productionDates && (
                        <span className="text-xs text-gray-500">Produced: {comp.productionDates}</span>
                      )}
                    </div>
                    <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                      <div 
                            className="bg-blue-400 h-2 rounded-full" 
                            style={{ 
                                width: `${Math.min(100, comp.plannedPices > 0 ? (comp.producedPices / comp.plannedPices * 100) : 0)}%` 
                            }}
                            ></div>

                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}