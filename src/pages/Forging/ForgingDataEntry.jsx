import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Modal, Button, Grid, Paper, Typography, TextField, 
  FormControl, InputLabel, Select, MenuItem, Box, 
  CircularProgress, Chip, Alert, Autocomplete, IconButton, Divider
} from '@mui/material';
import dayjs from 'dayjs';
import { styled } from '@mui/material/styles';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { Sidebar } from "../Navigation/Sidebar";
import DashboardHeader from "../Navigation/DashboardHeader";
// Styled components for better UI
const StatusButton = styled(Button)(({ status }) => ({
  backgroundColor: status === 'missing' ? '#ffebee' : status === 'completed' ? '#e8f5e9' : '#e3f2fd',
  '&:hover': {
    backgroundColor: status === 'missing' ? '#ffcdd2' : status === 'completed' ? '#c8e6c9' : '#bbdefb',
  },
  color: status === 'missing' ? '#c62828' : status === 'completed' ? '#2e7d32' : '#1565c0',
  fontWeight: 'bold',
  border: 'none',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  transition: 'all 0.3s ease',
  height: '80px',
  display: 'flex',
  flexDirection: 'column',
  gap: '4px'
}));

const ForgingDataEntry = () => {
  // Configuration
  const LINES = ['1600 TON', 'A-SET', 'HAMMER1', 'HAMMER', 'FFL', '1000 Ton', 'W-SET'];
  const SHIFTS = ['Day', 'Night'];

  // State management
  const [currentDate, setCurrentDate] = useState(null);
  const [entriesStatus, setEntriesStatus] = useState({});
  const [allShiftsCompleted, setAllShiftsCompleted] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [selectedLine, setSelectedLine] = useState('');
  const [selectedShift, setSelectedShift] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [missingEntries, setMissingEntries] = useState([]);
  const [verifiedBy, setVerifiedBy] = useState('');
  const [batchSuggestions, setBatchSuggestions] = useState([]);
  const [loadingBatchSuggestions, setLoadingBatchSuggestions] = useState(false);

   const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  
    const toggleSidebar = () => {
      setIsSidebarVisible(!isSidebarVisible);
    };
    const pageTitle = "Forging Production Entry"; // Set the page title here

    const formanOptions = [
  "Na", "Jitendra", "Ram", "Shambhu", "Somveer", 
  "Lal Chand", "Rahul", "Satveer", "Abbash", 
  "Chandan", "Rajesh", "Shiv Kumar"
];
const lineInchargeOptions = [
  "Na", "Santosh", "Devendra", "Rahul", "Neeraj", 
  "Lal Chand", "Satveer", "Yogesh", "Sanjeev", "Aashish"
];

  
  // Form data state - now supports multiple batches
  const [formData, setFormData] = useState({
    batches: [{
      batch_number: '',
      component: '',
      customer: '',
      slug_weight: '',
      rm_grade: '',
      heat_number: '',
      target: 0,
      production: 0,
      rework: 0,
      up_setting: 0,
      half_piercing: 0,
      full_piercing: 0,
      ring_rolling: 0,
      sizing: 0,
      overheat: 0,
      bar_crack_pcs: 0,
      remaining: 0,
      total_production: 0
    }],
    line_incharge: '',
    forman: '',
    verified_by: '',
    machine_status: '',
    downtime_minutes: 0,
    reason_for_downtime: '',
    reason_for_low_production: ''
  });

  // Check if today is Sunday
  const isSunday = currentDate ? currentDate.day() === 0 : false;

  // Fetch initial data
  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Get the last entry status from server
        const response = await axios.get('http://192.168.1.199:8001/forging/last-entry-check/');
        
        const lastDate = response.data.last_date ? dayjs(response.data.last_date) : dayjs();
        const missingEntries = response.data.missing_entries || [];
        const allCompleted = response.data.all_shifts_completed || false;
        
        // If today is Sunday and all shifts are completed, automatically advance to Monday
        if (lastDate.day() === 0 && allCompleted) {
          const newDate = lastDate.add(1, 'day');
          setCurrentDate(newDate);
          initializeEmptyStatus();
          return;
        }
        
        // Initialize status map
        const statusMap = {};
        LINES.forEach(line => {
          statusMap[line] = {};
          SHIFTS.forEach(shift => {
            const entryKey = `${line} - ${shift}`;
            statusMap[line][shift] = missingEntries.includes(entryKey) ? 'missing' : 'completed';
          });
        });
        
        setCurrentDate(lastDate);
        setEntriesStatus(statusMap);
        setAllShiftsCompleted(allCompleted);
        setMissingEntries(missingEntries);
      } catch (err) {
        console.error('Initialization error:', err);
        setError('Failed to load data. Please try again.');
        // Fallback to current date if API fails
        setCurrentDate(dayjs());
        initializeEmptyStatus();
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, []);

  // Fetch user data for verified_by field
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axios.get(
          "http://192.168.1.199:8001/api/user-details/",
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
          }
        );
        const { name, lastname } = response.data;
        setVerifiedBy(`${name} ${lastname}`);
        setFormData(prev => ({
          ...prev,
          verified_by: `${name} ${lastname}`
        }));
      } catch (error) {
        console.error("Error fetching user details:", error);
      }
    };

    fetchUserData();
  }, []);

  // Initialize empty status map
  const initializeEmptyStatus = () => {
    const statusMap = {};
    LINES.forEach(line => {
      statusMap[line] = {};
      SHIFTS.forEach(shift => {
        statusMap[line][shift] = 'missing';
      });
    });
    setEntriesStatus(statusMap);
    setAllShiftsCompleted(false);
    setMissingEntries(LINES.flatMap(line => 
      SHIFTS.map(shift => `${line} - ${shift}`))
    );
  };

  // Move to next day
  const advanceToNextDay = () => {
    if (allShiftsCompleted || isSunday) {
      const newDate = currentDate.add(1, 'day');
      setCurrentDate(newDate);
      setAllShiftsCompleted(false);
      initializeEmptyStatus();
    }
  };

  // Handle line/shift selection
  const handleLineShiftClick = (line, shift) => {
    if (entriesStatus[line]?.[shift] === 'missing') {
      setSelectedLine(line);
      setSelectedShift(shift);
      
      // Reset form data for new entry
      setFormData({
        batches: [{
          batch_number: '',
          component: '',
          customer: '',
          slug_weight: '',
          rm_grade: '',
          heat_number: '',
          target: 0,
          production: 0,
          rework: 0,
          up_setting: 0,
          half_piercing: 0,
          full_piercing: 0,
          ring_rolling: 0,
          sizing: 0,
          overheat: 0,
          bar_crack_pcs: 0,
          remaining: 0,
          total_production: 0
        }],
        line_incharge: '',
        forman: '',
        verified_by: verifiedBy,
        machine_status: '',
        downtime_minutes: 0,
        reason_for_downtime: '',
        reason_for_low_production: ''
      });
      
      setOpenModal(true);
    }
  };

  // Fetch batch suggestions
  const fetchBatchSuggestions = async (query) => {
    if (!query) {
      setBatchSuggestions([]);
      return;
    }

    setLoadingBatchSuggestions(true);
    try {
      const response = await axios.get(
        "http://192.168.1.199:8001/raw_material/autocompleteforging/",
        { params: { block_mt_id: query } }
      );
      setBatchSuggestions(response.data);
    } catch (error) {
      console.error("Error fetching batch suggestions:", error);
    } finally {
      setLoadingBatchSuggestions(false);
    }
  };

  // Fetch part details when batch number is selected
  const fetchPartDetails = async (batch_number, batchIndex) => {
    try {
      // First API call to get part details
      const partDetailsResponse = await axios.get(
        "http://192.168.1.199:8001/raw_material/get_part_detailsforging/",
        { params: { block_mt_id: batch_number } }
      );
      const partData = partDetailsResponse.data;
  
      // Second API call to get target details (total production)
      const targetDetailsResponse = await axios.get(
        "http://192.168.1.199:8001/forging/get-target-details/",
        { params: { batch_no: batch_number } }
      );
      const targetData = targetDetailsResponse.data;
  
      // Third API call to get slug weight
      const slugWeightResponse = await axios.get(
        "http://192.168.1.199:8001/raw_material/get-part-details/",
        { params: { component: partData.component } }
      );
      const slugWeightData = slugWeightResponse.data;
  
      // Update form data with fetched details for the specific batch
      setFormData(prev => {
        const updatedBatches = [...prev.batches];
        updatedBatches[batchIndex] = {
          ...updatedBatches[batchIndex],
          batch_number: batch_number,
          component: partData.component || "",
          heat_number: partData.heatno || "",
          target: partData.pices || 0,
          customer: partData.customer || "",
          rm_grade: partData.grade || "",
          total_production: targetData.total_production || 0,
          slug_weight: slugWeightData.slug_weight || "",
          remaining: (parseFloat(partData.pices) || 0) - (parseFloat(targetData.total_production) || 0)
        };
        
        return {
          ...prev,
          batches: updatedBatches
        };
      });
  
    } catch (error) {
      console.error("Error fetching part details:", error);
      alert("Please enter a correct batch number.");
      setFormData(prev => {
        const updatedBatches = [...prev.batches];
        updatedBatches[batchIndex] = {
          ...updatedBatches[batchIndex],
          batch_number: "",
          component: "",
          heat_number: "",
          target: 0,
          customer: "",
          rm_grade: "",
          total_production: 0,
          slug_weight: "",
          remaining: 0
        };
        
        return {
          ...prev,
          batches: updatedBatches
        };
      });
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'machine_status') {
      setFormData(prev => ({
        ...prev,
        machine_status: value,
        // Reset relevant fields when machine status changes
        batches: value === 'running' ? prev.batches : [{
          batch_number: 'NA',
          component: 'NA',
          customer: 'NA',
          slug_weight: '0',
          rm_grade: 'NA',
          heat_number: 'NA',
          target: 0,
          production: 0,
          rework: 0,
          up_setting: 0,
          half_piercing: 0,
          full_piercing: 0,
          ring_rolling: 0,
          sizing: 0,
          overheat: 0,
          bar_crack_pcs: 0,
          remaining: 0,
          total_production: 0
        }],
        reason_for_low_production: value === 'breakdown' ? 'Machine Breakdown' : 
                                 value === 'maintenance' ? 'Machine Maintenance' : 
                                 value === 'idle' ? 'Machine Idle' : '',
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Handle batch-specific input changes
  const handleBatchInputChange = (e, batchIndex) => {
    const { name, value } = e.target;
    
    setFormData(prev => {
      const updatedBatches = [...prev.batches];
      updatedBatches[batchIndex] = {
        ...updatedBatches[batchIndex],
        [name]: value
      };
      
      return {
        ...prev,
        batches: updatedBatches
      };
    });
  };

  const handleBatchNumberChange = (event, value, batchIndex) => {
    setFormData(prev => {
      const updatedBatches = [...prev.batches];
      updatedBatches[batchIndex] = {
        ...updatedBatches[batchIndex],
        batch_number: value || ''
      };
      
      return {
        ...prev,
        batches: updatedBatches
      };
    });
    
    if (value) {
      fetchPartDetails(value, batchIndex);
    }
  };

  const handleBatchInputChangeAutocomplete = (event, value) => {
    fetchBatchSuggestions(value);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedLine('');
    setSelectedShift('');
  };

  // Add a new batch to the form
  const addBatch = () => {
    setFormData(prev => ({
      ...prev,
      batches: [
        ...prev.batches,
        {
          batch_number: '',
          component: '',
          customer: '',
          slug_weight: '',
          rm_grade: '',
          heat_number: '',
          target: 0,
          production: 0,
          rework: 0,
          up_setting: 0,
          half_piercing: 0,
          full_piercing: 0,
          ring_rolling: 0,
          sizing: 0,
          overheat: 0,
          bar_crack_pcs: 0,
          remaining: 0,
          total_production: 0
        }
      ]
    }));
  };

  // Remove a batch from the form
  const removeBatch = (index) => {
    if (formData.batches.length > 1) {
      setFormData(prev => ({
        ...prev,
        batches: prev.batches.filter((_, i) => i !== index)
      }));
    }
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  
  if (!formData.machine_status) {
    alert('Please select machine status');
    return;
  }
  
  try {
    const baseData = {
      date: currentDate.format('YYYY-MM-DD'),
      line: selectedLine,
      shift: selectedShift,
      line_incharge: formData.line_incharge || 'NA',
      forman: formData.forman || 'NA',
      verified_by: formData.verified_by,
      machine_status: formData.machine_status,
      downtime_minutes: formData.downtime_minutes || 0,
      reason_for_downtime: formData.reason_for_downtime || '',
      reason_for_low_production: formData.reason_for_low_production || '',
      // Default values for all required fields
      batch_number: 'NA',
      component: 'NA',
      customer: 'NA',
      slug_weight: 0,
      rm_grade: 'NA',
      heat_number: 'NA',
      target: 0,
      production: 0,
      rework: 0,
      up_setting: 0,
      half_piercing: 0,
      full_piercing: 0,
      ring_rolling: 0,
      sizing: 0,
      overheat: 0,
      bar_crack_pcs: 0,
      remaining: 0,
      total_production: 0
    };

    // For running status, use the batch data
    const requests = formData.machine_status === 'running' 
      ? formData.batches.map(batch => {
          const batchData = {
            ...baseData,
            ...batch
          };
          return axios.post('http://192.168.1.199:8001/forging/forgingcheq/', batchData);
        })
      : [axios.post('http://192.168.1.199:8001/forging/forgingcheq/', baseData)];

    await Promise.all(requests);

    // Refresh the data after successful submission
    const response = await axios.get('http://192.168.1.199:8001/forging/last-entry-check/');
    
    const updatedMissingEntries = response.data.missing_entries || [];
    const updatedAllCompleted = response.data.all_shifts_completed || false;
    
    // Update status map
    const updatedStatus = {...entriesStatus};
    updatedStatus[selectedLine][selectedShift] = 'completed';
    
    setEntriesStatus(updatedStatus);
    setMissingEntries(updatedMissingEntries);
    setAllShiftsCompleted(updatedAllCompleted);
    setOpenModal(false);
  } catch (err) {
    console.error('Error saving data:', err);
    setError('Failed to save data. Please try again.');
  }
};

  // Loading state
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress size={60} />
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button 
          variant="contained" 
          onClick={() => window.location.reload()}
        >
          Retry
        </Button>
      </Box>
    );
  }

  // Main render
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


        <main className="flex flex-col mt-20  justify-center flex-grow pl-2">

        {/* Main Content */}
    <Box sx={{ 
      maxWidth: 'full', 
      margin: '0 auto',
      backgroundColor: '#f9f9f9',
      minHeight: '100vh'
    }}>
      {/* Header Section */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        p: 1,
        backgroundColor: '#ffffff',
        borderRadius: 2,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <Typography variant="h4" sx={{ 
          fontWeight: 'bold', 
          color: '#333',
          background: 'linear-gradient(45deg, #3f51b5 30%, #2196f3 90%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Forging Production Entry
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Chip 
            label={currentDate.format('DD MMMM YYYY')} 
            color="primary" 
            sx={{ 
              fontSize: '1.1rem', 
              p: 2, 
              fontWeight: 'bold',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          />
          <Button 
            variant="contained" 
            color="success"
            onClick={advanceToNextDay}
            disabled={!allShiftsCompleted && !isSunday}
            sx={{ 
              px: 4,
              py: 1.5,
              fontWeight: 'bold',
              fontSize: '1rem',
              textTransform: 'none',
              boxShadow: 2,
              borderRadius: '8px',
              '&:disabled': {
                backgroundColor: '#e0e0e0',
                color: '#9e9e9e'
              }
            }}
          >
            {isSunday ? 'Skip Sunday →' : 
             allShiftsCompleted ? 'Start Next Day →' : 'Complete All Entries First'}
          </Button>
        </Box>
      </Box>

      {/* Progress Indicator */}
      {!allShiftsCompleted && missingEntries.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            {missingEntries.length} shifts remaining for {currentDate.format('DD MMMM YYYY')}
            {isSunday && " (Today is Sunday - you can skip to Monday)"}
          </Alert>
        </Box>
      )}

      {/* Production Lines Grid */}
      <Grid container spacing={3}>
        {LINES.map((line) => (
          <Grid item xs={12} sm={6} lg={4} key={line}>
            <Paper elevation={3} sx={{ 
              p: 2, 
              borderRadius: 3,
              borderLeft: '4px solid',
              borderColor: '#3f51b5',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: '#ffffff',
              transition: 'transform 0.3s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 6px 12px rgba(0,0,0,0.15)'
              }
            }}>
              <Typography variant="h6" align="center" sx={{ 
                mb: 2, 
                fontWeight: 'bold',
                color: '#3f51b5',
                fontSize: '1.2rem'
              }}>
                {line}
              </Typography>
              <Grid container spacing={2} sx={{ mt: 'auto' }}>
                {SHIFTS.map((shift) => {
                  const status = entriesStatus[line]?.[shift] || 'missing';
                  return (
                    <Grid item xs={6} key={shift}>
                      <StatusButton
                        fullWidth
                        status={status}
                        onClick={() => handleLineShiftClick(line, shift)}
                      >
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                          {shift} Shift
                        </Typography>
                        <Box sx={{ 
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1
                        }}>
                          <Box sx={{ 
                            width: 12, 
                            height: 12, 
                            borderRadius: '50%',
                            backgroundColor: status === 'completed' ? '#4caf50' : '#f44336'
                          }} />
                          <Typography variant="caption" sx={{ 
                            fontWeight: 'bold',
                            color: status === 'completed' ? '#2e7d32' : '#c62828'
                          }}>
                            {status === 'completed' ? 'Completed' : 'Pending'}
                          </Typography>
                        </Box>
                      </StatusButton>
                    </Grid>
                  );
                })}
              </Grid>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Entry Modal */}
      <Modal
        open={openModal}
        onClose={handleCloseModal}
        aria-labelledby="entry-modal-title"
        aria-describedby="entry-modal-description"
      >
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: { xs: '95%', sm: '90%', md: '80%' },
          maxWidth: 1000,
          bgcolor: 'background.paper',
          boxShadow: 24,
          p: { xs: 2, sm: 3, md: 4 },
          borderRadius: 2,
          maxHeight: '90vh',
          overflowY: 'auto',
          outline: 'none'
        }}>
          <Typography id="entry-modal-title" variant="h5" component="h2" sx={{ 
            mb: 2, 
            fontWeight: 'bold',
            color: '#3f51b5'
          }}>
            {selectedLine} - {selectedShift} Shift Entry
          </Typography>
          <Typography variant="subtitle1" sx={{ 
            mb: 3, 
            color: '#666',
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}>
            <Box component="span" sx={{ fontWeight: 'bold' }}>Date:</Box>
            {currentDate.format('dddd, DD MMMM YYYY')}
          </Typography>
          
          <form onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              {/* Machine Status Field - Always shown first */}
              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel>Machine Status</InputLabel>
                  <Select
                    name="machine_status"
                    value={formData.machine_status}
                    onChange={handleInputChange}
                    label="Machine Status"
                  >
                    <MenuItem value="running">Running</MenuItem>
                    <MenuItem value="idle">Idle</MenuItem>
                    <MenuItem value="breakdown">Breakdown</MenuItem>
                    <MenuItem value="maintenance">Maintenance</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Show downtime fields for breakdown or maintenance */}
              {(formData.machine_status === 'breakdown' || formData.machine_status === 'maintenance') && (
                <>
                 
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Reason"
                      name="reason_for_downtime"
                      multiline
                      rows={2}
                      value={formData.reason_for_downtime}
                      onChange={handleInputChange}
                      required
                    />
                  </Grid>
                </>
              )}

              {formData.machine_status === 'idle' && (
                <>
                
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Reason"
                      name="reason_for_downtime"
                      multiline
                      rows={2}
                      value={formData.reason_for_downtime}
                      onChange={handleInputChange}
                      required
                    />
                  </Grid>
                </>
              )}


              {/* Common fields for all statuses */}
             
              {/* Show batch fields only when machine is running */}
              {formData.machine_status === 'running' && (
                <>
                  {formData.batches.map((batch, batchIndex) => (
                    <React.Fragment key={batchIndex}>
                      <Grid item xs={12}>
                        <Divider sx={{ my: 2 }}>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="subtitle1">
                              Batch {batchIndex + 1}
                            </Typography>
                            {batchIndex > 0 && (
                              <IconButton 
                                color="error" 
                                onClick={() => removeBatch(batchIndex)}
                                size="small"
                              >
                                <DeleteOutlineIcon />
                              </IconButton>
                            )}
                          </Box>
                        </Divider>
                      </Grid>

                      <Grid item xs={6}>
                        <Autocomplete
                          freeSolo
                          options={batchSuggestions}
                          loading={loadingBatchSuggestions}
                          value={batch.batch_number}
                          onChange={(event, value) => handleBatchNumberChange(event, value, batchIndex)}
                          onInputChange={handleBatchInputChangeAutocomplete}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Batch Number"
                              required
                              InputProps={{
                                ...params.InputProps,
                                endAdornment: (
                                  <>
                                    {loadingBatchSuggestions ? <CircularProgress color="inherit" size={20} /> : null}
                                    {params.InputProps.endAdornment}
                                  </>
                                ),
                              }}
                            />
                          )}
                        />
                      </Grid>

                      <Grid item xs={6} sm={3}>
                        <TextField
                          fullWidth
                          label="Component"
                          name="component"
                          value={batch.component}
                          InputProps={{
                            readOnly: true,
                          }}
                          required
                        />
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <TextField
                          fullWidth
                          label="Customer"
                          name="customer"
                          value={batch.customer}
                          InputProps={{
                            readOnly: true,
                          }}
                          required
                        />
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <TextField
                          fullWidth
                          label="Slug Weight"
                          name="slug_weight"
                          value={batch.slug_weight}
                          InputProps={{
                            readOnly: true,
                          }}
                          required
                        />
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <TextField
                          fullWidth
                          label="RM Grade"
                          name="rm_grade"
                          value={batch.rm_grade}
                          InputProps={{
                            readOnly: true,
                          }}
                          required
                        />
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <TextField
                          fullWidth
                          label="Heat Number"
                          name="heat_number"
                          value={batch.heat_number}
                          InputProps={{
                            readOnly: true,
                          }}
                          required
                        />
                      </Grid>
                     
                      <Grid item xs={12} sm={6} hidden>
                        <TextField
                          fullWidth
                          label="Total Production"
                          name="total_production"
                          type="number"
                          value={batch.total_production}
                          InputProps={{
                            readOnly: true,
                          }}
                          required
                        />
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <TextField
                          fullWidth
                          label="Remaining"
                          name="remaining"
                          type="number"
                          value={batch.remaining}
                          InputProps={{
                            readOnly: true,
                          }}
                          required
                        />
                      </Grid>
                       <Grid item xs={6} sm={3}>
  <Autocomplete
    options={lineInchargeOptions}
    value={formData.line_incharge}
    onChange={(event, newValue) => {
      setFormData({ ...formData, line_incharge: newValue });
    }}
    renderInput={(params) => (
      <TextField
        {...params}
        label="Line Incharge"
        name="line_incharge"
        required
      />
    )}
    fullWidth
    freeSolo // remove this line if you want to restrict only to given options
  />
</Grid>
                     <Grid item xs={6} sm={3}>
                          <Autocomplete
                            options={formanOptions}
                            value={formData.forman}
                            onChange={(event, newValue) => {
                              setFormData({ ...formData, forman: newValue });
                            }}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                label="Foreman"
                                name="forman"
                                required
                              />
                            )}
                            fullWidth
                            freeSolo // optional: allows typing values not in list
                          />
                        </Grid>

                      <Grid item xs={3} sm={1.5}>
                        <TextField
                          fullWidth
                          label="Target"
                          name="target"
                          type="number"
                          value={batch.target}
                          onChange={(e) => handleBatchInputChange(e, batchIndex)}
                          required
                        />
                      </Grid>
                       <Grid item xs={3} sm={1.5}>
                        <TextField
                          fullWidth
                          label="Production"
                          name="production"
                          type="number"
                          value={batch.production}
                          onChange={(e) => handleBatchInputChange(e, batchIndex)}
                          required
                        />
                      </Grid>
                       <Grid item xs={3} sm={1.5}>
                        <TextField
                          fullWidth
                          label="Rework"
                          name="rework"
                          type="number"
                          value={batch.rework}
                          onChange={(e) => handleBatchInputChange(e, batchIndex)}
                        />
                      </Grid>
                      <Grid item xs={3} sm={1.5}>
                        <TextField
                          fullWidth
                          label="Up Setting"
                          name="up_setting"
                          type="number"
                          value={batch.up_setting}
                          onChange={(e) => handleBatchInputChange(e, batchIndex)}
                        />
                      </Grid>
                      <Grid item xs={3} sm={1.5}>
                        <TextField
                          fullWidth
                          label="Half Piercing"
                          name="half_piercing"
                          type="number"
                          value={batch.half_piercing}
                          onChange={(e) => handleBatchInputChange(e, batchIndex)}
                        />
                      </Grid>
                       <Grid item xs={3} sm={1.5}>
                        <TextField
                          fullWidth
                          label="Full Piercing"
                          name="full_piercing"
                          type="number"
                          value={batch.full_piercing}
                          onChange={(e) => handleBatchInputChange(e, batchIndex)}
                        />
                      </Grid>
                       <Grid item xs={3} sm={1.5}>
                        <TextField
                          fullWidth
                          label="Ring Rolling"
                          name="ring_rolling"
                          type="number"
                          value={batch.ring_rolling}
                          onChange={(e) => handleBatchInputChange(e, batchIndex)}
                        />
                      </Grid>
                       <Grid item xs={3} sm={1.5}>
                        <TextField
                          fullWidth
                          label="Sizing"
                          name="sizing"
                          type="number"
                          value={batch.sizing}
                          onChange={(e) => handleBatchInputChange(e, batchIndex)}
                        />
                      </Grid>
                      <Grid item xs={3} sm={1.5}>
                        <TextField
                          fullWidth
                          label="Overheat"
                          name="overheat"
                          type="number"
                          value={batch.overheat}
                          onChange={(e) => handleBatchInputChange(e, batchIndex)}
                        />
                      </Grid>
                      <Grid item xs={3} sm={1.5}>
                        <TextField
                          fullWidth
                          label="Bar Crack Pcs"
                          name="bar_crack_pcs"
                          type="number"
                          value={batch.bar_crack_pcs}
                          onChange={(e) => handleBatchInputChange(e, batchIndex)}
                        />
                      </Grid>
                       <Grid item xs={6} sm={3}>
                    <TextField
                      fullWidth
                      label="Downtime (minutes)"
                      name="downtime_minutes"
                      type="number"
                      value={formData.downtime_minutes}
                      onChange={handleInputChange}
                    />
                  </Grid>
                   <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Reason Down Time"
                    name="reason_for_low_production"
                    value={formData.reason_for_low_production}
                    onChange={handleInputChange}
                  />
                </Grid>
                    </React.Fragment>
                  ))}

                  {/* Add Batch Button */}
                  <Grid item xs={12}>
                    <Button
                      variant="outlined"
                      startIcon={<AddCircleOutlineIcon />}
                      onClick={addBatch}
                      fullWidth
                    >
                      Add Another Batch
                    </Button>
                  </Grid>
                </>
              )}

              {/* Common fields for all statuses */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Verified By"
                  name="verified_by"
                  value={formData.verified_by}
                  InputProps={{
                    readOnly: true,
                  }}
                  required
                />
              </Grid>

              
              
             

              <Grid item xs={12}>
                <Box display="flex" justifyContent="flex-end" mt={2} gap={2}>
                  <Button 
                    variant="outlined" 
                    onClick={handleCloseModal}
                  >
                    Cancel
                  </Button>
                  <Button 
                    variant="contained" 
                    color="primary" 
                    type="submit"
                  >
                    Save Data
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </Box>
      </Modal>
    </Box>
    </main>
    </div>
    </div>
    
  );
};

export default ForgingDataEntry;