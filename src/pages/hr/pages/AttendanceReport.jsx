import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import {
  Box, Button, Container, TextField, Typography,
  CircularProgress, Paper, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Snackbar, Alert, Pagination, InputAdornment
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import SearchIcon from '@mui/icons-material/Search';
import { Sidebar } from "../../Navigation/Sidebar";
import DashboardHeader from "../../Navigation/DashboardHeader";
const BASE_URL = 'http://192.168.1.199:8002/api/save/attendancesave';

const AttendanceReport = () => {
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
    
  const toggleSidebar = () => {
    setIsSidebarVisible(!isSidebarVisible);
  };
  const pageTitle = "Attendance Report";

  const navigate = useNavigate();

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredData(data);
      setPage(1);
    } else {
      const filtered = data.filter(item => {
        const att = item.attendance_data;
        return (
          att.employee_id.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
          att.employee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          att.department.toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
      setFilteredData(filtered);
      setPage(1);
    }
  }, [searchTerm, data]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!month || !year) {
      setSnackbar({
        open: true,
        message: 'Please enter both month and year',
        severity: 'error'
      });
      return;
    }

    try {
      setLoading(true);
      setError(null);
      let url = `${BASE_URL}?month=${parseInt(month)}&year=${parseInt(year)}`;

      if (employeeId) {
        url += `&employee_id=${employeeId}`;
      }
      console.log("Fetching from:", url);

      const response = await axios.get(url, {
        headers: {
          'Content-Type': 'application/json',
        },
        withCredentials: false,
      });
      
      const responseData = response.data || [];
      setData(responseData);
      setFilteredData(responseData);

      if (responseData.length === 0) {
        setSnackbar({
          open: true,
          message: 'No attendance records found for the selected criteria',
          severity: 'info'
        });
      }
    } catch (err) {
      console.error('Error fetching attendance data:', err);
      setError(err.message);
      setSnackbar({
        open: true,
        message: 'Failed to fetch attendance data',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (employee) => {
    setSelectedEmployee(employee);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedEmployee(null);
  };

  const handleBackToFilter = () => {
    setData([]);
    setFilteredData([]);
    setMonth('');
    setYear('');
    setEmployeeId('');
    setSearchTerm('');
  };

  const handleDownloadEmployeeExcel = () => {
    if (!selectedEmployee) return;

    const attendanceData = selectedEmployee.attendance_data;
    const dailyAttendance = attendanceData.daily_attendance;

    const wsData = [
      ['Employee ID', 'Name', 'Department', 'Total Days', 'Working Days', 'Present Days', 
       'Absent Days', 'Half Days', 'Total Overtime Hours', 'OD Display'],
      [
        attendanceData.employee_id,
        attendanceData.employee_name,
        attendanceData.department,
        attendanceData.total_days_in_month,
        attendanceData.total_working_days,
        attendanceData.total_present_days,
        attendanceData.total_absent_days,
        attendanceData.total_half_days,
        attendanceData.total_overtime_hours,
        attendanceData.extra_days.od_display || '0.0'
      ],
      [],
      ['Date', 'Day Type', 'Status', 'Scheduled In', 'Scheduled Out', 
       'Actual In', 'Actual Out', 'Working Hours', 'Overtime Hours', 
       'OD Hours', 'Remarks']
    ];

    dailyAttendance.forEach(day => {
      wsData.push([
        day.date,
        day.day_type,
        day.status,
        day.scheduled_in,
        day.scheduled_out,
        day.actual_in || '-',
        day.actual_out || '-',
        day.working_hours,
        day.overtime_hours,
        day.is_od ? day.od_hours : '0.0',
        day.remarks || '-'
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Attendance');

    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `${attendanceData.employee_name}_${month}_${year}_attendance.xlsx`);
  };

  const handleDownloadAllExcel = () => {
    if (data.length === 0) return;

    const wb = XLSX.utils.book_new();

    const summaryData = [
      ['Employee ID', 'Name', 'Department', 'Total Days', 'Working Days', 
       'Present Days', 'Absent Days', 'Half Days', 'Total Overtime Hours', 'OD Display']
    ];

    data.forEach(employee => {
      const att = employee.attendance_data;
      summaryData.push([
        att.employee_id,
        att.employee_name,
        att.department,
        att.total_days_in_month,
        att.total_working_days,
        att.total_present_days,
        att.total_absent_days,
        att.total_half_days,
        att.total_overtime_hours,
        att.extra_days.od_display || '0.0'
      ]);
    });

    const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');

    data.forEach(employee => {
      const att = employee.attendance_data;
      const detailData = [
        ['Date', 'Day Type', 'Status', 'Scheduled In', 'Scheduled Out', 
         'Actual In', 'Actual Out', 'Working Hours', 'Overtime Hours', 
         'OD Hours', 'Remarks']
      ];

      att.daily_attendance.forEach(day => {
        detailData.push([
          day.date,
          day.day_type,
          day.status,
          day.scheduled_in,
          day.scheduled_out,
          day.actual_in || '-',
          day.actual_out || '-',
          day.working_hours,
          day.overtime_hours,
          day.is_od ? day.od_hours : '0.0',
          day.remarks || '-'
        ]);
      });

      const detailWs = XLSX.utils.aoa_to_sheet(detailData);
      XLSX.utils.book_append_sheet(wb, detailWs, att.employee_name.substring(0, 31));
    });

    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `All_Employees_${month}_${year}_attendance.xlsx`);
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  const paginatedData = filteredData.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  return (
    <div className="flex">
      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full transition-all duration-300 ${
          isSidebarVisible ? "w-64" : "w-0 overflow-hidden"
        }`}
        style={{ zIndex: 50 }} 
      >
        {isSidebarVisible && <Sidebar isVisible={isSidebarVisible} toggleSidebar={toggleSidebar} />}
      </div>

      {/* Main Content */}
      <div
        className={`flex flex-col flex-grow transition-all duration-300 ${
          isSidebarVisible ? "ml-64" : "ml-0"
        }`}
      >
        <DashboardHeader isSidebarVisible={isSidebarVisible} toggleSidebar={toggleSidebar} title={pageTitle} />

        {/* Main Content */}
        <main className="flex flex-col mt-20 justify-center flex-grow pl-2">
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
              {data.length === 0 ? (
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '60vh'
                  }}
                >
                  <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
                    <Typography variant="h5" gutterBottom align="center">
                      Attendance Report
                    </Typography>
                    <Box
                      component="form"
                      onSubmit={handleSubmit}
                      sx={{ mt: 3 }}
                    >
                      <TextField
                        fullWidth
                        margin="normal"
                        label="Month"
                        type="number"
                        value={month}
                        onChange={(e) => setMonth(e.target.value)}
                        inputProps={{ min: 1, max: 12 }}
                        required
                      />
                      <TextField
                        fullWidth
                        margin="normal"
                        label="Year"
                        type="number"
                        value={year}
                        onChange={(e) => setYear(e.target.value)}
                        required
                      />
                      <TextField
                        fullWidth
                        margin="normal"
                        label="Employee ID (Optional)"
                        value={employeeId}
                        onChange={(e) => setEmployeeId(e.target.value)}
                      />
                      <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        sx={{ mt: 3, mb: 2 }}
                        disabled={loading}
                      >
                        {loading ? <CircularProgress size={24} /> : 'Fetch Report'}
                      </Button>
                    </Box>
                  </Paper>
                </Box>
              ) : (
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h4">
                      Attendance Report - {month}/{year}
                    </Typography>
                    <Box>
                      <Button
                        variant="outlined"
                        onClick={handleBackToFilter}
                        sx={{ mr: 2 }}
                      >
                        Back to Filter
                      </Button>
                      <Button
                        variant="contained"
                        color="success"
                        onClick={handleDownloadAllExcel}
                      >
                        Download All (Excel)
                      </Button>
                    </Box>
                  </Box>

                  <TextField
                    fullWidth
                    margin="normal"
                    label="Search by ID, Name or Department"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                      ),
                    }}
                    sx={{ mb: 2 }}
                  />

                  <TableContainer component={Paper}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Employee ID</TableCell>
                          <TableCell>Name</TableCell>
                          <TableCell>Department</TableCell>
                          <TableCell>Working Days</TableCell>
                          <TableCell>Present Days</TableCell>
                          <TableCell>Absent Days</TableCell>
                          <TableCell>Half Days</TableCell>
                          <TableCell>Total Ot Hours</TableCell>
                          <TableCell>OD Display</TableCell>
                          <TableCell>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {paginatedData.length > 0 ? (
                          paginatedData.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell>{item.attendance_data.employee_id}</TableCell>
                              <TableCell>{item.attendance_data.employee_name}</TableCell>
                              <TableCell>{item.attendance_data.department}</TableCell>
                              <TableCell>{item.attendance_data.total_working_days}</TableCell>
                              <TableCell>{item.attendance_data.total_present_days}</TableCell>
                              <TableCell>{item.attendance_data.total_absent_days}</TableCell>
                              <TableCell>{item.attendance_data.total_half_days}</TableCell>
                              <TableCell>{item.attendance_data.total_overtime_hours}</TableCell>
                              <TableCell>{item.attendance_data.extra_days.od_days || '0.0'} D {item.attendance_data.extra_days.od_hours || '0.0'} H</TableCell>
                              <TableCell>
                                <Button
                                  variant="outlined"
                                  onClick={() => handleViewDetails(item)}
                                >
                                  View Details
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={10} align="center">
                              No matching records found
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  {filteredData.length > rowsPerPage && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                      <Pagination
                        count={Math.ceil(filteredData.length / rowsPerPage)}
                        page={page}
                        onChange={handlePageChange}
                        color="primary"
                      />
                    </Box>
                  )}
                </Box>
              )}

              <Dialog
                open={openDialog}
                onClose={handleCloseDialog}
                maxWidth="lg"
                fullWidth
              >
                <DialogTitle>
                  {selectedEmployee?.attendance_data.employee_name} - Daily Attendance
                </DialogTitle>
                <DialogContent dividers>
                  {selectedEmployee && (
                    <Box>
                      <Box sx={{ mb: 3 }}>
                        <Typography variant="h6">Summary</Typography>
                        <Typography>
                          Employee ID: {selectedEmployee.attendance_data.employee_id}
                        </Typography>
                        <Typography>
                          Department: {selectedEmployee.attendance_data.department}
                        </Typography>
                        <Typography>
                          Total Working Days: {selectedEmployee.attendance_data.total_working_days}
                        </Typography>
                        <Typography>
                          Present Days: {selectedEmployee.attendance_data.total_present_days}
                        </Typography>
                        <Typography>
                          Absent Days: {selectedEmployee.attendance_data.total_absent_days}
                        </Typography>
                        <Typography>
                          Half Days: {selectedEmployee.attendance_data.total_half_days}
                        </Typography>
                        <Typography>
                          Total Overtime Hours: {selectedEmployee.attendance_data.total_overtime_hours}
                        </Typography>
                        <Typography>
                          OD Display: {selectedEmployee.attendance_data.extra_days.od_days || '0.0'} Days {selectedEmployee.attendance_data.extra_days.od_hours || '0.0'} Hours
                        </Typography>
                      </Box>

                      <TableContainer component={Paper}>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Date</TableCell>
                              <TableCell>Day Type</TableCell>
                              <TableCell>Status</TableCell>
                              <TableCell>Scheduled In</TableCell>
                              <TableCell>Scheduled Out</TableCell>
                              <TableCell>Actual In</TableCell>
                              <TableCell>Actual Out</TableCell>
                              <TableCell>Working Hours</TableCell>
                              <TableCell>Overtime Hours</TableCell>
                              <TableCell>OD Hours</TableCell>
                              <TableCell>Remarks</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {selectedEmployee.attendance_data.daily_attendance.map((day, index) => (
                              <TableRow key={index}>
                                <TableCell>{day.date}</TableCell>
                                <TableCell>{day.day_type}</TableCell>
                                <TableCell>{day.status}</TableCell>
                                <TableCell>{day.scheduled_in}</TableCell>
                                <TableCell>{day.scheduled_out}</TableCell>
                                <TableCell>{day.actual_in || '-'}</TableCell>
                                <TableCell>{day.actual_out || '-'}</TableCell>
                                <TableCell>{day.working_hours}</TableCell>
                                <TableCell>{day.overtime_hours}</TableCell>
                                <TableCell>{day.is_od ? day.od_hours : '0.0'}</TableCell>
                                <TableCell>{day.remarks || '-'}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Box>
                  )}
                </DialogContent>
                <DialogActions>
                  <Button onClick={handleCloseDialog}>Close</Button>
                  <Button
                    onClick={handleDownloadEmployeeExcel}
                    variant="contained"
                    color="success"
                  >
                    Download Excel
                  </Button>
                </DialogActions>
              </Dialog>

              <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
              >
                <Alert
                  onClose={handleCloseSnackbar}
                  severity={snackbar.severity}
                  sx={{ width: '100%' }}
                >
                  {snackbar.message}
                </Alert>
              </Snackbar>
            </Container>
          </LocalizationProvider>
        </main>
      </div>
    </div>
  );
};

export default AttendanceReport;