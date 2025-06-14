import React, { useState, useEffect } from 'react';
import { useSnackbar } from 'notistack';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  Grid,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
  Autocomplete
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  FileDownload as FileDownloadIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import dayjs from 'dayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { Sidebar } from "../Navigation/Sidebar";
import DashboardHeader from "../Navigation/DashboardHeader";

const SalaryAdvancePage = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [advances, setAdvances] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [openBulkDialog, setOpenBulkDialog] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [amount, setAmount] = useState('');
  const [dateIssued, setDateIssued] = useState(dayjs());
  const [reason, setReason] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [currentAdvanceId, setCurrentAdvanceId] = useState(null);
  const [bulkData, setBulkData] = useState([{ employee_id: '', amount: '', date_issued: dayjs(), reason: '' }]);
  const [exportLoading, setExportLoading] = useState(false);
const [isSidebarVisible, setIsSidebarVisible] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarVisible(!isSidebarVisible);
  };
  const pageTitle = "Advance and Dedction Management"; // Set the page title here
  // Fetch data
  useEffect(() => {
    fetchData();
    fetchEmployees();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://192.168.1.199:8002/api/salary-advances/');
      const data = await response.json();
      setAdvances(Array.isArray(data.results) ? data.results : []); // Access the results array
    } catch (error) {
      enqueueSnackbar('Failed to fetch salary advances', { variant: 'error' });
      setAdvances([]); // Set to empty array on error
    } finally {
      setLoading(false);
    }
  };

   const fetchEmployees = async () => {
    try {
      const response = await fetch('http://192.168.1.199:8002/api/employees1/');
      const data = await response.json();
      setEmployees(Array.isArray(data) ? data : []);
    } catch (error) {
      enqueueSnackbar('Failed to fetch employees', { variant: 'error' });
    }
  };

  const handleAddBulkRow = () => {
    setBulkData([...bulkData, { employee_id: '', amount: '', date_issued: dayjs(), reason: '' }]);
  };

  const handleRemoveBulkRow = (index) => {
    const newData = [...bulkData];
    newData.splice(index, 1);
    setBulkData(newData);
  };

  const handleBulkFieldChange = (index, field, value) => {
    const newData = [...bulkData];
    newData[index][field] = value;
    setBulkData(newData);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const method = editMode ? 'PUT' : 'POST';
    const url = editMode 
      ? `http://192.168.1.199:8002/api/salary-advances/${currentAdvanceId}/` 
      : 'http://192.168.1.199:8002/api/salary-advances/';

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employee_id: selectedEmployee?.id,
          amount,
          date_issued: dateIssued.format('YYYY-MM-DD'),
          reason
        }),
      });

      if (!response.ok) throw new Error('Operation failed');

      enqueueSnackbar(`Salary advance ${editMode ? 'updated' : 'created'} successfully`, { variant: 'success' });
      fetchData();
      resetForm();
      setOpenDialog(false);
    } catch (error) {
      enqueueSnackbar(error.message, { variant: 'error' });
    }
  };

  const handleBulkSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://192.168.1.199:8002/api/salary-advances/bulk_create/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bulkData.map(item => ({
          employee_id: item.employee_id,
          amount: item.amount,
          date_issued: item.date_issued.format('YYYY-MM-DD'),
          reason: item.reason
        }))),
      });

      if (!response.ok) throw new Error('Bulk operation failed');

      enqueueSnackbar('Bulk salary advances created successfully', { variant: 'success' });
      fetchData();
      setBulkData([{ employee_id: '', amount: '', date_issued: dayjs(), reason: '' }]);
      setOpenBulkDialog(false);
    } catch (error) {
      enqueueSnackbar(error.message, { variant: 'error' });
    }
  };

  const handleEdit = (advance) => {
    setSelectedEmployee(advance.employee.id);
    setAmount(advance.amount);
    setDateIssued(dayjs(advance.date_issued));
    setReason(advance.reason || '');
    setEditMode(true);
    setCurrentAdvanceId(advance.id);
    setOpenDialog(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this salary advance?')) return;

    try {
      const response = await fetch(`http://192.168.1.199:8002/api/salary-advances/${id}/`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Delete failed');

      enqueueSnackbar('Salary advance deleted successfully', { variant: 'success' });
      fetchData();
    } catch (error) {
      enqueueSnackbar(error.message, { variant: 'error' });
    }
  };

  const resetForm = () => {
    setSelectedEmployee('');
    setAmount('');
    setDateIssued(dayjs());
    setReason('');
    setEditMode(false);
    setCurrentAdvanceId(null);
  };

  const handleExport = async (format) => {
    setExportLoading(true);
    try {
      const response = await fetch(`http://192.168.1.199:8002/api/salary-advances/export/?format=${format}`);
      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `salary_advances_${dayjs().format('YYYY-MM-DD')}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();

      enqueueSnackbar(`Exported successfully as ${format.toUpperCase()}`, { variant: 'success' });
    } catch (error) {
      enqueueSnackbar(error.message, { variant: 'error' });
    } finally {
      setExportLoading(false);
    }
  };

  const filteredAdvances = advances.filter(advance => {
    const searchLower = searchTerm.toLowerCase();
    return (
      advance.employee.employee_name.toLowerCase().includes(searchLower) ||
      (advance.reason && advance.reason.toLowerCase().includes(searchLower)) ||
      advance.amount.toString().includes(searchTerm)
    );
  });

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
        <main className="flex flex-col mt-20  justify-center flex-grow ">
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Container maxWidth="xl">
        <Box sx={{ my: 0 }}>
        
          
          <Card elevation={3} sx={{ mb: 1 }}>
            <CardContent>
              <Grid container spacing={1} alignItems="center">
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    variant="outlined"
                    placeholder="Search advances..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={8} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={() => {
                      resetForm();
                      setOpenDialog(true);
                    }}
                  >
                    New Advance
                  </Button>
                  {/* <Button
                    variant="outlined"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={() => setOpenBulkDialog(true)}
                  >
                    Bulk Create
                  </Button>
                  <Button
                    variant="outlined"
                    color="secondary"
                    startIcon={<FileDownloadIcon />}
                    onClick={() => handleExport('csv')}
                    disabled={exportLoading}
                  >
                    CSV
                  </Button>
                  <Button
                    variant="outlined"
                    color="secondary"
                    startIcon={<FileDownloadIcon />}
                    onClick={() => handleExport('excel')}
                    disabled={exportLoading}
                  >
                    Excel
                  </Button> */}
                  <Button
                    variant="outlined"
                    startIcon={<RefreshIcon />}
                    onClick={fetchData}
                  >
                    Refresh
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          <Paper elevation={3}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableCell>Employee</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell>Date Issued</TableCell>
                    <TableCell>Reason</TableCell>
                    <TableCell>Created At</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : filteredAdvances.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        No salary advances found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAdvances
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((advance) => (
                        <TableRow key={advance.id} hover>
                          <TableCell>{advance.employee.employee_name}</TableCell>
                          <TableCell align="right">{advance.amount}</TableCell>
                          <TableCell>{dayjs(advance.date_issued).format('DD MMM YYYY')}</TableCell>
                          <TableCell>{advance.reason || '-'}</TableCell>
                          <TableCell>{dayjs(advance.created_at).format('DD MMM YYYY HH:mm')}</TableCell>
                          <TableCell align="center">
                            <Button
                              size="small"
                              startIcon={<EditIcon />}
                              onClick={() => handleEdit(advance)}
                              sx={{ mr: 1 }}
                            >
                              Edit
                            </Button>
                            <Button
                              size="small"
                              startIcon={<DeleteIcon />}
                              color="error"
                              onClick={() => handleDelete(advance.id)}
                            >
                              Delete
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[10, 25, 50, 100]}
              component="div"
              count={filteredAdvances.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={(_, newPage) => setPage(newPage)}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
            />
          </Paper>
        </Box>

        {/* Single Advance Dialog */}
        <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>{editMode ? 'Edit Salary Advance' : 'Create New Salary Advance'}</DialogTitle>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <Grid container spacing={3} sx={{ mt: 1 }}>
                <Grid item xs={12}>
                  <Autocomplete
                    options={employees}
                    getOptionLabel={(option) => `${option.employee_name} (${option.employee_id})`}
                    value={selectedEmployee}
                    onChange={(event, newValue) => setSelectedEmployee(newValue)}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Employee"
                        required
                      />
                    )}
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Amount"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <DatePicker
                    label="Date Issued"
                    value={dateIssued}
                    onChange={(newValue) => setDateIssued(newValue)}
                    renderInput={(params) => <TextField {...params} fullWidth required />}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Reason (Optional)"
                    multiline
                    rows={3}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                </Grid>
              </Grid>
            </form>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button onClick={handleSubmit} color="primary" variant="contained">
              {editMode ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Bulk Advance Dialog */}
        <Dialog open={openBulkDialog} onClose={() => setOpenBulkDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>Bulk Create Salary Advances</DialogTitle>
          <DialogContent>
            <form onSubmit={handleBulkSubmit}>
              {bulkData.map((row, index) => (
                <React.Fragment key={index}>
                  <Grid container spacing={3} sx={{ mt: 1, mb: 3, p: 2, border: '1px solid #eee', borderRadius: 1 }}>
                    <Grid item xs={12} md={5}>
                      <FormControl fullWidth>
                        <InputLabel id={`employee-label-${index}`}>Employee</InputLabel>
                        <Select
                          labelId={`employee-label-${index}`}
                          value={row.employee_id}
                          onChange={(e) => handleBulkFieldChange(index, 'employee_id', e.target.value)}
                          label="Employee"
                          required
                        >
                          {employees.map((employee) => (
                            <MenuItem key={employee.id} value={employee.id}>
                              {employee.employee_name} ({employee.employee_id})
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <TextField
                        fullWidth
                        label="Amount"
                        type="number"
                        value={row.amount}
                        onChange={(e) => handleBulkFieldChange(index, 'amount', e.target.value)}
                        required
                        InputProps={{
                          startAdornment: <InputAdornment position="start">$</InputAdornment>,
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <DatePicker
                        label="Date Issued"
                        value={row.date_issued}
                        onChange={(newValue) => handleBulkFieldChange(index, 'date_issued', newValue)}
                        renderInput={(params) => <TextField {...params} fullWidth required />}
                      />
                    </Grid>
                    <Grid item xs={12} md={1} sx={{ display: 'flex', alignItems: 'center' }}>
                      {index > 0 && (
                        <Button
                          color="error"
                          onClick={() => handleRemoveBulkRow(index)}
                          startIcon={<DeleteIcon />}
                        >
                          Remove
                        </Button>
                      )}
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Reason (Optional)"
                        multiline
                        rows={2}
                        value={row.reason}
                        onChange={(e) => handleBulkFieldChange(index, 'reason', e.target.value)}
                      />
                    </Grid>
                  </Grid>
                  {index < bulkData.length - 1 && <Divider sx={{ my: 2 }} />}
                </React.Fragment>
              ))}
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<AddIcon />}
                  onClick={handleAddBulkRow}
                >
                  Add Another
                </Button>
              </Box>
            </form>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenBulkDialog(false)}>Cancel</Button>
            <Button onClick={handleBulkSubmit} color="primary" variant="contained">
              Create All
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </LocalizationProvider>
    </main>

        
      </div>
    </div>
  );
};

export default SalaryAdvancePage;