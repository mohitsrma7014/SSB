// src/components/AttendanceChart.jsx
import React from 'react'
import { Box, Paper, Typography } from '@mui/material'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

const AttendanceChart = ({ data }) => {
  if (!data || data.length === 0) return null

  // Limit to top 20 employees for better chart readability
  const chartData = [...data]
    .sort((a, b) => b.present - a.present)
    .slice(0, 20)

  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Attendance Overview (Top 20 Employees)
      </Typography>
      <Box sx={{ height: 400 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 5,
            }}
            layout="vertical"
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis
              dataKey="name"
              type="category"
              width={120}
              tick={{ fontSize: 12 }}
            />
            <Tooltip />
            <Legend />
            <Bar dataKey="present" fill="#4caf50" name="Present Days" />
            <Bar dataKey="absent" fill="#f44336" name="Absent Days" />
            <Bar dataKey="od" fill="#2196f3" name="OD Days" />
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  )
}

export default AttendanceChart