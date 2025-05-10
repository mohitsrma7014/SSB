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
  TablePagination,
  FormControl ,
  InputLabel,
  Select
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
import MissingDocumentsAlert from './MissingDocumentsAlert';
import { useNavigate } from 'react-router-dom';
const BASE_URL = 'http://192.168.1.199:8001/raw_material';

const StyledCard = styled(Card)(({ theme }) => ({
  transition: 'transform 0.3s, box-shadow 0.3s',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: theme.shadows[8]
  }
}));

// Expected document types
const EXPECTED_DOCUMENT_TYPES = [
  'Design Records',
  'Authorized Engineering Change Documents',
  'Customer Engineering Approval',
  'Design Failure Modes and Effects Analysis (DFMEA)',
  'Process Flow Diagram',
  'Process Failure Modes and Effects Analysis (PFMEA)',
  'Control Plan',
  'Measurement Systems Analysis (MSA)',
  'Dimensional Results',
  'Records of Material & Performance Test Results',
  'Initial Process Studies',
  'Qualified Laboratory Documentation',
  'Appearance Approval Report (AAR)',
  'Sample Production Parts',
  'Master Sample',
  'Checking Aids',
  'Customer-Specific Requirements',
  'Part Submission Warrant (PSW)',
];

// Initial state constants
const initialFormState = {
  component: '',
  part_name: '',
  customer: '',
  drawing_number: '',
  material_grade: '',
  slug_weight: '',
  bar_dia: '',
  ht_process: '',
  ring_weight: '',
  cost: '',
  component_cycle_time: '',
  op_10_time: '',
  op_10_target: '',
  op_20_time: '',
  op_20_target: '',
  cnc_target_remark: '',
  location: '',
  drawing_rev_number: '',
  drawing_rev_date: '',
  forging_line: '',
  hardness_required: '',
  running_status: '',
  packing_condition: '',
  verified_by: '' // Add this line
};

const initialDocumentFormState = {
  document_type: '',
  document: null,
  remarks: '',
  verified_by: ''
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
    running_status: 'Running',
  });
  const [filterOptions, setFilterOptions] = useState({
    customers: [],
    materials: [],
    running_status: [],
  });
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarVisible(!isSidebarVisible);
  };
  const pageTitle = "Component Master List";
  const [suggestions, setSuggestions] = useState({ 
      grade: [],
      
    });

    useEffect(() => {
      const fetchUserData = async () => {
        try {
          const response = await axios.get('http://192.168.1.199:8001/api/user-details/', {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
            },
          });
          const { name, lastname } = response.data;
          const fullName = `${name} ${lastname}`;
          setFormData((prevFormData) => ({ ...prevFormData, verified_by: fullName }));
        } catch (err) {
          console.error('Error fetching user details:', err);
          alert('Failed to fetch user details. Please check your credentials and try again.');
        }
      };
  
      fetchUserData();
    }, []);
  

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
      
      setMasterlists(response.data.results || []);
      setPagination(prev => ({
        ...prev,
        totalCount: response.data.count || 0
      }));
      
      setLoading(false);
    } catch (err) {
      if (axios.isCancel(err)) return;
      setError(err.message);
      setLoading(false);
      showSnackbar('Failed to fetch masterlist', 'error');
    }
  }, [pagination.page, pagination.rowsPerPage, searchTerm, filters]);

  const handleFilterChange = useCallback((name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
    setPagination(prev => ({ ...prev, page: 0 }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      component:'',
      customer: '',
      material_grade: '',
      ht_process: '',
      running_status:''
    });
    setSearchTerm('');
  }, []);

  useEffect(() => {
    const source = CancelToken.source();
    fetchMasterlists(source.token);

    return () => source.cancel('Component unmounted, request canceled');
  }, [fetchMasterlists]);

  const handleOpenDialog = useCallback((masterlist = null) => {
    const fetchUserData = async () => {
      try {
        const response = await axios.get('http://192.168.1.199:8001/api/user-details/', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
        });
        const { name, lastname } = response.data;
        const fullName = `${name} ${lastname}`;
        
        setFormData(masterlist ? { 
          ...masterlist,
          verified_by: fullName // Always update with current user
        } : { 
          ...initialFormState,
          verified_by: fullName 
        });
        
        setSelectedMasterlist(masterlist);
        setOpenDialog(true);
      } catch (err) {
        console.error('Error fetching user details:', err);
        // Fallback to existing verified_by or "Unknown"
        setFormData(masterlist ? { 
          ...masterlist,
          verified_by: masterlist.verified_by || "Unknown"
        } : { 
          ...initialFormState,
          verified_by: "Unknown" 
        });
        setSelectedMasterlist(masterlist);
        setOpenDialog(true);
      }
    };
  
    fetchUserData();
  }, []);

  const handleCloseDialog = useCallback(() => {
    setOpenDialog(false);
    setSelectedMasterlist(null);
  }, []);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  
    // Only fetch suggestions for material_grade when more than 1 character is typed
    if (name === 'material_grade' && value.length > 1) {
      const fetchSuggestions = async () => {
        try {
          const response = await axios.get(`${BASE_URL}/grades_suggestions/`, {
            params: { q: value },
          });
          setSuggestions(prev => ({ ...prev, grade: response.data }));
        } catch (error) {
          console.error('Failed to fetch material grade suggestions:', error);
        }
      };
      fetchSuggestions();
    } else {
      setSuggestions(prev => ({ ...prev, grade: [] }));
    }
  }, []);

  const navigate = useNavigate();

  const handleRedirect = () => {
    navigate('/MasterlistForm'); // Change this to your actual route
  };

  const handleSuggestionClick = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setSuggestions(prev => ({ ...prev, [field]: [] }));
  };
  
  const handleBlur = (field) => {
    const suggestionFields = [ 'grade'];
    if (suggestionFields.includes(field)) {
      if (!suggestions[field]?.includes(formData[field])) {
        setFormData(prev => ({ ...prev, [field]: '' }));
      }
    }
  };
  
    
 

  const handleSubmit = useCallback(async () => {
    try {
      const formDataWithVerification = {
        ...formData,
        verified_by: formData.verified_by || "Unknown" // Fallback in case it's empty
      };
  
      if (selectedMasterlist) {
        await axios.put(`${BASE_URL}/masterlistn/${selectedMasterlist.id}/`, formDataWithVerification);
        showSnackbar('Component updated successfully', 'success');
      } else {
        await axios.post(`${BASE_URL}/masterlistn/`, formDataWithVerification);
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

  const handleOpenUploadDialog = useCallback(async (masterlist, docType = '') => {
    try {
      const response = await axios.get('http://192.168.1.199:8001/api/user-details/', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      const { name, lastname } = response.data;
      const fullName = `${name} ${lastname}`;
  
      setSelectedMasterlist(masterlist);
      setDocumentForm(prev => ({ 
        ...prev, 
        document_type: docType || prev.document_type || '',
        document: null,
        remarks: '',
        verified_by: fullName
      }));
      setOpenUploadDialog(true);
    } catch (err) {
      console.error('Error fetching user details:', err);
      // Fallback
      setSelectedMasterlist(masterlist);
      setDocumentForm(prev => ({ 
        ...prev, 
        document_type: docType || prev.document_type || '',
        document: null,
        remarks: '',
        verified_by: "Unknown"
      }));
      setOpenUploadDialog(true);
    }
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
      formData.append('verified_by', documentForm.verified_by); // Add this line
  
      const response = await axios.post(
        `${BASE_URL}/masterlistn/${selectedMasterlist.id}/documents/upload/`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
  
      // Update the selected masterlist's documents
      setSelectedMasterlist(prev => {
        const updatedDocuments = [...(prev.documents || [])];
        // Mark previous versions of this doc type as not current
        updatedDocuments.forEach(doc => {
          if (doc.document_type === documentForm.document_type) {
            doc.is_current = false;
          }
        });
        // Add new document
        updatedDocuments.push({
          ...response.data,
          is_current: true
        });
        
        return {
          ...prev,
          documents: updatedDocuments
        };
      });
  
      showSnackbar('Document uploaded successfully', 'success');
      handleCloseUploadDialog();
    } catch (err) {
      showSnackbar('Error uploading document', 'error');
    }
  }, [documentForm, selectedMasterlist, handleCloseUploadDialog]);

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

  const MasterlistCard = useCallback(({ masterlist }) => {
    // Count uploaded documents
    const uploadedDocs = masterlist.documents?.filter(doc => doc.is_current) || [];
    const uploadedDocTypes = uploadedDocs.map(doc => doc.document_type);
    const missingDocTypes = EXPECTED_DOCUMENT_TYPES.filter(type => !uploadedDocTypes.includes(type));
    
    // Ensure customer is a string
    const customerDisplay = typeof masterlist.customer === 'object' 
      ? masterlist.customer?.name || 'No Customer' 
      : masterlist.customer || 'No Customer';
  
    // Create tooltip content
    const tooltipContent = (
      <Box
        sx={{
          maxHeight: 200,
          overflowY: 'auto',
          borderRadius: 1,
          boxShadow: 2,
        }}
      >
        <Typography variant="caption" gutterBottom sx={{ fontWeight: 60 }}>
          Document Status:
        </Typography>
        <List dense sx={{ py: 0 }}>
          {EXPECTED_DOCUMENT_TYPES.map(type => (
            <ListItem key={type} sx={{ py: 0.3, minHeight: '10px' }}>
              <ListItemAvatar sx={{ minWidth: 26 }}>
                {uploadedDocTypes.includes(type) ? (
                  <CheckCircleIcon color="success" fontSize="small" />
                ) : (
                  <CloseIcon color="error" fontSize="small" />
                )}
              </ListItemAvatar>
              <ListItemText
                primary={type}
                primaryTypographyProps={{ variant: 'caption' }}
              />
            </ListItem>
          ))}
        </List>
      </Box>
    );
    
  
    return (
      <Tooltip title={tooltipContent} placement="right" arrow>
        <StyledCard sx={{ 
          border: missingDocTypes.length > 0 ? '1px solid red' : '1px solid green',
          position: 'relative',
          cursor: 'pointer'
        }}
        onClick={() => {
          setSelectedMasterlist(masterlist);
          setCurrentTab(1);
          localStorage.setItem('selectedComponent', JSON.stringify(masterlist));
        }}>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
              <Typography variant="h6" component="div">
                {masterlist.component}
              </Typography>
  
              <Stack direction="row" spacing={1}>
                <Chip 
                  label={customerDisplay} 
                  size="small" 
                  color="primary" 
                  variant="outlined" 
                />
                <Chip 
                  label={masterlist.running_status} 
                  color={masterlist.running_status === "Not Running" ? "error" : "success"} 
                  size="small" 
                />
                <Chip 
                  label={`${uploadedDocs.length}/${EXPECTED_DOCUMENT_TYPES.length}`} 
                  color={missingDocTypes.length > 0 ? "error" : "success"} 
                  size="small" 
                />
              </Stack>
            </Stack>
  
            <Typography variant="subtitle1" color="text.secondary">
              {masterlist.part_name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Location: {masterlist.location}
            </Typography>
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Tooltip title="View Details">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
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
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenUploadDialog(masterlist);
                  }}
                >
                  <UploadIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Edit">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenDialog(masterlist);
                  }}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="View History">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewHistory(masterlist);
                  }}
                >
                  <HistoryIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
          </CardContent>
        </StyledCard>
      </Tooltip>
    );
  }, [handleOpenDialog, handleOpenUploadDialog, handleViewHistory]);

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
        <main className="flex flex-col mt-20 justify-center flex-grow ">
        {/* Your other components */}
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
  <FormControl fullWidth size="small">
    <InputLabel>Status</InputLabel>
    <Select
      value={filters.running_status}
      onChange={(e) => handleFilterChange('running_status', e.target.value)}
      label="Status"
    >
      <MenuItem value="">All Customers</MenuItem>
      <MenuItem value="NPD">NPD</MenuItem>
      <MenuItem value="Running">Running</MenuItem>
      <MenuItem value="Not Running">Not Running</MenuItem>
      
    </Select>
  </FormControl>
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
                   onClick={handleRedirect}
                   className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
                 >
                  Add New Component
                  </Button>
                </Grid>
                <Grid item md="auto">
                <Box sx={{ p: 1 }}>
                  <MissingDocumentsAlert />
                </Box>
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
                      {masterlists.map((masterlist) => (
                        <Grid item xs={12} sm={6} md={4} key={masterlist.id}>
                          <MasterlistCard masterlist={masterlist} />
                        </Grid>
                      ))}
                    </Grid>
                    <TablePagination
                      component="div"
                      count={pagination.totalCount}
                      page={pagination.page}
                      onPageChange={handleChangePage}
                      rowsPerPage={pagination.rowsPerPage}
                      onRowsPerPageChange={handleChangeRowsPerPage}
                      rowsPerPageOptions={[10, 20, 50]}
                    />
                  </>
                )}

                {currentTab === 1 && selectedMasterlist && (
                  <Paper sx={{ p: 1 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                      <Typography variant="h5">
                        {selectedMasterlist.component} - {selectedMasterlist.part_name} - {selectedMasterlist.verified_by}
                      </Typography>
                      <Button
                        variant="outlined"
                        startIcon={<EditIcon />}
                        onClick={() => handleOpenDialog(selectedMasterlist)}
                      >
                        Edit
                      </Button>
                    </Stack>

                    <Grid container spacing={1}>
                      {/* Basic Information */}
                      <Grid item xs={12} md={4}>
                        <Typography variant="h6" gutterBottom>
                          Basic Information
                        </Typography>
                        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, boxShadow: 2 }}>
                          <Table size="small">
                            <TableBody>
                              <TableRow><TableCell sx={{ fontWeight: 'bold' }}>Customer</TableCell><TableCell>{selectedMasterlist.customer}</TableCell></TableRow>
                              <TableRow><TableCell sx={{ fontWeight: 'bold' }}>Location</TableCell><TableCell>{selectedMasterlist.location}</TableCell></TableRow>
                              <TableRow><TableCell sx={{ fontWeight: 'bold' }}>Drawing Revision Number</TableCell><TableCell>{selectedMasterlist.drawing_rev_number}</TableCell></TableRow>
                              <TableRow><TableCell sx={{ fontWeight: 'bold' }}>Drawing Revision Date</TableCell><TableCell>{selectedMasterlist.drawing_rev_date}</TableCell></TableRow>
                              <TableRow><TableCell sx={{ fontWeight: 'bold' }}>Drawing Number</TableCell><TableCell>{selectedMasterlist.drawing_number}</TableCell></TableRow>
                              <TableRow><TableCell sx={{ fontWeight: 'bold' }}>Packing Condition</TableCell><TableCell>{selectedMasterlist.packing_condition}</TableCell></TableRow>
                              <TableRow><TableCell sx={{ fontWeight: 'bold' }}>Cost</TableCell><TableCell>{selectedMasterlist.cost}</TableCell></TableRow>
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </Grid>

                      {/* Specifications */}
                      <Grid item xs={12} md={4}>
                        <Typography variant="h6" gutterBottom>
                          Specifications
                        </Typography>
                        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, boxShadow: 2 }}>
                          <Table size="small">
                            <TableBody>
                              <TableRow><TableCell sx={{ fontWeight: 'bold' }}>Forging Line</TableCell><TableCell>{selectedMasterlist.forging_line}</TableCell></TableRow>
                              <TableRow><TableCell sx={{ fontWeight: 'bold' }}>Material Grade</TableCell><TableCell>{selectedMasterlist.material_grade}</TableCell></TableRow>
                              <TableRow><TableCell sx={{ fontWeight: 'bold' }}>Slug Weight</TableCell><TableCell>{selectedMasterlist.slug_weight} Kg</TableCell></TableRow>
                              <TableRow><TableCell sx={{ fontWeight: 'bold' }}>Bar Diameter</TableCell><TableCell>{selectedMasterlist.bar_dia} MM</TableCell></TableRow>
                              <TableRow><TableCell sx={{ fontWeight: 'bold' }}>Ring Weight</TableCell><TableCell>{selectedMasterlist.ring_weight} Kg</TableCell></TableRow>
                              <TableRow><TableCell sx={{ fontWeight: 'bold' }}>Heat-Treat Process</TableCell><TableCell>{selectedMasterlist.ht_process}</TableCell></TableRow>
                              <TableRow><TableCell sx={{ fontWeight: 'bold' }}>Hardness Required</TableCell><TableCell>{selectedMasterlist.hardness_required}</TableCell></TableRow>
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </Grid>

                      {/* Production Details */}
                      <Grid item xs={12} md={4}>
                        <Typography variant="h6" gutterBottom>
                          Machining Details
                        </Typography>
                        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, boxShadow: 2 }}>
                          <Table size="small">
                            <TableBody>
                              <TableRow><TableCell sx={{ fontWeight: 'bold' }}>OP 10 Time</TableCell><TableCell>{selectedMasterlist.op_10_time} Sec.</TableCell></TableRow>
                              <TableRow><TableCell sx={{ fontWeight: 'bold' }}>OP 10 Target</TableCell><TableCell>{selectedMasterlist.op_10_target} Pcs.</TableCell></TableRow>
                              <TableRow><TableCell sx={{ fontWeight: 'bold' }}>OP 20 Time</TableCell><TableCell>{selectedMasterlist.op_20_time} Sec.</TableCell></TableRow>
                              <TableRow><TableCell sx={{ fontWeight: 'bold' }}>OP 20 Target</TableCell><TableCell>{selectedMasterlist.op_20_target} Pcs.</TableCell></TableRow>
                              <TableRow><TableCell sx={{ fontWeight: 'bold' }}>CNC Target Remark</TableCell><TableCell>{selectedMasterlist.cnc_target_remark}</TableCell></TableRow>
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

                        <Grid container spacing={2}>
                          {EXPECTED_DOCUMENT_TYPES.map(docType => {
                            const currentDoc = selectedMasterlist.documents?.find(
                              doc => doc.document_type === docType && doc.is_current
                            );

                            return (
                              <Grid item xs={12} sm={6} md={3} key={docType}>
                                <Paper
                                  variant="outlined"
                                  sx={{
                                    p: 2,
                                    borderRadius: 2,
                                    boxShadow: 1,
                                    borderColor: currentDoc ? 'success.main' : 'error.main',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 1,
                                    height: '100%',
                                  }}
                                >
                                  {/* Header with icon + title */}
                                  <Stack direction="row" alignItems="center" spacing={1}>
                                    {currentDoc ? (
                                      <CheckCircleIcon color="success" fontSize="small" />
                                    ) : (
                                      <CloseIcon color="error" fontSize="small" />
                                    )}
                                    <Typography variant="subtitle2" fontWeight={600} noWrap>
                                      {docType}
                                    </Typography>
                                  </Stack>

                                  {/* Details + Actions in one row */}
                                  <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1} flexWrap="wrap">
                                    {currentDoc ? (
                                      <>
                                        <Typography variant="caption" color="text.secondary">
                                          v{currentDoc.version} • {formatDate(currentDoc.uploaded_at)}
                                          <br/>{currentDoc.remarks}
                                          <br/>{currentDoc.verified_by}
                                        </Typography>
                                        <Stack direction="row" spacing={1}>
                                          <Tooltip title="View">
                                            <IconButton
                                              size="small"
                                              href={currentDoc.document_url}
                                              target="_blank"
                                            >
                                              <DescriptionIcon fontSize="small" />
                                            </IconButton>
                                          </Tooltip>
                                          <Tooltip title="History">
                                            <IconButton
                                              size="small"
                                              onClick={() => handleViewDocumentHistory(selectedMasterlist, docType)}
                                            >
                                              <HistoryIcon fontSize="small" />
                                            </IconButton>
                                          </Tooltip>
                                        </Stack>
                                      </>
                                    ) : (
                                      <Typography variant="caption" color="text.disabled">
                                        Not uploaded
                                      </Typography>
                                    )}
                                  </Stack>

                                  {/* Upload button inline with small size */}
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    fullWidth
                                    startIcon={<UploadIcon fontSize="small" />}
                                    onClick={() => {
                                      setDocumentForm(prev => ({ 
                                        ...prev, 
                                        document_type: docType, // This sets the document type automatically
                                        document: null,
                                        remarks: '',
                                        verified_by: ''
                                      }));
                                      handleOpenUploadDialog(selectedMasterlist);
                                    }}
                                    sx={{ mt: 'auto', fontSize: '0.75rem', px: 1 }}
                                  >
                                    Upload
                                  </Button>
                                </Paper>
                              </Grid>
                            );
                          })}
                        </Grid>
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
                            <TableCell>Verify By</TableCell>
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
                              <TableCell>{doc.verified_by}</TableCell>
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
  InputProps={{
    readOnly: !!selectedMasterlist, // Only read-only when editing (not when adding new)
  }}
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
                      select
                      label="Running Status"
                      name="running_status"
                      value={formData.running_status}
                      onChange={handleInputChange}
                      margin="normal"
                    >
                      <MenuItem value="Running">Running</MenuItem>
                      <MenuItem value="Not Running">Not Running</MenuItem>
                      <MenuItem value="NPD">NPD</MenuItem>
                    </TextField>
                    <TextField
                      fullWidth
                      label="Location"
                      name="location"
                      value={formData.location}
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
                    <TextField
                      fullWidth
                      label="Drawing Rev Number"
                      name="drawing_rev_number"
                      value={formData.drawing_rev_number}
                      onChange={handleInputChange}
                      margin="normal"
                    />
                    <TextField
                      fullWidth
                      label="Drawing Rev Date"
                      name="drawing_rev_date"
                      type="date"
                      value={formData.drawing_rev_date}
                      onChange={handleInputChange}
                      margin="normal"
                      InputLabelProps={{
                        shrink: true, // ensures label stays visible above the date
                      }}
                    />
                    <TextField
                      fullWidth
                      label="Packing Condition"
                      name="packing_condition"
                      value={formData.packing_condition}
                      onChange={handleInputChange}
                      margin="normal"
                    />

                  </Grid>
                  <Grid item xs={12} md={6}>
                  <TextField
                      fullWidth
                      label="Forging Line"
                      name="forging_line"
                      value={formData.forging_line}
                      onChange={handleInputChange}
                      margin="normal"
                      select
                    >
                     <MenuItem value="1600 Ton">1600 Ton</MenuItem>
                      <MenuItem value="1000 Ton">1000 Ton</MenuItem>
                      <MenuItem value="A-SET">A-SET</MenuItem>
                      <MenuItem value="HAMMER1">HAMMER1</MenuItem>
                      <MenuItem value="HAMMER2">HAMMER2</MenuItem>
                      <MenuItem value="FFL">FFL</MenuItem>
                    </TextField>
                    <TextField
                        fullWidth
                        label="Material Grade"
                        name="material_grade"
                        value={formData.material_grade}
                        onChange={handleInputChange}
                        onBlur={() => setTimeout(() => setSuggestions(prev => ({ ...prev, grade: [] })), 200)}
                        margin="normal"
                        autoComplete="off" // <- Add this line
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              {loading && <CircularProgress size={20} />}
                            </InputAdornment>
                          ),
                        }}
                      />
                      {/* Suggestions dropdown */}
                      {suggestions.grade.length > 0 && (
                        <Paper 
                          elevation={3} 
                          sx={{ 
                            position: 'absolute', 
                            zIndex: 50, 
                            mt: -2, 
                            width: '100%', 
                            maxHeight: 200, 
                            overflow: 'auto' 
                          }}
                        >
                        <List>
                          {suggestions.grade.map((grade, index) => (
                            <ListItem 
                              key={index} 
                              button 
                              onClick={() => {
                                setFormData(prev => ({ ...prev, material_grade: grade }));
                                setSuggestions(prev => ({ ...prev, grade: [] }));
                              }}
                            >
                              <ListItemText primary={grade} />
                            </ListItem>
                          ))}
                        </List>
                      </Paper>
                    )}
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
                      label="Ring Weight"
                      name="ring_weight"
                      value={formData.ring_weight}
                      onChange={handleInputChange}
                      margin="normal"
                    />
                     <TextField
                      fullWidth
                      label="ht_process"
                      name="ht_process"
                      value={formData.ht_process}
                      onChange={handleInputChange}
                      margin="normal"
                      select
                      >
                      <MenuItem value="ISO-Thermal Annealing">ISO-Thermal Annealing</MenuItem>
                      <MenuItem value="H&T">H&T</MenuItem>
                      <MenuItem value="Case Hardning">Case Hardning</MenuItem>
                       
                     </TextField>
                     <TextField
                      fullWidth
                      label="Hard-ness Required"
                      name="hardness_required"
                      value={formData.hardness_required}
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
                  {/* Add this near the end of your form, before the DialogActions */}
<Grid item xs={12}>
  <TextField
    fullWidth
    label="Verified By"
    name="verified_by"
    value={formData.verified_by}
    onChange={handleInputChange}
    margin="normal"
    required
    InputProps={{
      readOnly: true,
    }}
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
                  <option value="Design Records">Design Records</option>
                  <option value="Authorized Engineering Change Documents">Authorized Engineering Change Documents</option>
                  <option value="Customer Engineering Approval">Customer Engineering Approval</option>
                  <option value="Design Failure Modes and Effects Analysis (DFMEA)">Design Failure Modes and Effects Analysis (DFMEA)</option>
                  <option value="Process Flow Diagram">Process Flow Diagram</option>
                  <option value="Process Failure Modes and Effects Analysis (PFMEA)">Process Failure Modes and Effects Analysis (PFMEA)</option>
                  <option value="Control Plan">Control Plan</option>
                  <option value="Measurement Systems Analysis (MSA)">Measurement Systems Analysis (MSA)</option>
                  <option value="Dimensional Results">Dimensional Results</option>
                  <option value="Records of Material & Performance Test Results">Records of Material & Performance Test Results</option>
                  <option value="Initial Process Studies">Initial Process Studies</option>
                  <option value="Qualified Laboratory Documentation">Qualified Laboratory Documentation</option>
                  <option value="Appearance Approval Report (AAR)">Appearance Approval Report (AAR)</option>
                  <option value="Sample Production Parts">Sample Production Parts</option>
                  <option value="Master Sample">Master Sample</option>
                  <option value="Checking Aids">Checking Aids</option>
                  <option value="Customer-Specific Requirements">Customer-Specific Requirements</option>
                  <option value="Part Submission Warrant (PSW)">Part Submission Warrant (PSW)</option>

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
                <TextField
                  fullWidth
                  label="Verified By"
                  name="verified_by"
                  value={formData.verified_by || ""}
                  margin="normal"
                  InputProps={{
                    readOnly: true,
                  }}
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