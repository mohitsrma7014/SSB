import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Modal, Button, Grid, Paper, Typography, TextField, 
  FormControl, InputLabel, Select, MenuItem, Box, 
  CircularProgress, Chip, Alert, Autocomplete
} from '@mui/material';
import dayjs from 'dayjs';
import { styled } from '@mui/material/styles';

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
  const [showFullForm, setShowFullForm] = useState(false);
  const [verifiedBy, setVerifiedBy] = useState('');
  const [batchSuggestions, setBatchSuggestions] = useState([]);
  const [loadingBatchSuggestions, setLoadingBatchSuggestions] = useState(false);
  
  // Form data state
  const [formData, setFormData] = useState({
    batch_number: '',
    component: '',
    customer: '',
    slug_weight: '',
    rm_grade: '',
    heat_number: '',
    line_incharge: '',
    forman: '',
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
    verified_by: '',
    machine_status: '',
    downtime_minutes: 0,
    reason_for_downtime: '',
    reason_for_low_production: '',
    remaining: 0,
    total_production: 0
  });

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
    if (allShiftsCompleted) {
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
      setShowFullForm(false);
      
      // Reset form data for new entry
      setFormData({
        batch_number: '',
        component: '',
        customer: '',
        slug_weight: '',
        rm_grade: '',
        heat_number: '',
        line_incharge: '',
        forman: '',
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
        verified_by: verifiedBy,
        machine_status: '',
        downtime_minutes: 0,
        reason_for_downtime: '',
        reason_for_low_production: '',
        remaining: 0,
        total_production: 0
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
  const fetchPartDetails = async (batch_number) => {
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
  
      // Update form data with fetched details
      setFormData(prev => ({
        ...prev,
        component: partData.component || "",
        heat_number: partData.heatno || "",
        target: partData.pices || 0,
        customer: partData.customer || "",
        rm_grade: partData.grade || "",
        total_production: targetData.total_production || 0,
        slug_weight: slugWeightData.slug_weight || "",
        remaining: (parseFloat(partData.pices) || 0) - (parseFloat(targetData.total_production) || 0)
      }));
  
    } catch (error) {
      console.error("Error fetching part details:", error);
      alert("Please enter a correct batch number.");
      setFormData(prev => ({
        ...prev,
        batch_number: "",
        component: "",
        heat_number: "",
        target: 0,
        customer: "",
        rm_grade: "",
        total_production: 0,
        slug_weight: "",
        remaining: 0
      }));
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'machine_status') {
      if (value === 'running') {
        setShowFullForm(true);
      } else if (value === 'idle') {
        // Auto-fill with NA and 0 for idle status
        setFormData(prev => ({
          ...prev,
          machine_status: value,
          batch_number: 'NA',
          component: 'NA',
          customer: 'NA',
          slug_weight: '0',
          rm_grade: 'NA',
          heat_number: 'NA',
          line_incharge: 'NA',
          forman: 'NA',
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
          verified_by: verifiedBy,
          downtime_minutes: 0,
          reason_for_downtime: 'Machine Idle',
          reason_for_low_production: 'Machine Idle',
          remaining: 0,
          total_production: 0
        }));
        setShowFullForm(false);
      } else {
        // For breakdown or maintenance, show only relevant fields
        setFormData(prev => ({
          ...prev,
          machine_status: value,
          batch_number: 'NA',
          component: 'NA',
          customer: 'NA',
          slug_weight: '0',
          rm_grade: 'NA',
          heat_number: 'NA',
          line_incharge: 'NA',
          forman: 'NA',
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
          verified_by: verifiedBy,
          reason_for_low_production: value === 'breakdown' ? 'Machine Breakdown' : 'Machine Maintenance',
          remaining: 0,
          total_production: 0
        }));
        setShowFullForm(false);
      }
    } else if (name === 'production') {
      // Validate production doesn't exceed remaining + 1450
      const production = parseFloat(value) || 0;
      const remaining = parseFloat(formData.remaining) || 0;
      const productionLimit = remaining + 1450;
      
      if (production > productionLimit) {
        alert(`Production cannot exceed ${productionLimit} (Remaining + 1450 buffer)`);
        return;
      }
      
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleBatchNumberChange = (event, value) => {
    setFormData(prev => ({
      ...prev,
      batch_number: value || ''
    }));
    
    if (value) {
      fetchPartDetails(value);
    }
  };

  const handleBatchInputChange = (event, value) => {
    fetchBatchSuggestions(value);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedLine('');
    setSelectedShift('');
    setShowFullForm(false);
  };

  // Submit form data
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate machine status is selected
    if (!formData.machine_status) {
      alert('Please select machine status');
      return;
    }
    
    try {
      const entryData = {
        ...formData,
        date: currentDate.format('YYYY-MM-DD'),
        line: selectedLine,
        shift: selectedShift
      };
      
      await axios.post('http://192.168.1.199:8001/forging/forgingcheq/', entryData);

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
    <Box sx={{ 
      p: 3, 
      maxWidth: 1200, 
      margin: '0 auto',
      backgroundColor: '#f9f9f9',
      minHeight: '100vh'
    }}>
      {/* Header Section */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 4,
        p: 3,
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
          Forging Production Tracker
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
            disabled={!allShiftsCompleted}
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
            {allShiftsCompleted ? 'Start Next Day →' : 'Complete All Entries First'}
          </Button>
        </Box>
      </Box>

      {/* Progress Indicator */}
      {!allShiftsCompleted && missingEntries.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            {missingEntries.length} shifts remaining for {currentDate.format('DD MMMM YYYY')}
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
          maxWidth: 800,
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
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Downtime (minutes)"
                      name="downtime_minutes"
                      type="number"
                      value={formData.downtime_minutes}
                      onChange={handleInputChange}
                      required
                    />
                  </Grid>
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

              {/* Show full form only when machine is running */}
              {showFullForm && (
                <>
                  <Grid item xs={12}>
                    <Autocomplete
                      freeSolo
                      options={batchSuggestions}
                      loading={loadingBatchSuggestions}
                      value={formData.batch_number}
                      onChange={handleBatchNumberChange}
                      onInputChange={handleBatchInputChange}
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

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Component"
                      name="component"
                      value={formData.component}
                      InputProps={{
                        readOnly: true,
                      }}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Customer"
                      name="customer"
                      value={formData.customer}
                      InputProps={{
                        readOnly: true,
                      }}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Slug Weight"
                      name="slug_weight"
                      value={formData.slug_weight}
                      InputProps={{
                        readOnly: true,
                      }}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="RM Grade"
                      name="rm_grade"
                      value={formData.rm_grade}
                      InputProps={{
                        readOnly: true,
                      }}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Heat Number"
                      name="heat_number"
                      value={formData.heat_number}
                      InputProps={{
                        readOnly: true,
                      }}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Line Incharge"
                      name="line_incharge"
                      value={formData.line_incharge}
                      onChange={handleInputChange}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Foreman"
                      name="forman"
                      value={formData.forman}
                      onChange={handleInputChange}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Target"
                      name="target"
                      type="number"
                      value={formData.target}
                      InputProps={{
                        readOnly: true,
                      }}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Total Production"
                      name="total_production"
                      type="number"
                      value={formData.total_production}
                      InputProps={{
                        readOnly: true,
                      }}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Remaining"
                      name="remaining"
                      type="number"
                      value={formData.remaining}
                      InputProps={{
                        readOnly: true,
                      }}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Production"
                      name="production"
                      type="number"
                      value={formData.production}
                      onChange={handleInputChange}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Rework"
                      name="rework"
                      type="number"
                      value={formData.rework}
                      onChange={handleInputChange}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Up Setting"
                      name="up_setting"
                      type="number"
                      value={formData.up_setting}
                      onChange={handleInputChange}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Half Piercing"
                      name="half_piercing"
                      type="number"
                      value={formData.half_piercing}
                      onChange={handleInputChange}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Full Piercing"
                      name="full_piercing"
                      type="number"
                      value={formData.full_piercing}
                      onChange={handleInputChange}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Ring Rolling"
                      name="ring_rolling"
                      type="number"
                      value={formData.ring_rolling}
                      onChange={handleInputChange}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Sizing"
                      name="sizing"
                      type="number"
                      value={formData.sizing}
                      onChange={handleInputChange}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Overheat"
                      name="overheat"
                      type="number"
                      value={formData.overheat}
                      onChange={handleInputChange}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Bar Crack Pcs"
                      name="bar_crack_pcs"
                      type="number"
                      value={formData.bar_crack_pcs}
                      onChange={handleInputChange}
                    />
                  </Grid>
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
                    <TextField
                      fullWidth
                      label="Reason for Low Production"
                      name="reason_for_low_production"
                      multiline
                      rows={2}
                      value={formData.reason_for_low_production}
                      onChange={handleInputChange}
                    />
                  </Grid>
                </>
              )}

              <Grid item xs={12}>
                <Box display="flex" justifyContent="flex-end" mt={2}>
                  <Button 
                    variant="outlined" 
                    onClick={handleCloseModal}
                    style={{ marginRight: '10px' }}
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
  );
};

export default ForgingDataEntry;