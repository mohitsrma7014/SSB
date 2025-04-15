import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import { CancelToken } from 'axios';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Snackbar,
  Alert,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  InputAdornment,
  TablePagination
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  History as HistoryIcon,
  Upload as UploadIcon,
  Description as DescriptionIcon,
  Visibility as VisibilityIcon,
  CheckCircle as CheckCircleIcon,
  Close as CloseIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import MenuItem from '@mui/material/MenuItem';
import { Sidebar } from "../Navigation/Sidebar";
import DashboardHeader from "../Navigation/DashboardHeader";

const BASE_URL = 'http://192.168.1.199:8001/raw_material';

const StyledCard = styled(Card)(({ theme }) => ({
  transition: 'transform 0.3s, box-shadow 0.3s',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: theme.shadows[8]
  }
}));

// Initial state constants
const initialFormState = {
  component: '',
  part_name: '',
  customer: '',
  drawing_number: '',
  material_grade: '',
  slug_weight: '',
  bar_dia: '',
  process: '',
  ring_weight: '',
  cost: '',
  component_cycle_time: '',
  op_10_time: '',
  op_10_target: '',
  op_20_time: '',
  op_20_target: '',
  cnc_target_remark: ''
};

const initialDocumentFormState = {
  document_type: '',
  document: null,
  remarks: ''
};

const initialSnackbarState = {
  open: false,
  message: '',
  severity: 'success'
};



const MasterlistPage = () => {
  // State management
  const [masterlists, setMasterlists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMasterlist, setSelectedMasterlist] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openUploadDialog, setOpenUploadDialog] = useState(false);
  const [openHistoryDialog, setOpenHistoryDialog] = useState(false);
  const [currentTab, setCurrentTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState(initialFormState);
  const [documentForm, setDocumentForm] = useState(initialDocumentFormState);
  const [snackbar, setSnackbar] = useState(initialSnackbarState);
  const [history, setHistory] = useState([]);
  const [documentHistory, setDocumentHistory] = useState([]);
  const [pagination, setPagination] = useState({
    page: 0,
    rowsPerPage: 20,
    totalCount: 0
  });
  const [filters, setFilters] = useState({
    customer: '',
    material_grade: '',
    process: ''
  });
  const [filterOptions, setFilterOptions] = useState({
    customers: [],
    materials: [],
    processes: []
  });
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarVisible(!isSidebarVisible);
  };
  const pageTitle = "Component Master List"; // Set the page title here

  // Memoized filtered data
  const filteredMasterlists = useMemo(() => {
    if (!searchTerm) return masterlists;
    
    const term = searchTerm.toLowerCase();
    return masterlists.filter(masterlist =>
      masterlist.component.toLowerCase().includes(term) ||
      masterlist.part_name.toLowerCase().includes(term) ||
      masterlist.drawing_number.toLowerCase().includes(term)
    );
  }, [masterlists, searchTerm]);

  // Paginated data
  const paginatedMasterlists = useMemo(() => {
    const start = pagination.page * pagination.rowsPerPage;
    return filteredMasterlists.slice(start, start + pagination.rowsPerPage);
  }, [filteredMasterlists, pagination.page, pagination.rowsPerPage]);

  // Debounced search
  useEffect(() => {
    const handler = setTimeout(() => {
      setPagination(prev => ({ ...prev, page: 0 }));
    }, 300);

    return () => clearTimeout(handler);
  }, [searchTerm]);

 // Modify your fetchMasterlists function to include filters
 const fetchMasterlists = useCallback(async (cancelToken) => {
  try {
    setLoading(true);
    const params = {
      limit: pagination.rowsPerPage,
      offset: pagination.page * pagination.rowsPerPage,
      search: searchTerm,
      ...filters
    };
    
    const response = await axios.get(`${BASE_URL}/masterlistn/`, {
      cancelToken,
      params
    });
    
    setMasterlists(response.data.results || []); // Use results for paginated responses
    setPagination(prev => ({
      ...prev,
      totalCount: response.data.count || 0 // Use count for total items from server
    }));
    
    setLoading(false);
  } catch (err) {
    if (axios.isCancel(err)) return;
    setError(err.message);
    setLoading(false);
    showSnackbar('Failed to fetch masterlist', 'error');
  }
}, [pagination.page, pagination.rowsPerPage, searchTerm, filters]);

// Add a function to handle filter changes
const handleFilterChange = useCallback((name, value) => {
  setFilters(prev => ({ ...prev, [name]: value }));
  setPagination(prev => ({ ...prev, page: 0 })); // Reset to first page when filters change
}, []);

// Add a function to reset all filters
const resetFilters = useCallback(() => {
  setFilters({
    component:'',
    customer: '',
    material_grade: '',
    process: ''
  });
  setSearchTerm('');
}, []);


  // Initial data fetch
  useEffect(() => {
    const source = CancelToken.source();
    fetchMasterlists(source.token);

    return () => source.cancel('Component unmounted, request canceled');
  }, [fetchMasterlists]);

  // Optimized handlers
  const handleOpenDialog = useCallback((masterlist = null) => {
    setSelectedMasterlist(masterlist);
    setFormData(masterlist ? { ...masterlist } : initialFormState);
    setOpenDialog(true);
  }, []);

  const handleCloseDialog = useCallback(() => {
    setOpenDialog(false);
    setSelectedMasterlist(null);
  }, []);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleSubmit = useCallback(async () => {
    try {
      if (selectedMasterlist) {
        await axios.put(`${BASE_URL}/masterlistn/${selectedMasterlist.id}/`, formData);
        showSnackbar('Component updated successfully', 'success');
      } else {
        await axios.post(`${BASE_URL}/masterlistn/`, formData);
        showSnackbar('Component added successfully', 'success');
      }
      fetchMasterlists();
      handleCloseDialog();
    } catch (err) {
      showSnackbar(err.response?.data || 'Error saving component', 'error');
    }
  }, [formData, selectedMasterlist, fetchMasterlists, handleCloseDialog]);

  const handleDelete = useCallback(async (id) => {
    try {
      await axios.delete(`${BASE_URL}/masterlistn/${id}/`);
      showSnackbar('Component deleted successfully', 'success');
      fetchMasterlists();
    } catch (err) {
      showSnackbar('Error deleting component', 'error');
    }
  }, [fetchMasterlists]);

  const handleOpenUploadDialog = useCallback((masterlist) => {
    setSelectedMasterlist(masterlist);
    setDocumentForm(initialDocumentFormState);
    setOpenUploadDialog(true);
  }, []);

  const handleCloseUploadDialog = useCallback(() => {
    setOpenUploadDialog(false);
  }, []);

  const handleDocumentChange = useCallback((e) => {
    const { name, value } = e.target;
    setDocumentForm(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleFileChange = useCallback((e) => {
    setDocumentForm(prev => ({ ...prev, document: e.target.files[0] }));
  }, []);

  const handleDocumentUpload = useCallback(async () => {
    try {
      const formData = new FormData();
      formData.append('document_type', documentForm.document_type);
      formData.append('document', documentForm.document);
      formData.append('remarks', documentForm.remarks);

      await axios.post(
        `${BASE_URL}/masterlistn/${selectedMasterlist.id}/documents/upload/`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      showSnackbar('Document uploaded successfully', 'success');
      fetchMasterlists();
      handleCloseUploadDialog();
    } catch (err) {
      showSnackbar('Error uploading document', 'error');
    }
  }, [documentForm, selectedMasterlist, fetchMasterlists, handleCloseUploadDialog]);

  const handleViewHistory = useCallback(async (masterlist) => {
    setSelectedMasterlist(masterlist);
    try {
      const response = await axios.get(`${BASE_URL}/masterlistn/${masterlist.id}/history/`);
      setHistory(response.data);
      setOpenHistoryDialog(true);
    } catch (err) {
      showSnackbar('Error fetching history', 'error');
    }
  }, []);

  const handleViewDocumentHistory = useCallback(async (masterlist, docType) => {
    setSelectedMasterlist(masterlist);
    try {
      const response = await axios.get(`${BASE_URL}/masterlistn/${masterlist.id}/documents/${docType}/`);
      setDocumentHistory(response.data);
      setCurrentTab(2);
    } catch (err) {
      showSnackbar('Error fetching document history', 'error');
    }
  }, []);

  const handleSetCurrentDocument = useCallback(async (docId) => {
    try {
      await axios.post(
        `${BASE_URL}/masterlistn/${selectedMasterlist.id}/documents/${docId}/set-current/`
      );
      showSnackbar('Document set as current version', 'success');
      fetchMasterlists();
      setCurrentTab(1);
    } catch (err) {
      showSnackbar('Error setting current document', 'error');
    }
  }, [selectedMasterlist, fetchMasterlists]);

  const showSnackbar = useCallback((message, severity) => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const handleCloseSnackbar = useCallback(() => {
    setSnackbar(prev => ({ ...prev, open: false }));
  }, []);

  const formatDate = useCallback((dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  }, []);

  // Pagination handlers
  const handleChangePage = useCallback((_, newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  }, []);

  const handleChangeRowsPerPage = useCallback((event) => {
    setPagination(prev => ({
      ...prev,
      rowsPerPage: parseInt(event.target.value, 10),
      page: 0
    }));
  }, []);

  // Memoized MasterlistCard component
  const MasterlistCard = useCallback(({ masterlist }) => (
    <StyledCard>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Typography variant="h6" component="div">
            {masterlist.component}
          </Typography>
          <Chip label={masterlist.customer} size="small" color="primary" variant="outlined" />
        </Stack>
        <Typography variant="subtitle1" color="text.secondary">
          {masterlist.part_name}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Drawing: {masterlist.drawing_number}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Material: {masterlist.material_grade}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Bar Dia(MM): {masterlist.bar_dia} MM
        </Typography>
        <Stack direction="row" spacing={1} justifyContent="flex-end">
          <Tooltip title="View Details">
            <IconButton
              size="small"
              onClick={() => {
                setSelectedMasterlist(masterlist);
                setCurrentTab(1);
              }}
            >
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Upload Document">
            <IconButton
              size="small"
              onClick={() => handleOpenUploadDialog(masterlist)}
            >
              <UploadIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit">
            <IconButton
              size="small"
              onClick={() => handleOpenDialog(masterlist)}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {/* <Tooltip title="Delete">
            <IconButton
              size="small"
              onClick={() => handleDelete(masterlist.id)}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip> */}
          <Tooltip title="View History">
            <IconButton
              size="small"
              onClick={() => handleViewHistory(masterlist)}
            >
              <HistoryIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      </CardContent>
    </StyledCard>
  ), [handleOpenDialog, handleDelete, handleOpenUploadDialog, handleViewHistory]);

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
    <Box sx={{ p: 1 }}>

      <Paper sx={{ p: 1, mb: 1}}>
  <Grid container spacing={2} alignItems="center">
    <Grid item xs={12} md={2.5}>
      <TextField
        fullWidth
        label="Component"
        onChange={(e) => handleFilterChange('component', e.target.value)}
        variant="outlined"
        size="small"
      />
    </Grid>
    <Grid item xs={12} md={2.5}>
      <TextField
        fullWidth
        
        label="Customer"
        value={filters.customer}
        onChange={(e) => handleFilterChange('customer', e.target.value)}
        variant="outlined"
        size="small"
      >
        <MenuItem value="">All Customers</MenuItem>
        {filterOptions.customers.map((customer) => (
          <MenuItem key={customer} value={customer}>
            {customer}
          </MenuItem>
        ))}
      </TextField>
    </Grid>
    <Grid item xs={12} md={2.5}>
      <TextField
        fullWidth
        
        label="Material Grade"
        value={filters.material_grade}
        onChange={(e) => handleFilterChange('material_grade', e.target.value)}
        variant="outlined"
        size="small"
      >
        <MenuItem value="">All Materials</MenuItem>
        {filterOptions.materials.map((material) => (
          <MenuItem key={material} value={material}>
            {material}
          </MenuItem>
        ))}
      </TextField>
    </Grid>
    
    <Grid item xs={12} md={2}>
      <Button
        fullWidth
        variant="outlined"
        onClick={resetFilters}
        startIcon={<RefreshIcon />}
      >
        Reset
      </Button>
    </Grid>
    <Grid item>
    <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add New Component
        </Button>
        </Grid>
  </Grid>
</Paper>


      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : (
        <>
          <Tabs
            value={currentTab}
            onChange={(_, newValue) => setCurrentTab(newValue)}
            sx={{ mb: 3 }}
          >
            <Tab label="Components" />
            <Tab label="Details" disabled={!selectedMasterlist} />
            <Tab label="Document History" disabled={!selectedMasterlist} />
          </Tabs>

          {currentTab === 0 && (
  <>
    <Grid container spacing={3}>
      {masterlists.map((masterlist) => ( // Use masterlists directly
        <Grid item xs={12} sm={6} md={4} key={masterlist.id}>
          <MasterlistCard masterlist={masterlist} />
        </Grid>
      ))}
    </Grid>
    <TablePagination
      component="div"
      count={pagination.totalCount} // Use totalCount from server
      page={pagination.page}
      onPageChange={handleChangePage}
      rowsPerPage={pagination.rowsPerPage}
      onRowsPerPageChange={handleChangeRowsPerPage}
      rowsPerPageOptions={[10, 20, 50]}
    />
  </>
)}
          {currentTab === 1 && selectedMasterlist && (
            <Paper sx={{ p: 3 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h5">
                  {selectedMasterlist.component} - {selectedMasterlist.part_name}
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<EditIcon />}
                  onClick={() => handleOpenDialog(selectedMasterlist)}
                >
                  Edit
                </Button>
              </Stack>

              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Basic Information
                  </Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableBody>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 'bold' }}>Customer</TableCell>
                          <TableCell>{selectedMasterlist.customer}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 'bold' }}>Drawing Number</TableCell>
                          <TableCell>{selectedMasterlist.drawing_number}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 'bold' }}>Material Grade</TableCell>
                          <TableCell>{selectedMasterlist.material_grade}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Specifications
                  </Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableBody>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 'bold' }}>Slug Weight</TableCell>
                          <TableCell>{selectedMasterlist.slug_weight}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 'bold' }}>Bar Diameter</TableCell>
                          <TableCell>{selectedMasterlist.bar_dia}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 'bold' }}>Process</TableCell>
                          <TableCell>{selectedMasterlist.process}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 'bold' }}>Ring Weight</TableCell>
                          <TableCell>{selectedMasterlist.ring_weight}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Production Details
                  </Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableBody>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 'bold' }}>Cost</TableCell>
                          <TableCell>{selectedMasterlist.cost}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 'bold' }}>Component Cycle Time</TableCell>
                          <TableCell>{selectedMasterlist.component_cycle_time}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 'bold' }}>OP 10 Time</TableCell>
                          <TableCell>{selectedMasterlist.op_10_time}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 'bold' }}>OP 10 Target</TableCell>
                          <TableCell>{selectedMasterlist.op_10_target}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 'bold' }}>OP 20 Time</TableCell>
                          <TableCell>{selectedMasterlist.op_20_time}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 'bold' }}>OP 20 Target</TableCell>
                          <TableCell>{selectedMasterlist.op_20_target}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 'bold' }}>CNC Target Remark</TableCell>
                          <TableCell>{selectedMasterlist.cnc_target_remark}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>

                <Grid item xs={12}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6">Documents</Typography>
                    <Button
                      variant="contained"
                      startIcon={<UploadIcon />}
                      onClick={() => handleOpenUploadDialog(selectedMasterlist)}
                    >
                      Upload Document
                    </Button>
                  </Stack>

                  {selectedMasterlist.documents && selectedMasterlist.documents.length > 0 ? (
                    <TableContainer component={Paper} variant="outlined">
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Type</TableCell>
                            <TableCell>Version</TableCell>
                            <TableCell>Uploaded At</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {selectedMasterlist.documents.map((doc) => (
                            <TableRow key={doc.id}>
                              <TableCell>{doc.document_type}</TableCell>
                              <TableCell>v{doc.version}</TableCell>
                              <TableCell>{formatDate(doc.uploaded_at)}</TableCell>
                              <TableCell>
                                {doc.is_current ? (
                                  <Chip label="Current" color="success" size="small" />
                                ) : (
                                  <Chip label="Old" color="default" size="small" variant="outlined" />
                                )}
                              </TableCell>
                              <TableCell>
                                <Stack direction="row" spacing={1}>
                                  <Tooltip title="View">
                                    <IconButton
                                      size="small"
                                      href={doc.document_url}
                                      target="_blank"
                                    >
                                      <DescriptionIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="History">
                                    <IconButton
                                      size="small"
                                      onClick={() => handleViewDocumentHistory(selectedMasterlist, doc.document_type)}
                                    >
                                      <HistoryIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                  {!doc.is_current && (
                                    <Tooltip title="Set as Current">
                                      <IconButton
                                        size="small"
                                        onClick={() => handleSetCurrentDocument(doc.id)}
                                      >
                                        <CheckCircleIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                  )}
                                </Stack>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Paper variant="outlined" sx={{ p: 3, textAlign: 'center' }}>
                      <Typography color="text.secondary">No documents uploaded yet</Typography>
                    </Paper>
                  )}
                </Grid>
              </Grid>
            </Paper>
          )}

          {currentTab === 2 && selectedMasterlist && documentHistory.length > 0 && (
            <Paper sx={{ p: 3 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h5">
                  Document History: {documentHistory[0].document_type}
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={() => setCurrentTab(1)}
                >
                  Back to Details
                </Button>
              </Stack>

              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Version</TableCell>
                      <TableCell>Uploaded At</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Remarks</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {documentHistory.map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell>v{doc.version}</TableCell>
                        <TableCell>{formatDate(doc.uploaded_at)}</TableCell>
                        <TableCell>
                          {doc.is_current ? (
                            <Chip label="Current" color="success" size="small" />
                          ) : (
                            <Chip label="Old" color="default" size="small" variant="outlined" />
                          )}
                        </TableCell>
                        <TableCell>{doc.remarks}</TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={1}>
                            <Tooltip title="View">
                              <IconButton
                                size="small"
                                href={doc.document_url}
                                target="_blank"
                              >
                                <DescriptionIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            {!doc.is_current && (
                              <Tooltip title="Set as Current">
                                <IconButton
                                  size="small"
                                  onClick={() => handleSetCurrentDocument(doc.id)}
                                >
                                  <CheckCircleIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}
        </>
      )}

      {/* Add/Edit Component Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedMasterlist ? 'Edit Component' : 'Add New Component'}
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Component Name"
                name="component"
                value={formData.component}
                onChange={handleInputChange}
                margin="normal"
                required
              />
              <TextField
                fullWidth
                label="Part Name"
                name="part_name"
                value={formData.part_name}
                onChange={handleInputChange}
                margin="normal"
              />
              <TextField
                fullWidth
                label="Customer"
                name="customer"
                value={formData.customer}
                onChange={handleInputChange}
                margin="normal"
              />
              <TextField
                fullWidth
                label="Drawing Number"
                name="drawing_number"
                value={formData.drawing_number}
                onChange={handleInputChange}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Material Grade"
                name="material_grade"
                value={formData.material_grade}
                onChange={handleInputChange}
                margin="normal"
              />
              <TextField
                fullWidth
                label="Slug Weight"
                name="slug_weight"
                value={formData.slug_weight}
                onChange={handleInputChange}
                margin="normal"
              />
              <TextField
                fullWidth
                label="Bar Diameter"
                name="bar_dia"
                value={formData.bar_dia}
                onChange={handleInputChange}
                margin="normal"
              />
              <TextField
                fullWidth
                label="Process"
                name="process"
                value={formData.process}
                onChange={handleInputChange}
                margin="normal"
              />
              <TextField
                fullWidth
                label="Ring Weight"
                name="ring_weight"
                value={formData.ring_weight}
                onChange={handleInputChange}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Cost"
                name="cost"
                value={formData.cost}
                onChange={handleInputChange}
                margin="normal"
              />
              <TextField
                fullWidth
                label="Component Cycle Time"
                name="component_cycle_time"
                value={formData.component_cycle_time}
                onChange={handleInputChange}
                margin="normal"
              />
              <TextField
                fullWidth
                label="OP 10 Time"
                name="op_10_time"
                value={formData.op_10_time}
                onChange={handleInputChange}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="OP 10 Target"
                name="op_10_target"
                value={formData.op_10_target}
                onChange={handleInputChange}
                margin="normal"
              />
              <TextField
                fullWidth
                label="OP 20 Time"
                name="op_20_time"
                value={formData.op_20_time}
                onChange={handleInputChange}
                margin="normal"
              />
              <TextField
                fullWidth
                label="OP 20 Target"
                name="op_20_target"
                value={formData.op_20_target}
                onChange={handleInputChange}
                margin="normal"
              />
              <TextField
                fullWidth
                label="CNC Target Remark"
                name="cnc_target_remark"
                value={formData.cnc_target_remark}
                onChange={handleInputChange}
                margin="normal"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {selectedMasterlist ? 'Update' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Upload Document Dialog */}
      <Dialog open={openUploadDialog} onClose={handleCloseUploadDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Upload Document for {selectedMasterlist?.component}</DialogTitle>
        <DialogContent dividers>
          <TextField
            fullWidth
            select
            label="Document Type"
            name="document_type"
            value={documentForm.document_type}
            onChange={handleDocumentChange}
            margin="normal"
            SelectProps={{
              native: true
            }}
            required
          >
            <option value=""></option>
            <option value="Drawing">Drawing</option>
            <option value="Specification">Specification</option>
            <option value="Procedure">Procedure</option>
            <option value="Report">Report</option>
            <option value="Other">Other</option>
          </TextField>
          <Box sx={{ mt: 2, mb: 2 }}>
            <input
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
              style={{ display: 'none' }}
              id="document-upload"
              type="file"
              onChange={handleFileChange}
            />
            <label htmlFor="document-upload">
              <Button variant="outlined" component="span" startIcon={<UploadIcon />}>
                Select File
              </Button>
            </label>
            {documentForm.document && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                Selected: {documentForm.document.name}
              </Typography>
            )}
          </Box>
          <TextField
            fullWidth
            label="Remarks"
            name="remarks"
            value={documentForm.remarks}
            onChange={handleDocumentChange}
            margin="normal"
            multiline
            rows={3}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseUploadDialog}>Cancel</Button>
          <Button
            onClick={handleDocumentUpload}
            variant="contained"
            color="primary"
            disabled={!documentForm.document_type || !documentForm.document}
          >
            Upload
          </Button>
        </DialogActions>
      </Dialog>

      {/* History Dialog */}
      <Dialog
        open={openHistoryDialog}
        onClose={() => setOpenHistoryDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Change History for {selectedMasterlist?.component}
        </DialogTitle>
        <DialogContent dividers>
          <List>
            {history.map((record, index) => (
              <React.Fragment key={index}>
                <ListItem alignItems="flex-start">
                  <ListItemAvatar>
                    <Avatar>
                      {record.history_user ? record.history_user.charAt(0).toUpperCase() : 'S'}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={`Version ${record.version} - ${formatDate(record.history_date)}`}
                    secondary={
                      <>
                        <Typography component="span" variant="body2" color="text.primary">
                          {record.history_user || 'System'}
                        </Typography>
                        {record.changes.length > 0 ? (
                          <Table size="small" sx={{ mt: 1 }}>
                            <TableHead>
                              <TableRow>
                                <TableCell>Field</TableCell>
                                <TableCell>Old Value</TableCell>
                                <TableCell>New Value</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {record.changes.map((change, idx) => (
                                <TableRow key={idx}>
                                  <TableCell>{change.field}</TableCell>
                                  <TableCell>{change.old || '-'}</TableCell>
                                  <TableCell>{change.new || '-'}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        ) : (
                          ' - Initial version'
                        )}
                      </>
                    }
                  />
                </ListItem>
                {index < history.length - 1 && <Divider variant="inset" component="li" />}
              </React.Fragment>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenHistoryDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
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
  );
};

export default React.memo(MasterlistPage);