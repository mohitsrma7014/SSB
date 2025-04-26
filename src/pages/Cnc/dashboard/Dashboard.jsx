import { useState, useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query';

import axios from 'axios'
import {
  Box, Grid, Typography, Card , CardContent, TextField,
  MenuItem, Select, FormControl, InputLabel, Divider,
  CircularProgress, useTheme, useMediaQuery
} from '@mui/material'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, PieChart, Pie, Cell,
  LineChart, Line
} from 'recharts'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { DataGrid } from '@mui/x-data-grid'
import DashboardFilters from './DashboardFilters'
import RejectionBreakdown from './RejectionBreakdown'
import EfficiencyCard from './EfficiencyCard'
import ProductionTrend from './ProductionTrend'
import MachinePerformance from './MachinePerformance'
import OperatorStats from './OperatorStats'
import CostAnalysis from './CostAnalysis'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

const Dashboard = () => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const [filters, setFilters] = useState({
    component: '',
    machineNo: '',
    operator: '',
    inspector: '',
    batchNumber: '',
    dateRange: [null, null],
    shift: '',
    mcType: ''
  })

  // Fetch summary data
// Fetch summary data
const { data: summaryData, isLoading: summaryLoading } = useQuery({
    queryKey: ['summary', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.component) params.append('component', filters.component);
      if (filters.machineNo) params.append('machine_no', filters.machineNo);
      if (filters.operator) params.append('operator', filters.operator);
      if (filters.inspector) params.append('inspector', filters.inspector);
      if (filters.batchNumber) params.append('batch_number', filters.batchNumber);
      if (filters.shift) params.append('shift', filters.shift);
      if (filters.mcType) params.append('mc_type', filters.mcType);
      if (filters.dateRange[0]) params.append('date__gte', filters.dateRange[0].toISOString().split('T')[0]);
      if (filters.dateRange[1]) params.append('date__lte', filters.dateRange[1].toISOString().split('T')[0]);
  
      const response = await axios.get('http://192.168.1.199:8001/cnc/api/machining/summary/', { params });
      return response.data;
    }
  });
  
  // Fetch detailed data
  const { data: detailedData, isLoading: detailLoading } = useQuery({
    queryKey: ['details', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.component) params.append('component', filters.component);
      if (filters.machineNo) params.append('machine_no', filters.machineNo);
      if (filters.operator) params.append('operator', filters.operator);
      if (filters.inspector) params.append('inspector', filters.inspector);
      if (filters.batchNumber) params.append('batch_number', filters.batchNumber);
      if (filters.shift) params.append('shift', filters.shift);
      if (filters.mcType) params.append('mc_type', filters.mcType);
      if (filters.dateRange[0]) params.append('date__gte', filters.dateRange[0].toISOString().split('T')[0]);
      if (filters.dateRange[1]) params.append('date__lte', filters.dateRange[1].toISOString().split('T')[0]);
  
      const response = await axios.get('http://192.168.1.199:8001/cnc/api/machining/dashboard/', { params });
      return response.data;
    }
  });
  

  // Process data for charts
  const rejectionData = useMemo(() => {
    if (!summaryData?.rejection) return []
    return [
      { name: 'CNC', value: summaryData.rejection.cnc_rejection },
      { name: 'Forging', value: summaryData.rejection.forging_rejection },
      { name: 'Pre-MC', value: summaryData.rejection.pre_mc_rejection },
      { name: 'Rework', value: summaryData.rejection.rework_rejection },
    ]
  }, [summaryData])

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }))
  }

  if (summaryLoading || detailLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box sx={{ p: isMobile ? 1 : 3 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
        CNC Machining Dashboard
      </Typography>

      {/* Filters */}
      <DashboardFilters filters={filters} onFilterChange={handleFilterChange} />

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} sm={6} md={3}>
          <EfficiencyCard 
            efficiency={summaryData?.efficiency || 0} 
            production={summaryData?.total_production || 0}
            target={summaryData?.total_target || 0}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" color="textSecondary">
                Total Rejection
              </Typography>
              <Typography variant="h4" sx={{ mt: 1 }}>
                {rejectionData.reduce((sum, item) => sum + item.value, 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" color="textSecondary">
                Rejection Cost
              </Typography>
              <Typography variant="h4" sx={{ mt: 1 }}>
                ₹{summaryData?.rejection_costs ? 
                  Object.values(summaryData.rejection_costs).reduce((a, b) => a + b, 0).toLocaleString('en-IN') 
                  : 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" color="textSecondary">
                Active Machines
              </Typography>
              <Typography variant="h4" sx={{ mt: 1 }}>
                {summaryData?.machine_stats?.length || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={3} sx={{ mt: 1 }}>
        <Grid item xs={12} md={6}>
          <RejectionBreakdown data={rejectionData} />
        </Grid>
        <Grid item xs={12} md={6}>
          <ProductionTrend data={detailedData} />
        </Grid>
        <Grid item xs={12} md={6}>
          <MachinePerformance data={summaryData?.machine_stats} />
        </Grid>
        <Grid item xs={12} md={6}>
          <OperatorStats data={summaryData?.operator_stats} />
        </Grid>
      </Grid>

      {/* Cost Analysis */}
      <Box sx={{ mt: 4 }}>
        <CostAnalysis 
          rejectionCosts={summaryData?.rejection_costs} 
          componentCosts={summaryData?.component_costs}
        />
      </Box>

      {/* Detailed Data Table */}
      <Box sx={{ height: 400, width: '100%', mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Detailed Production Data
        </Typography>
        <DataGrid
  rows={detailedData || []}
  columns={[
    { field: 'batch_number', headerName: 'Batch', width: 120 },
    { field: 'date', headerName: 'Date', width: 120 },
    { field: 'component', headerName: 'Component', width: 150 },
    { field: 'machine_no', headerName: 'Machine', width: 100 },
    { field: 'operator', headerName: 'Operator', width: 120 },
    { field: 'production', headerName: 'Production', type: 'number', width: 120 },
    { field: 'target', headerName: 'Target', type: 'number', width: 120 },
    { field: 'total_rejection', headerName: 'Rejection', type: 'number', width: 120 },
  ]}
  pageSize={5}
  rowsPerPageOptions={[5, 10, 20]}
  disableSelectionOnClick
  getRowId={(row) => `${row.batch_number}-${row.date}-${row.machine_no}`}
/>

      </Box>
    </Box>
  )
}

export default Dashboard