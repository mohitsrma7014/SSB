import { Card, CardContent, Typography, Box, Grid } from '@mui/material'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const CostAnalysis = ({ rejectionCosts, componentCosts }) => {
  if (!rejectionCosts || !componentCosts) return null

  // Prepare data for the cost chart
  const costData = [
    {
      name: 'CNC Rejection',
      cost: rejectionCosts.cnc_rejection_cost,
      color: '#0088FE'
    },
    {
      name: 'Forging Rejection',
      cost: rejectionCosts.forging_rejection_cost,
      color: '#00C49F'
    },
    {
      name: 'Pre-MC Rejection',
      cost: rejectionCosts.pre_mc_rejection_cost,
      color: '#FFBB28'
    },
    {
      name: 'Rework Rejection',
      cost: rejectionCosts.rework_rejection_cost,
      color: '#FF8042'
    }
  ]

  // Prepare data for component costs (top 5 most expensive)
  const topComponents = Object.entries(componentCosts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([component, cost]) => ({ component, cost }))

  return (
    <Card elevation={3}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Cost Analysis
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Typography variant="subtitle1" sx={{ mb: 2 }}>
              Rejection Costs by Category
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={costData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis 
                  tickFormatter={(value) => `₹${value.toLocaleString('en-IN')}`}
                />
                <Tooltip 
                  formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, 'Cost']}
                  labelFormatter={(name) => `Category: ${name}`}
                />
                <Legend />
                <Bar dataKey="cost" name="Rejection Cost">
                  {costData.map((entry, index) => (
                    <Bar key={`bar-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Grid>

          <Grid item xs={12} md={4}>
            <Typography variant="subtitle1" sx={{ mb: 2 }}>
              Top Component Costs
            </Typography>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              gap: 2,
              height: 300,
              overflowY: 'auto',
              pr: 2
            }}>
              {topComponents.map((item, index) => (
                <Card key={index} variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="body1" fontWeight="medium">
                    {item.component}
                  </Typography>
                  <Typography variant="h6" color="primary">
                    ₹{item.cost.toLocaleString('en-IN')}
                  </Typography>
                </Card>
              ))}
            </Box>
          </Grid>
        </Grid>

        <Box sx={{ mt: 3, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            Total Rejection Cost
          </Typography>
          <Typography variant="h4" color="error">
            ₹{Object.values(rejectionCosts).reduce((a, b) => a + b, 0).toLocaleString('en-IN')}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  )
}

export default CostAnalysis