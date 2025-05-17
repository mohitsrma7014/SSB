import { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

export default function ForgingAnalysis({ data, scheduleData, lineCapacities }) {
  // Process data for line-wise production
  const lineData = data.reduce((acc, item) => {
    const line = item.line || 'Unknown';
    if (!acc[line]) {
      acc[line] = { 
        line, 
        totalProduction: 0, 
        totalWeight: 0,
        components: [],
        capacity: lineCapacities[line] || 0
      };
    }
    const weight = parseFloat(item.slug_weight || 0) * item.production;
    acc[line].totalProduction += item.production;
    acc[line].totalWeight += weight;
    acc[line].components.push({
      component: item.component,
      production: item.production,
      weight: weight,
      date: item.date
    });
    return acc;
  }, {});

  const chartData = Object.values(lineData).map(line => ({
    name: line.line,
    production: line.totalProduction,
    weight: line.totalWeight,
    capacity: line.capacity,
    utilization: line.capacity > 0 ? (line.totalWeight / line.capacity * 100) : 0
  }));

  // Calculate total production
  const totalProduction = data.reduce((sum, item) => sum + item.production, 0);
  const totalWeight = data.reduce(
  (sum, item) => sum + (parseFloat(item.slug_weight || 0) * item.production),
  0
);


  // Calculate schedule vs production
  const scheduleVsProduction = scheduleData.map(sched => {
    const forged = data
      .filter(item => item.component === sched.component)
      .reduce((sum, item) => sum + item.production, 0);
    
    return {
      component: sched.component,
      scheduled: sched.pices,
      produced: forged,
      completion: (forged / sched.pices * 100) || 0
    };
  }).filter(item => item.scheduled > 0).sort((a, b) => b.completion - a.completion);

  // Search functionality
  const [searchTerm, setSearchTerm] = useState('');
  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    const term = searchTerm.toLowerCase();
    return data.filter(item => 
      item.component.toLowerCase().includes(term) || 
      item.line.toLowerCase().includes(term) ||
      item.date.toLowerCase().includes(term))
  }, [data, searchTerm]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const line = payload[0].payload;
      return (
        <div className="bg-white p-4 border rounded shadow-lg">
          <p className="font-bold">{line.name}</p>
          <p>Total Production: {line.production} pieces</p>
          <p>Total Weight: {line.weight.toFixed(2)} kg</p>
          <p>Capacity Utilization: {line.utilization.toFixed(1)}%</p>
          <p>Monthly Capacity: {line.capacity} kg</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Production Details Analysis</h2>
        <div className="bg-white p-3 rounded-lg shadow">
          <div className="text-sm text-gray-500">Total Production</div>
          <div className="text-2xl font-bold">
            {totalProduction.toLocaleString()} <span className="text-sm font-normal">pieces</span>
          </div>
          <div className="text-sm">
            {totalWeight.toFixed(2)} <span className="text-sm font-normal">kg</span>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold mb-2">Line-wise Production</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
              <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar yAxisId="left" dataKey="production" name="Pieces" fill="#8884d8" />
              <Bar yAxisId="right" dataKey="weight" name="Weight (kg)" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold mb-2">Capacity Utilization</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis unit="%" />
              <Tooltip formatter={(value) => [`${value}%`, "Utilization"]} />
              <Legend />
              <Bar dataKey="utilization" name="Utilization %" fill="#FF8042" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h3 className="font-semibold mb-2">Schedule vs Production</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={scheduleVsProduction.slice(0, 15)}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="component" angle={-45} textAnchor="end" height={60} />
            <YAxis yAxisId="left" orientation="left" />
            <YAxis yAxisId="right" orientation="right" domain={[0, 100]} />
            <Tooltip formatter={(value, name) => 
              name === 'completion' ? [`${value}%`, "Completion"] : [value, name]
            } />
            <Legend />
            <Bar yAxisId="left" dataKey="scheduled" name="Scheduled" fill="#8884d8" />
            <Bar yAxisId="left" dataKey="produced" name="Produced" fill="#82ca9d" />
            <Line yAxisId="right" type="monotone" dataKey="completion" name="Completion %" stroke="#FF8042" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold">Production Details</h3>
          <div className="relative">
            <input
              type="text"
              placeholder="Search components..."
              className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <svg
              className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>
        <div className="overflow-x-auto max-h-96 overflow-y-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Component</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Line</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Production</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Weight (kg)</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredData.map((item, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap">{item.date}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{item.component}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{item.line}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{item.production}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{(parseFloat(item.slug_weight || 0) * item.production).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}