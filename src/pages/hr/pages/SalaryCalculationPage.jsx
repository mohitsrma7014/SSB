import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, QueryClient, QueryClientProvider } from 'react-query';
import axios from 'axios';
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  LinearProgress,
  Snackbar,
  Alert
} from '@mui/material';
import { Download, Save, Search, Visibility, Close } from '@mui/icons-material';
import * as XLSX from 'xlsx';
import { Sidebar } from "../../Navigation/Sidebar";
import DashboardHeader from "../../Navigation/DashboardHeader";
// Create a new QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 300000, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

// Main component content
const SalaryCalculationPageContent = () => {
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [filter, setFilter] = useState({
    employeeId: '',
    employeeName: '',
    department: ''
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Fetch salary data
  const fetchSalaryData = async () => {
  const response = await axios.get('http://192.168.1.199:8002/api/salary-calculation/', {
    params: { month, year }
  });
  return response.data;
};


  const { data, isLoading, isError, error, refetch } = useQuery(
    ['salaryData', month, year],
    fetchSalaryData,
    {
      enabled: false
    }
  );

  // Save salary data mutation
 const saveSalaryData = async () => {
  const response = await axios.post('http://192.168.1.199:8002/api/salary-calculation/', {
    month,
    year,
    results: data?.results || []
  });
  return response.data;
};


  const { mutate: saveData, isLoading: isSaving } = useMutation(saveSalaryData, {
    onSuccess: () => {
      setSnackbar({
        open: true,
        message: 'Salary data saved successfully!',
        severity: 'success'
      });
    },
    onError: (error) => {
      setSnackbar({
        open: true,
        message: error.response?.data?.error || 'Failed to save salary data',
        severity: 'error'
      });
    }
  });

  // Filter employees
  const filteredEmployees = useMemo(() => {
    if (!data?.results) return [];
    return data.results.filter(emp => {
      return (
        emp.employee_id.toString().includes(filter.employeeId.toLowerCase()) &&
        emp.employee_name.toLowerCase().includes(filter.employeeName.toLowerCase()) &&
        emp.department.toLowerCase().includes(filter.department.toLowerCase())
      );
    });
  }, [data, filter]);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const toggleSidebar = () => {
    setIsSidebarVisible(!isSidebarVisible);
  };
  const pageTitle = "Generate Salary";

  // Generate Excel
  const generateExcel = (employee = null) => {
    const dataToExport = employee ? [employee] : filteredEmployees;
    
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Salary Data");
    
    const fileName = employee 
      ? `Salary_${employee.employee_id}_${month}_${year}.xlsx`
      : `Salaries_${month}_${year}.xlsx`;
    
    XLSX.writeFile(workbook, fileName);
  };

  const handleGenerate = () => {
    if (!month || !year) {
      setSnackbar({
        open: true,
        message: 'Please enter both month and year',
        severity: 'error'
      });
      return;
    }
    refetch();
  };

  const handleSave = () => {
    if (!data?.results?.length) {
      setSnackbar({
        open: true,
        message: 'No data to save. Please generate salary first.',
        severity: 'error'
      });
      return;
    }
    saveData();
  };

  const handleViewDetails = (employee) => {
    setSelectedEmployee(employee);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedEmployee(null);
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

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
    <Container maxWidth="full" sx={{ mt: 2, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Salary Calculation
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <TextField
            label="Month"
            type="number"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            inputProps={{ min: 1, max: 12 }}
            sx={{ width: 120 }}
          />
          
          <TextField
            label="Year"
            type="number"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            sx={{ width: 120 }}
          />
          
          <Button
            variant="contained"
            startIcon={<Search />}
            onClick={handleGenerate}
            disabled={isLoading}
          >
            Generate Salary
          </Button>
          
          {data?.results && (
            <Button
              variant="contained"
              color="success"
              startIcon={<Save />}
              onClick={handleSave}
              disabled={isSaving || data?.results?.some(r => r.is_saved)}
            >
              {isSaving ? 'Saving...' : 'Save for this Month'}
            </Button>
          )}
        </Box>
        
        {isLoading && <LinearProgress />}
        
        {isError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error.message}
          </Alert>
        )}
        
        {data?.results && (
          <>
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <TextField
                label="Filter by Employee ID"
                value={filter.employeeId}
                onChange={(e) => setFilter({...filter, employeeId: e.target.value})}
                size="small"
              />
              
              <TextField
                label="Filter by Name"
                value={filter.employeeName}
                onChange={(e) => setFilter({...filter, employeeName: e.target.value})}
                size="small"
              />
              
              <TextField
                label="Filter by Department"
                value={filter.department}
                onChange={(e) => setFilter({...filter, department: e.target.value})}
                size="small"
              />
              
              <Button
                variant="outlined"
                startIcon={<Download />}
                onClick={() => generateExcel()}
                sx={{ ml: 'auto' }}
              >
                Export All
              </Button>
            </Box>
            <Box sx={{ height: 'calc(100vh - 320px)', overflow: 'auto' }}>
            <TableContainer component={Paper} sx={{ maxHeight: 'calc(100vh - 320px)', overflow: 'auto' }}>
        <Table stickyHeader size="small">
    <TableHead>
      <TableRow>
        <TableCell>Employee ID</TableCell>
        <TableCell>Name</TableCell>
        <TableCell>Department</TableCell>
        <TableCell>Working Days</TableCell>
        <TableCell>Actual Salary</TableCell>
        <TableCell>Net Salary</TableCell>
        <TableCell>Actions</TableCell>
      </TableRow>
    </TableHead>
                <TableBody>
                  {filteredEmployees.map((employee) => (
                    <TableRow key={employee.employee_id}>
                      <TableCell>{employee.employee_id}</TableCell>
                      <TableCell>{employee.employee_name}</TableCell>
                      <TableCell>{employee.department}</TableCell>
                      <TableCell>{employee.total_working_days}</TableCell>
                      <TableCell>{employee.actual_salary.toFixed(2)}</TableCell>
                      <TableCell>{employee.net_salary.toFixed(2)}</TableCell>
                      <TableCell>
                        <Tooltip title="View Details">
                          <IconButton onClick={() => handleViewDetails(employee)}>
                            <Visibility color="primary" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Download Excel">
                          <IconButton onClick={() => generateExcel(employee)}>
                            <Download color="secondary" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            </Box>
            
            <Typography variant="body2" sx={{ mt: 2, textAlign: 'right' }}>
              Showing {filteredEmployees.length} of {data.results.length} employees
              {data.processing_time_seconds && ` (Processed in ${data.processing_time_seconds.toFixed(2)} seconds)`}
            </Typography>
          </>
        )}
      </Paper>
      
      {/* Employee Details Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Salary Details - {selectedEmployee?.employee_name}
          <IconButton
            aria-label="close"
            onClick={handleCloseDialog}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {selectedEmployee && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', gap: 4 }}>
                <Box>
                  <Typography variant="subtitle1">Basic Information</Typography>
                  <Typography>Employee ID: {selectedEmployee.employee_id}</Typography>
                  <Typography>Name: {selectedEmployee.employee_name}</Typography>
                  <Typography>Department: {selectedEmployee.department}</Typography>
                  <Typography>Type: {selectedEmployee.employee_type}</Typography>
                  
                </Box>
                
                <Box>
                  <Typography variant="subtitle1">Attendance Summary</Typography>
                  <Typography>Month: {selectedEmployee.month}/{selectedEmployee.year}</Typography>
                  <Typography>Total Days: {selectedEmployee.total_month_days}</Typography>
                  <Typography>Working Days: {selectedEmployee.total_working_days}</Typography>
                  <Typography>Present Days: {selectedEmployee.present_days}</Typography>
                  <Typography>Absent Days: {selectedEmployee.absent_days}</Typography>
                  <Typography>OD(Dayes/hours): {selectedEmployee.od_days}D {selectedEmployee.od_hours}H</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle1">Salary Summary</Typography>
                  <Typography>Salary: {selectedEmployee.actual_salary}</Typography>
                  <Typography>Fix Incentive: {selectedEmployee.Fix_Incentive}</Typography>
                  <Typography>Cl Use: {selectedEmployee.cl_used}</Typography>
                  <Typography> Over-time Payment: {selectedEmployee.overtime_payment}</Typography>
                  <Typography>OD Payment: {selectedEmployee.od_payment}</Typography>
                </Box>                               
              </Box>
              
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle1">Salary Breakdown</Typography>
                <Table size="small">
                  <TableBody>
                    {[
                      { label: "Gross Salary", value: selectedEmployee?.gross_salary },
                      { label: "Basic Salary", value: selectedEmployee?.basic_salary },
                      { label: "HRA", value: selectedEmployee?.hra },
                      { label: "Medical Allowance", value: selectedEmployee?.medical_allowance },
                      { label: "Conveyance Allowance", value: selectedEmployee?.conveyance_allowance },
                      { label: "Overtime Payment", value: selectedEmployee?.overtime_payment },
                      { label: "OD Payment", value: selectedEmployee?.od_payment },
                      { label: "PF Deduction", value: selectedEmployee?.pf, isDeduction: true },
                      { label: "ESIC Deduction", value: selectedEmployee?.esic, isDeduction: true },
                      { label: "Fix-Incentive", value: selectedEmployee?.total_fix_incentive },
                      { label: "Attendance Bonus", value: selectedEmployee?.attdence_bonous },
                      { label: "Total Salary", value: selectedEmployee?.total_salary, isBold: true },
                      { label: "Salary Advance/ Other Deduction", value: selectedEmployee?.salary_advance, isDeduction: true, isBold: true },
                      { label: "Net Salary", value: selectedEmployee?.net_salary, isBold: true },
                    ].map((row, index) => (
                      <TableRow key={index} sx={row.isBold ? { fontWeight: 'bold' } : {}}>
                        <TableCell>{row.label}</TableCell>
                        <TableCell align="right">
                          {row.value !== undefined && row.value !== null
                            ? `${row.isDeduction ? '-' : ''}${parseFloat(row.value).toFixed(2)}`
                            : 'NA'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>

            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => generateExcel(selectedEmployee)} startIcon={<Download />}>
            Download Excel
          </Button>
          <Button onClick={handleCloseDialog}>Close</Button>
        </DialogActions>
      </Dialog>
      
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
    </main>
    </div>
    </div>
  );
};

// Wrap the component with QueryClientProvider
const SalaryCalculationPage = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <SalaryCalculationPageContent />
    </QueryClientProvider>
  );
};

export default SalaryCalculationPage;