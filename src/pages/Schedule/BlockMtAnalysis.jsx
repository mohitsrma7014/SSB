import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer, Cell, LabelList, Tooltip } from 'recharts';
import { useState } from 'react';

const lineCapacities = {
  'HAMMER1': 180,
  'A-SET': 150,
  'B-set': 150,
  '1000 Ton': 150,
  '1600 TON': 175,
  'HAMMER2': 180,
  'W-SET': 150,
  'FFL': 150,
  'NHF-1000': 140,
};

export default function BlockMtAnalysis({ data = [], forgingData = [] }) {
  const [selectedLine, setSelectedLine] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  
  // Process data for line-wise production
const lineData = (data || []).reduce((acc, item) => {
  const line = item.line || 'Unknown';
  if (!acc[line]) {
    acc[line] = {
      line,
      totalPices: 0,
      totalWeight: 0,
      components: {},
      completed: true,
      capacity: lineCapacities[line.toUpperCase()] || 150
    };
  }
  
  // Only add to planned quantities if not already present
  if (!acc[line].components[item.component]) {
    acc[line].components[item.component] = {
      component: item.component,
      pices: item.pices || 0,
      weight: parseFloat(item.weight || 0) / 1000,
      producedPices: 0,
      producedWeight: 0,
      isCompleted: false,
      productionDates: new Set()
    };
    acc[line].totalPices += item.pices || 0;
    acc[line].totalWeight += parseFloat(item.weight || 0) / 1000;
  }

  return acc;
}, {});

// Process production data separately
(forgingData || []).forEach(item => {
  const line = item.line || 'Unknown';
  if (!lineData[line]) {
    lineData[line] = {
      line,
      totalPices: 0,
      totalWeight: 0,
      components: {},
      completed: true,
      capacity: lineCapacities[line.toUpperCase()] || 150
    };
  }

  const componentName = item.component;
  if (!lineData[line].components[componentName]) {
    // This is additional production (not in plan)
    lineData[line].components[componentName] = {
      component: componentName,
      pices: 0, // No planned quantity
      weight: 0,
      producedPices: item.production || 0,
      producedWeight: parseFloat(item.weight || item.slug_weight || 0) / 1000 * (item.production || 0),
      isCompleted: false,
      productionDates: new Set()
    };
  } else {
    // Add to existing component's production
    const component = lineData[line].components[componentName];
    component.producedPices += item.production || 0;
    component.producedWeight += parseFloat(item.weight || item.slug_weight || 0) / 1000 * (item.production || 0);
  }

  // Add production date if available
  if (item.date && lineData[line].components[componentName]) {
    lineData[line].components[componentName].productionDates.add(item.date);
  }
});

// Calculate completion status and convert to arrays
Object.values(lineData).forEach(line => {
  line.components = Object.values(line.components).map(comp => {
    // For planned components (pices > 0), check if production meets plan
    const isCompleted = comp.pices > 0 ? comp.producedPices >= comp.pices : false;
    
    // Update line completion status
    if (comp.pices > 0 && !isCompleted) {
      line.completed = false;
    }

    return {
      ...comp,
      isCompleted,
      productionDates: Array.from(comp.productionDates).sort()
    };
  });
});

// Calculate chart data
const chartData = Object.values(lineData).map(line => {
  const totalProducedPices = line.components.reduce((sum, c) => sum + (c.producedPices || 0), 0);
  const totalProducedWeight = line.components.reduce((sum, c) => sum + (c.producedWeight || 0), 0);
  const capacityUtilization = line.capacity > 0 ? (totalProducedWeight / line.capacity) * 100 : 0;

  let color;
  if (capacityUtilization < 60) {
    color = '#FF9800';
  } else if (capacityUtilization < 80) {
    color = '#FFC107';
  } else if (capacityUtilization < 100) {
    color = '#4CAF50';
  } else {
    color = '#F44336';
  }

  return {
    name: line.line,
    pices: line.totalPices,
    weight: line.totalWeight,
    producedPices: totalProducedPices,
    producedWeight: totalProducedWeight,
    completionRate: line.totalPices > 0 
      ? (line.components.reduce((sum, c) => 
          sum + (c.pices > 0 ? Math.min(c.producedPices, c.pices) : 0), 0) / line.totalPices * 100)
      : 0,
    isLineCompleted: line.completed,
    capacity: line.capacity,
    capacityUtilization,
    color,
    components: line.components
  };
});

  // Rest of the component remains the same...
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
        y={y + 20}
        fill="#000"
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={12}
      >
        {formattedValue} ton
      </text>
    );
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 border rounded shadow-lg">
          <p className="font-bold">{label}</p>
          <p>Planned: {data.weight.toFixed(1)} ton ({data.pices.toLocaleString()} pcs)</p>
          <p>Produced: {data.producedWeight.toFixed(1)} ton ({data.producedPices.toLocaleString()} pcs)</p>
          <p>Capacity: {data.capacity} ton</p>
          <p>Utilization: {data.capacityUtilization.toFixed(1)}%</p>
        </div>
      );
    }
    return null;
  };

  const formatProductionDates = (datesArray) => {
    if (!datesArray || datesArray.length === 0) return '';
    return datesArray.sort().join(', ');
  };

  return (
    <div className="relative">
      <h2 className="text-xl font-semibold mb-4">Line-wise Production Planning (in Tons)</h2>
      
      <div className="flex flex-wrap gap-4 mb-4">
        <div className="flex items-center">
          <div className="w-4 h-4 bg-[#FF9800] mr-2"></div>
          <span>Below 60% capacity</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-[#FFC107] mr-2"></div>
          <span>60-80% capacity</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-[#4CAF50] mr-2"></div>
          <span>80-100% capacity</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-[#F44336] mr-2"></div>
          <span>Over 100% capacity</span>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow mb-6">
        {chartData.length > 0 ? (
          <div className="flex">
            <div className="flex-1">
              <ResponsiveContainer width="100%" height={500}>
                <BarChart
                  data={chartData}
                  layout="vertical"
                  margin={{ top: 20, right: 30, left: 40, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" unit=" ton" />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    width={100} 
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar 
                    dataKey="weight" 
                    name="Planned Weight" 
                    fill="#8884d8"
                  >
                    {chartData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.color}
                        onClick={() => handleBarClick(entry)}
                      />
                    ))}
                    <LabelList dataKey="weight" content={renderCustomizedLabel} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="w-64 ml-4 border-l pl-4">
              <h3 className="font-bold mb-4">Total Summary</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-sm">Planned</h4>
                  <p className="text-lg">
                    {chartData.reduce((sum, line) => sum + (line.weight || 0), 0).toFixed(1)} ton
                  </p>
                  <p className="text-sm">
                    {chartData.reduce((sum, line) => sum + (line.pices || 0), 0).toLocaleString()} pcs
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm">Total Produced</h4>
                  <p className="text-lg">
                    {chartData.reduce((sum, line) => 
                      sum + (line.components || []).reduce(
                        (s, c) => s + (c.producedWeight || 0), 0
                      ), 0).toFixed(1)} ton
                  </p>
                  <p className="text-sm">
                    {chartData.reduce((sum, line) => 
                      sum + (line.components || []).reduce(
                        (s, c) => s + (c.producedPices || 0), 0
                      ), 0).toLocaleString()} pcs
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm">Additional Production</h4>
                  <p className="text-lg">
                    {chartData.reduce((sum, line) => 
                      sum + (line.components || []).reduce(
                        (s, c) => s + (c.pices === 0 ? (c.producedWeight || 0) : 0), 0
                      ), 0).toFixed(1)} ton
                  </p>
                  <p className="text-sm">
                    {chartData.reduce((sum, line) => 
                      sum + (line.components || []).reduce(
                        (s, c) => s + (c.pices === 0 ? (c.producedPices || 0) : 0), 0
                      ), 0).toLocaleString()} pcs
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm">Planned Completion</h4>
                  <p className="text-lg">
                    {chartData.reduce((sum, line) => 
                      sum + (line.components || []).reduce(
                        (s, c) => s + (c.pices > 0 ? (c.producedPices || 0) : 0), 0
                      ), 0).toLocaleString()} /{' '}
                    {chartData.reduce((sum, line) => sum + (line.pices || 0), 0).toLocaleString()} pcs
                  </p>
                  <p className="text-sm">
                    {(
                      (chartData.reduce((sum, line) => 
                        sum + (line.components || []).reduce(
                          (s, c) => s + (c.pices > 0 ? (c.producedPices || 0) : 0), 0
                        ), 0) /
                      Math.max(1, chartData.reduce((sum, line) => sum + (line.pices || 0), 0)) * 100
                    ).toFixed(1))}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">No production data available</div>
        )}
      </div>

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
                <p className="text-2xl font-bold">{selectedLine.pices.toLocaleString()} pcs</p>
                <p className="text-lg">{selectedLine.weight.toFixed(2)} ton</p>
                <p className="text-sm">Capacity: {selectedLine.capacity} ton</p>
              </div>
              <div className="bg-gray-50 p-4 rounded">
                <h4 className="font-semibold mb-2">Produced</h4>
                <p className="text-2xl font-bold">{selectedLine.producedPices.toLocaleString()} pcs</p>
                <p className="text-lg">{selectedLine.producedWeight.toFixed(2)} ton</p>
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
            
            <div className="mb-8">
              <h4 className="font-semibold mb-3">Components</h4>
              {selectedLine.components && selectedLine.components.length > 0 ? (
                <div className="space-y-3">
                  {selectedLine.components.map((comp, i) => (
                    <div key={`component-${i}`} className={`border rounded-lg p-3 ${comp.pices === 0 ? 'bg-gray-50' : ''}`}>
                      <div className="flex justify-between items-start">
                        <span className={`font-medium ${comp.isCompleted ? 'text-green-600' : ''}`}>
                          {comp.component} {comp.isCompleted && comp.pices > 0 && '✓'}
                          {comp.pices === 0 && <span className="text-xs text-gray-500 ml-2">(additional)</span>}
                        </span>
                        <span className="text-sm text-gray-600">
                          {comp.producedPices.toLocaleString()}{comp.pices > 0 ? `/${comp.pices.toLocaleString()}` : ''} pcs
                        </span>
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-sm">
                          {comp.producedWeight.toFixed(2)}{comp.pices > 0 ? `/${comp.weight.toFixed(2)}` : ''} ton
                        </span>
                      </div>
                      {comp.productionDates && comp.productionDates.length > 0 && (
                        <div className="mt-1 text-xs text-gray-500">
                          Produced: {formatProductionDates(comp.productionDates)}
                        </div>
                      )}
                      {comp.pices > 0 && (
                        <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-400 h-2 rounded-full" 
                            style={{ 
                              width: `${Math.min(100, comp.pices > 0 ? (comp.producedPices / comp.pices * 100) : 0)}%` 
                            }}
                          ></div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No components data</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}