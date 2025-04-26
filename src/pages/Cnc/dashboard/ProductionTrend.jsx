import { Card, CardContent, Typography } from '@mui/material'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const ProductionTrend = ({ data }) => {
  // Process data to group by date
  const processData = (rawData) => {
    if (!rawData) return []
    
    const dateMap = rawData.reduce((acc, item) => {
      const date = item.date
      if (!acc[date]) {
        acc[date] = { date, production: 0, target: 0 }
      }
      acc[date].production += item.production
      acc[date].target += item.target
      return acc
    }, {})
    
    return Object.values(dateMap).sort((a, b) => new Date(a.date) - new Date(b.date))
  }

  const chartData = processData(data)

  return (
    <Card elevation={3}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Daily Production Trend
        </Typography>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="production" fill="#8884d8" name="Actual Production" />
            <Bar dataKey="target" fill="#82ca9d" name="Target" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

export default ProductionTrend