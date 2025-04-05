import { useState, useEffect, useMemo, useCallback } from 'react'
import axios from 'axios'
import { 
  Container, 
  Typography, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  CircularProgress,
  Chip,
  Grid,
  Card,
  CardContent,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TablePagination,
  Tooltip
} from '@mui/material'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { format, subDays, differenceInDays } from 'date-fns'
import { InfoOutlined, Close } from '@mui/icons-material'

function Attdencelogs() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [filters, setFilters] = useState({
    employeeId: '',
    shiftType: '',
    minHours: '',
    maxHours: ''
  })
  const [dateRange, setDateRange] = useState({
    startDate: subDays(new Date(), 7),
    endDate: new Date()
  })
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  // Memoized data fetching
  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const fromDate = format(dateRange.startDate, 'yyyy/MM/dd')
      const toDate = format(dateRange.endDate, 'yyyy/MM/dd')
      const response = await axios.get(
        `http://127.0.0.1:8000/api/get_working_hours/?from_date=${fromDate}&to_date=${toDate}`
      )
      setData(response.data.working_hours || [])
    } catch (err) {
      setError(err.message)
      console.error('Error fetching data:', err)
    } finally {
      setLoading(false)
    }
  }, [dateRange])

  // Initial fetch and when date range changes
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchData()
    }, 500) // Debounce to avoid rapid API calls
    
    return () => clearTimeout(debounceTimer)
  }, [dateRange, fetchData])

  // Memoized filtered data for better performance
  const filteredData = useMemo(() => {
    return data.filter(employee => {
      return (
        (filters.employeeId === '' || employee.employee_id.includes(filters.employeeId)) &&
        (filters.shiftType === '' || employee.shift_type === filters.shiftType) &&
        (filters.minHours === '' || parseFloat(employee.total_working_hours) >= parseFloat(filters.minHours)) &&
        (filters.maxHours === '' || parseFloat(employee.total_working_hours) <= parseFloat(filters.maxHours))
      )
    })
  }, [data, filters])

  // Calculate statistics
  const { totalHours, avgDailyHours, dayShiftCount, nightShiftCount } = useMemo(() => {
    const daysInRange = differenceInDays(dateRange.endDate, dateRange.startDate) || 1
    const stats = filteredData.reduce((acc, employee) => {
      const hours = parseFloat(employee.total_working_hours.split(':')[0]) + 
                   parseFloat(employee.total_working_hours.split(':')[1]) / 60
      
      acc.totalHours += hours
      acc.dayShiftCount += employee.shift_type === 'Day Shift' ? 1 : 0
      acc.nightShiftCount += employee.shift_type === 'Night Shift' ? 1 : 0
      
      return acc
    }, { totalHours: 0, dayShiftCount: 0, nightShiftCount: 0 })

    return {
      ...stats,
      avgDailyHours: (stats.totalHours / daysInRange).toFixed(1)
    }
  }, [filteredData, dateRange])

  const shiftTypeColors = {
    'Day Shift': 'success',
    'Night Shift': 'primary',
    'Mixed Shifts': 'warning',
    'Unknown': 'default'
  }

  const handleFilterChange = (e) => {
    const { name, value } = e.target
    setFilters(prev => ({ ...prev, [name]: value }))
  }

  const handleChangePage = (event, newPage) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  const handleEmployeeSelect = (employee) => {
    setSelectedEmployee(employee)
  }

  const handleCloseDialog = () => {
    setSelectedEmployee(null)
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Employee Working Hours
      </Typography>
      
      {/* Filters Section */}
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <DatePicker
              selected={dateRange.startDate}
              onChange={(date) => setDateRange({...dateRange, startDate: date})}
              selectsStart
              startDate={dateRange.startDate}
              endDate={dateRange.endDate}
              customInput={<TextField fullWidth label="From Date" />}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <DatePicker
              selected={dateRange.endDate}
              onChange={(date) => setDateRange({...dateRange, endDate: date})}
              selectsEnd
              startDate={dateRange.startDate}
              endDate={dateRange.endDate}
              minDate={dateRange.startDate}
              customInput={<TextField fullWidth label="To Date" />}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              fullWidth
              label="Employee ID"
              name="employeeId"
              value={filters.employeeId}
              onChange={handleFilterChange}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth>
              <InputLabel>Shift Type</InputLabel>
              <Select
                name="shiftType"
                value={filters.shiftType}
                label="Shift Type"
                onChange={handleFilterChange}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="Day Shift">Day Shift</MenuItem>
                <MenuItem value="Night Shift">Night Shift</MenuItem>
                <MenuItem value="Mixed Shifts">Mixed Shifts</MenuItem>
                <MenuItem value="Unknown">Unknown</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={1}>
            <TextField
              fullWidth
              label="Min Hours"
              name="minHours"
              type="number"
              value={filters.minHours}
              onChange={handleFilterChange}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={1}>
            <TextField
              fullWidth
              label="Max Hours"
              name="maxHours"
              type="number"
              value={filters.maxHours}
              onChange={handleFilterChange}
            />
          </Grid>
        </Grid>
      </Paper>

      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', margin: '20px 0' }}>
          <CircularProgress />
        </div>
      )}

      {error && (
        <Paper elevation={3} sx={{ p: 3, mb: 3, backgroundColor: 'error.light' }}>
          <Typography color="error">{error}</Typography>
        </Paper>
      )}

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary">Total Employees</Typography>
              <Typography variant="h4">{filteredData.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary">Day Shifts</Typography>
              <Typography variant="h4">{dayShiftCount}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary">Night Shifts</Typography>
              <Typography variant="h4">{nightShiftCount}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Tooltip title={`Total: ${totalHours.toFixed(1)} hours`}>
                <Typography color="text.secondary">Avg. Daily Hours</Typography>
              </Tooltip>
              <Typography variant="h4">{avgDailyHours}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Data Table */}
      <Paper elevation={3}>
        <TableContainer sx={{ maxHeight: 'calc(100vh - 400px)' }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Employee ID</TableCell>
                <TableCell>Shift Type</TableCell>
                <TableCell>Total Hours</TableCell>
                <TableCell>Sessions</TableCell>
                <TableCell>Details</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredData
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((employee) => (
                  <TableRow key={employee.employee_id} hover>
                    <TableCell>{employee.employee_id}</TableCell>
                    <TableCell>
                      <Chip 
                        label={employee.shift_type} 
                        color={shiftTypeColors[employee.shift_type] || 'default'} 
                      />
                    </TableCell>
                    <TableCell>{employee.total_working_hours}</TableCell>
                    <TableCell>{employee.total_sessions}</TableCell>
                    <TableCell>
                      <IconButton 
                        onClick={() => handleEmployeeSelect(employee)}
                        color="primary"
                      >
                        <InfoOutlined />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[10, 25, 50, 100]}
          component="div"
          count={filteredData.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      {/* Employee Details Dialog */}
      <Dialog 
        open={Boolean(selectedEmployee)} 
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Grid container justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              {selectedEmployee?.employee_id} - Work Sessions
            </Typography>
            <IconButton onClick={handleCloseDialog}>
              <Close />
            </IconButton>
          </Grid>
        </DialogTitle>
        <DialogContent dividers>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Check In</TableCell>
                  <TableCell>Check Out</TableCell>
                  <TableCell>Duration</TableCell>
                  <TableCell>Shift Type</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {selectedEmployee?.work_sessions?.map((session, i) => (
                  <TableRow key={i}>
                    <TableCell>{session.date}</TableCell>
                    <TableCell>{session.check_in}</TableCell>
                    <TableCell>{session.check_out}</TableCell>
                    <TableCell>{session.duration}</TableCell>
                    <TableCell>
                      {session.is_night_shift ? 'Night Shift' : 'Day Shift'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}

export default Attdencelogs