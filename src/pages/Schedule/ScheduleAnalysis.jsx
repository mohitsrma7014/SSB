import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis,CartesianGrid  } from 'recharts';

export default function ScheduleAnalysis({ data }) {
  // Process data for customer-wise schedules
  const customerData = data.reduce((acc, item) => {
    const customer = item.customer || 'Unknown';
    if (!acc[customer]) {
      acc[customer] = { customer, totalPices: 0, totalWeight: 0, totalCost: 0, components: [] };
    }
    acc[customer].totalPices += item.pices;
    acc[customer].totalWeight += parseFloat(item.weight || 0);
    acc[customer].totalCost += parseFloat(item.cost || 0) * item.pices;
    acc[customer].components.push(item);
    return acc;
  }, {});

  const pieData = Object.values(customerData).map(cust => ({
    name: cust.customer,
    value: cust.totalPices,
    weight: cust.totalWeight,
    cost: cust.totalCost
  }));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A4DE6C', '#D0ED57'];

  const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-4 border rounded shadow-lg">
        <p className="font-bold">{data.name || data.component}</p>
        <p>Scheduled Pieces: {data.value ?? data.pices}</p>
        <p>Total Weight: {(data.weight ?? 0).toFixed(2)} kg</p>
        <p>Estimated Cost: ₹{(data.cost ?? 0).toFixed(2)}</p>
      </div>
    );
  }
  return null;
};


  // Prepare data for component-wise bar chart
  const componentData = data.reduce((acc, item) => {
    const existing = acc.find(c => c.component === item.component);
    if (existing) {
      existing.pices += item.pices;
      existing.weight += parseFloat(item.weight || 0);
    } else {
      acc.push({
        component: item.component,
        pices: item.pices,
        weight: parseFloat(item.weight || 0),
        customer: item.customer,
        location: item.location
      });
    }
    return acc;
  }, []).sort((a, b) => b.pices - a.pices).slice(0, 10);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Customer Schedules Analysis</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold mb-2">Customer-wise Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold mb-2">Top Components</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={componentData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="component" angle={-45} textAnchor="end" height={60} />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="pices" name="Pieces" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="font-semibold mb-2">Detailed Schedule</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Component</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pieces</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Weight (kg)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.map((item, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap">{item.component}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{item.customer}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{item.location}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{item.pices}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{item.weight}</td>
                  <td className="px-6 py-4 whitespace-nowrap">₹{(parseFloat(item.cost || 0) * item.pices).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}