// src/components/AttendanceDashboard.jsx
import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import axios from 'axios'
import { format, startOfMonth, endOfMonth, parseISO, getDay } from 'date-fns'
import * as XLSX from 'xlsx'
import {
  Box,
  Typography,
  Paper,
  Grid,
  CircularProgress,
  Alert,
  Button,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Snackbar,
  Card,
  CardContent,
  Container,
} from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import XlsxPopulate from 'xlsx-populate/browser/xlsx-populate'
import {
  Summarize as SummarizeIcon,
  CalendarMonth as CalendarMonthIcon,
  FilterAlt as FilterAltIcon,
  Refresh as RefreshIcon,
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material'
import SummaryCards from './SummaryCards'
import EmployeeDetailsModal from './EmployeeDetailsModal'
import { Sidebar } from "../../Navigation/Sidebar";
import DashboardHeader from "../../Navigation/DashboardHeader";

const currentDate = new Date()
const currentMonth = currentDate.getMonth() + 1
const currentYear = currentDate.getFullYear()

const fetchAttendanceData = async (month, year) => {
  const response = await axios.post(
    'http://192.168.1.199:8002/api/api/attendance/process/',
    { month, year }
  )
  return response.data
}

const saveAttendanceData = async ({ month, year }) => {
  const response = await axios.post(
    'http://192.168.1.199:8002/api/api/attendance/process/',
    { month, year, save: true }
  )
  return response.data
}

const AttendanceDashboard = () => {
  const [month, setMonth] = useState(currentMonth)
  const [year, setYear] = useState(currentYear)
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [shouldFetch, setShouldFetch] = useState(false)
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  })
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  
  const toggleSidebar = () => {
    setIsSidebarVisible(!isSidebarVisible);
  };
  const pageTitle = "Generate Attdence Monthly Report";

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['attendance', month, year],
    queryFn: () => fetchAttendanceData(month, year),
    enabled: shouldFetch,
    keepPreviousData: true,
    staleTime: 1000 * 60 * 5,
  })

  const saveMutation = useMutation({
    mutationFn: saveAttendanceData,
    onSuccess: () => {
      setSnackbar({
        open: true,
        message: 'Attendance data saved successfully!',
        severity: 'success',
      })
    },
    onError: (error) => {
      setSnackbar({
        open: true,
        message: `Failed to save attendance: ${error.message}`,
        severity: 'error',
      })
    },
  })

  const handleMonthChange = (event) => {
    setMonth(event.target.value)
  }

  const handleYearChange = (event) => {
    setYear(event.target.value)
  }

  const handleFetch = () => {
    setShouldFetch(true)
    refetch()
  }

  const handleRefresh = () => {
    refetch()
  }

  const handleSave = () => {
    if (!data) {
      setSnackbar({
        open: true,
        message: 'Please fetch data before saving',
        severity: 'warning',
      })
      return
    }
    saveMutation.mutate({ month, year })
  }

  const handleReset = () => {
    setShouldFetch(false)
  }

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false })
  }
  const handleExportToExcel = () => {
    if (!data) {
      setSnackbar({
        open: true,
        message: 'No data to export',
        severity: 'warning',
      });
      return;
    }

    const monthName = format(new Date(year, month - 1, 1), 'MMMM yyyy').toUpperCase();

    XlsxPopulate.fromBlankAsync().then(workbook => {
      const sheet = workbook.sheet(0);
      sheet.name("Attendance");

      let rowIndex = 1;

      // ===== Title Row =====
      const headerTitle = `COMPANY ATTENDANCE SHEET FOR THE MONTH OF ${monthName}`;
      sheet.cell(rowIndex, 1).value(headerTitle);
      sheet.range(rowIndex, 1, rowIndex, 40).merged(true).style({
        bold: true,
        horizontalAlignment: "center",
        fontSize: 14,
      });

      rowIndex++; // Go to header row 1 (merged date headers)

      // ===== Header Row 1 =====
      const staticHeaders = ['S.NO.', 'EMP ID', 'NAME', 'DEPARTMENT'];
      let colIndex = 1;

      staticHeaders.forEach(header => {
        sheet.cell(rowIndex, colIndex++).value(header).style({
          bold: true,
          horizontalAlignment: 'center'
        });
      });

      const dayColumnStartIndexes = [];

      for (let day = 1; day <= 31; day++) {
        const date = new Date(year, month - 1, day);
        if (date.getMonth() !== month - 1) continue;

        const dateLabel = `${day}-${format(date, 'MMM')}`;
        dayColumnStartIndexes.push(colIndex);

        sheet.range(rowIndex, colIndex, rowIndex, colIndex + 2).merged(true).value(dateLabel).style({
          bold: true,
          horizontalAlignment: 'center'
        });

        colIndex += 3;
      }

      sheet.cell(rowIndex, colIndex++).value('DAY TOTAL').style({ bold: true, horizontalAlignment: 'center' });
      sheet.cell(rowIndex, colIndex++).value('TOTAL OT').style({ bold: true, horizontalAlignment: 'center' });
      sheet.cell(rowIndex, colIndex++).value('TOTAL OD').style({ bold: true, horizontalAlignment: 'center' });

      // ===== Header Row 2 =====
      rowIndex++;
      colIndex = 1;

      staticHeaders.forEach(header => {
        sheet.cell(rowIndex, colIndex++).value(header).style({ bold: true, horizontalAlignment: 'center' });
      });

      for (let i = 0; i < dayColumnStartIndexes.length; i++) {
        ['ATT.', 'OT', 'OD'].forEach(sub => {
          sheet.cell(rowIndex, colIndex++).value(sub).style({ bold: true, horizontalAlignment: 'center' });
        });
      }

      ['DAY TOTAL', 'TOTAL OT', 'TOTAL OD'].forEach(label => {
        sheet.cell(rowIndex, colIndex++).value(label).style({ bold: true, horizontalAlignment: 'center' });
      });

      // ===== Data Rows =====
      rowIndex++;

      data.forEach((employee, idx) => {
        let colIndex = 1;
        let totalOdHours = 0;
        let totalOdDays = 0;

        sheet.cell(rowIndex, colIndex++).value(idx + 1);
        sheet.cell(rowIndex, colIndex++).value(employee.employee_id);
        sheet.cell(rowIndex, colIndex++).value(employee.employee_name);
        sheet.cell(rowIndex, colIndex++).value(employee.department);

        for (let day = 1; day <= 31; day++) {
          const date = new Date(year, month - 1, day);
          if (date.getMonth() !== month - 1) continue;

          const formattedDate = format(date, 'yyyy-MM-dd');
          const dailyData = employee.daily_attendance.find(d => d.date.startsWith(formattedDate));
          const isSunday = getDay(date) === 0;

          const attCell = sheet.cell(rowIndex, colIndex++);
          const otCell = sheet.cell(rowIndex, colIndex++);
          const odCell = sheet.cell(rowIndex, colIndex++);

          if (dailyData) {
            const status = dailyData.status === 'present' ? 'P' :
                          dailyData.status === 'absent' ? 'A' :
                          dailyData.status.toUpperCase().charAt(0);

            attCell.value(status);
                      const ot = dailyData.overtime_hours || 0;
            otCell.value(ot);
            if (parseFloat(ot) > 0) {
              otCell.style({ fill: 'ADD8E6' }); // Light blue for OT
            }


            const odHours = dailyData.od_hours || 0;
            const odDays = dailyData.od_days || 0;

            let odText = '';
            if (odHours > 0) odText += `${odHours}H`;
            if (odDays > 0) odText += (odText ? ' ' : '') + `${odDays}D`;

                      odCell.value(odText);
            if (dailyData.od_hours > 0 || dailyData.od_days > 0) {
              odCell.style({ fill: 'FFD966' }); // Light yellow for OD
            }


            totalOdHours += odHours;
            totalOdDays += odDays;

            attCell.style({
              horizontalAlignment: 'center',
              fill: status === 'P' ? '92D050' :
                    status === 'A' ? 'FF0000' : (isSunday ? 'FFFF00' : undefined),
            });
          }

          if (isSunday && !dailyData) {
            attCell.style({ fill: 'FFFF00' });
          }

          [attCell, otCell, odCell].forEach(cell => {
            cell.style({ horizontalAlignment: 'center' });
          });
        }

        sheet.cell(rowIndex, colIndex++).value(employee.total_present_days).style({ horizontalAlignment: 'center' ,fill: '92D050'});
        sheet.cell(rowIndex, colIndex++).value(employee.total_overtime_hours).style({ horizontalAlignment: 'center',fill: 'ADD8E6' });

        let totalOdText = '';
        if (totalOdHours > 0) totalOdText += `${totalOdHours}H`;
        if (totalOdDays > 0) totalOdText += (totalOdText ? ' ' : '') + `${totalOdDays}D`;

        sheet.cell(rowIndex, colIndex++).value(totalOdText || '').style({ horizontalAlignment: 'center',fill: 'FFD966' });

        rowIndex++;
      });

      // ===== Set Column Widths =====
      const totalCols = sheet.usedRange().endCell().columnNumber();
      for (let i = 1; i <= totalCols; i++) {
        if (i === 1 || i === 2) {
          // Make S.NO. and EMP ID columns narrower
          sheet.column(i).width(7);
        } else if (i >= 5 && i <= totalCols - 3) {
          // Daily ATT/OT/OD columns: make narrower
          sheet.column(i).width(6);
        } else {
          // Other static columns like NAME, etc.
          sheet.column(i).width(16);
        }
      }


      // ===== Freeze Header Rows & Static Columns =====
      sheet.freezePanes(4, 3); // Freeze top 2 rows and 4 left columns
      
      // ===== Export Excel File =====
      workbook.outputAsync().then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Attendance_${monthName.replace(' ', '_')}.xlsx`;
        a.click();
        window.URL.revokeObjectURL(url);
      });
    });
  };


  // Process data for summary cards
  const summaryData = data?.reduce(
    (acc, employee) => {
      acc.totalEmployees += 1
      acc.totalHolidays += employee.total_holiday_days
      acc.totalPresent += employee.total_present_days
      acc.totalAbsent += employee.total_absent_days
      return acc
    },
    {
      totalEmployees: 0,
      totalHolidays: 0,
      totalPresent: 0,
      totalAbsent: 0,
    }
  )

  // Columns for the data grid
  const columns = [
    { field: 'employee_id', headerName: 'ID', width: 80 },
    { field: 'employee_name', headerName: 'Name', width: 180 },
    { field: 'department', headerName: 'Department', width: 150 },
    {
      field: 'total_working_days',
      headerName: 'Working Days',
      width: 100,
      type: 'number',
    },
    {
      field: 'total_present_days',
      headerName: 'Present Days',
      width: 100,
      type: 'number',
    },
    {
      field: 'total_absent_days',
      headerName: 'Absent',
      width: 100,
      type: 'number',
    },
    {
      field: 'actions',
      headerName: 'Details',
      width: 120,
      renderCell: (params) => (
        <Button
          variant="outlined"
          size="small"
          onClick={() => handleViewDetails(params.row)}
        >
          View
        </Button>
      ),
    },
  ]

  const handleViewDetails = (employee) => {
    setSelectedEmployee(employee)
    setModalOpen(true)
  }

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
          <Box sx={{ p: 3 }}>
            {!shouldFetch ? (
              <Container maxWidth="sm">
                <Card sx={{ p: 4, textAlign: 'center', mt: 10 }}>
                  <CardContent>
                    <Typography variant="h5" gutterBottom>
                      Select Month and Year
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                      Please choose a month and year to view attendance records
                    </Typography>
                    
                    <Grid container spacing={2} justifyContent="center">
                      <Grid item xs={6}>
                        <FormControl fullWidth size="medium">
                          <InputLabel id="month-select-label">Month</InputLabel>
                          <Select
                            labelId="month-select-label"
                            id="month-select"
                            value={month}
                            label="Month"
                            onChange={handleMonthChange}
                          >
                            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                              <MenuItem key={m} value={m}>
                                {format(new Date(2000, m - 1, 1), 'MMMM')}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={6}>
                        <FormControl fullWidth size="medium">
                          <InputLabel id="year-select-label">Year</InputLabel>
                          <Select
                            labelId="year-select-label"
                            id="year-select"
                            value={year}
                            label="Year"
                            onChange={handleYearChange}
                          >
                            {Array.from({ length: 5 }, (_, i) => currentYear - 2 + i).map(
                              (y) => (
                                <MenuItem key={y} value={y}>
                                  {y}
                                </MenuItem>
                              )
                            )}
                          </Select>
                        </FormControl>
                      </Grid>
                    </Grid>
                    
                    <Button
                      variant="contained"
                      size="large"
                      startIcon={<FilterAltIcon />}
                      onClick={handleFetch}
                      sx={{ mt: 3 }}
                    >
                      Fetch Attendance
                    </Button>
                  </CardContent>
                </Card>
              </Container>
            ) : (
              <>
                {isLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <>
                    {isError ? (
                      <Alert severity="error" sx={{ mb: 3 }}>
                        Error loading attendance data: {error.message}
                      </Alert>
                    ) : (
                      <>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                          <Typography variant="h5" component="h2">
                            {format(startOfMonth(new Date(year, month - 1)), 'MMMM yyyy')} Attendance
                          </Typography>
                          <Box>
                            <Button
                              variant="outlined"
                              startIcon={<ArrowBackIcon />}
                              onClick={handleReset}
                              sx={{ mr: 2 }}
                            >
                              Change Month
                            </Button>
                            <Button
                              variant="contained"
                              color="primary"
                              startIcon={<SummarizeIcon />}
                              onClick={handleExportToExcel}
                              disabled={!data || isLoading}
                              sx={{ mr: 2 }}
                            >
                              Export to Excel
                            </Button>
                            <Button
                              variant="contained"
                              color="success"
                              startIcon={<SaveIcon />}
                              onClick={handleSave}
                              disabled={!data || isLoading || saveMutation.isLoading}
                            >
                              {saveMutation.isLoading ? 'Saving...' : 'Save Data'}
                            </Button>
                          </Box>
                        </Box>

                        <Paper sx={{ p: 2, mt: 3 }}>
                          <Typography variant="h6" gutterBottom>
                            Employee Attendance Summary
                          </Typography>
                          <EmployeeDetailsModal
                            open={modalOpen}
                            onClose={() => setModalOpen(false)}
                            employee={selectedEmployee}
                            month={month}
                            year={year}
                          />
                          <Box sx={{ height: 600, width: '100%' }}>
                            <DataGrid
                              rows={data}
                              columns={columns}
                              pageSize={10}
                              rowsPerPageOptions={[10, 25, 50]}
                              disableSelectionOnClick
                              loading={isLoading}
                              getRowId={(row) => row.employee_id}
                              sx={{
                                '& .MuiDataGrid-cell:focus': {
                                  outline: 'none',
                                },
                              }}
                            />
                          </Box>
                        </Paper>
                      </>
                    )}
                  </>
                )}
              </>
            )}

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
          </Box>
        </main>
      </div>
    </div>
  )
}

export default AttendanceDashboard