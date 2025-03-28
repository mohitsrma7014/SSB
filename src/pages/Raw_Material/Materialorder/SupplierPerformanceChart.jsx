import { useState, useEffect } from 'react';
import axios from 'axios';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { 
  Card, Grid, MenuItem, Select, Typography, LinearProgress, 
  Table, TableBody, TableCell, TableContainer, TableHead, 
  TableRow, Paper, Divider, Chip, Tabs, Tab, Box
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Sidebar } from "../../Navigation/Sidebar";
import DashboardHeader from "../../Navigation/DashboardHeader";
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import StarHalfIcon from '@mui/icons-material/StarHalf';

// Create a custom theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    success: {
      main: '#4caf50',
    },
    warning: {
      main: '#ff9800',
    },
    error: {
      main: '#f44336',
    },
    info: {
      main: '#2196f3',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
});

// Styled components
const DashboardContainer = styled('div')({
  padding: '2px',
  backgroundColor: '#f5f7fa',
  minHeight: '100vh',
});

const PerformanceCard = styled(Card)({
  padding: '20px',
  borderRadius: '12px',
  boxShadow: '0 4px 20px 0 rgba(0,0,0,0.08)',
});

const MetricCard = styled(Card)({
  padding: '16px',
  borderRadius: '8px',
  boxShadow: '0 2px 10px 0 rgba(0,0,0,0.05)',
  height: '100%',
});

const StyledSelect = styled(Select)({
  backgroundColor: '#fff',
  borderRadius: '8px',
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: '#e0e0e0',
  },
});

const TabPanel = (props) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`chart-tabpanel-${index}`}
      aria-labelledby={`chart-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const a11yProps = (index) => {
  return {
    id: `chart-tab-${index}`,
    'aria-controls': `chart-tabpanel-${index}`,
  };
}

// Month names for display
const monthNames = ["January", "February", "March", "April", "May", "June", 
                   "July", "August", "September", "October", "November", "December"];

const getCurrentMonthName = () => {
  const date = new Date();
  return monthNames[date.getMonth()];
};
const StarRating = ({ rating, max = 5 }) => {
  return (
    <Box display="flex" alignItems="center">
      {[...Array(max)].map((_, i) => (
        <Box key={i} color={i < rating ? '#ffc107' : '#e0e0e0'}>
          {i < Math.floor(rating) ? (
            <StarIcon fontSize="small" />
          ) : (
            i < rating ? (
              <StarHalfIcon fontSize="small" />
            ) : (
              <StarBorderIcon fontSize="small" />
            )
          )}
        </Box>
      ))}
      <Typography variant="body2" sx={{ ml: 1, fontWeight: 600 }}>
        {rating.toFixed(1)}
      </Typography>
    </Box>
  );
};

const SupplierPerformanceDashboard = () => {
  const [supplier, setSupplier] = useState('Aarti');
  const [year, setYear] = useState(new Date().getFullYear());
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [suppliers, setSuppliers] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthName());
  const [tabValue, setTabValue] = useState(0);

  // Fetch suppliers list
  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const response = await axios.get('http://192.168.1.199:8001/raw_material/suppliers/');
        setSuppliers(response.data);
      } catch (err) {
        console.error('Error fetching suppliers:', err);
      }
    };
    fetchSuppliers();
  }, []);

  // Fetch performance data
  useEffect(() => {
    const fetchData = async () => {
      if (!supplier) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const response = await axios.get(
          `http://192.168.1.199:8001/raw_material/api/supplier-performance/?supplier=${encodeURIComponent(supplier)}&year=${year}`
        );
        // Convert month numbers to month names and adjust scores
        const formattedData = response.data.map(item => ({
          ...item,
          month: monthNames[parseInt(item.month) - 1] || item.month,
          // Convert percentage scores to 1-5 scale for charts
          quality_score: item.no_order_month ? 5 : item.quality_score / 20,
          delivery_score: item.no_order_month ? 5 : item.delivery_score / 20,
          resolution_score: item.no_order_month ? 5 : item.resolution_score / 20,
          // Keep original values for display
          original_quality: item.quality_score,
          original_delivery: item.delivery_score,
          original_resolution: item.resolution_score
        }));
        setData(formattedData);
      } catch (err) {
        setError('Failed to fetch performance data. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [supplier, year]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  const pulseAnimation = {
    '@keyframes pulse': {
      '0%': { transform: 'scale(1)' },
      '50%': { transform: 'scale(1.1)' },
      '100%': { transform: 'scale(1)' },
    },
    animation: 'pulse 2s infinite',
  };
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
      
        const toggleSidebar = () => {
          setIsSidebarVisible(!isSidebarVisible);
        };
        const pageTitle = "Supplier Performance Dashboard"; // Set the page title here

  // Function to create chart options with data labels
  const createChartOptions = (title, seriesConfig, yAxisTitle, showDataLabels = true) => {
    return {
      chart: {
        type: 'column',
        height: '400px',
        backgroundColor: 'transparent',
      },
      title: {
        text: title,
        align: 'left',
        style: {
          fontSize: '16px',
          fontWeight: '500'
        }
      },
      xAxis: {
        categories: data.map(item => item.month),
        crosshair: true,
      },
      yAxis: {
        title: {
          text: yAxisTitle
        },
        min: 0,
        max: 5,
        gridLineWidth: 0,
      },
      tooltip: {
        shared: true,
        formatter: function() {
          let tooltip = `<b>${this.x}</b><br>`;
          const monthData = data.find(item => item.month === this.x);
          
          this.points.forEach(point => {
            let value;
            if (point.series.name.includes('Quality')) {
              value = monthData?.no_order_month ? '100%' : `${monthData?.original_quality}%`;
            } else if (point.series.name.includes('Delivery')) {
              value = monthData?.no_order_month ? '100%' : `${monthData?.original_delivery}%`;
            } else if (point.series.name.includes('Resolution')) {
              value = monthData?.no_order_month ? '100%' : `${monthData?.original_resolution}%`;
            } else if (point.series.name.includes('%')) {
              value = `${point.y.toFixed(1)}%`;
            } else {
              value = point.y.toFixed(1);
            }
            tooltip += `${point.series.name}: <b>${value}</b><br>`;
          });
          return tooltip;
        }
      },
      plotOptions: {
        column: {
          borderRadius: 4,
          borderWidth: 0,
          pointPadding: 0.2,
          groupPadding: 0.1,
          cursor: 'pointer',
          dataLabels: {
            enabled: showDataLabels,
            format: '{point.y:.1f}',
            color: '#333',
            style: {
              textOutline: 'none'
            }
          },
          point: {
            events: {
              click: function() {
                setSelectedMonth(this.category);
              }
            }
          }
        }
      },
      series: seriesConfig,
      credits: {
        enabled: false
      }
    };
  };

  // Chart configurations
  const performanceChartOptions = createChartOptions(
    'Performance Rating Over Time',
    [{
      name: 'Performance Rating',
      data: data.map(item => item.rating),
      color: '#36a2eb',
    }],
    'Rating (1-5)'
  );

  const qualityChartOptions = createChartOptions(
    'Quality Metrics Over Time',
    [{
      name: 'Quality Score',
      data: data.map(item => item.quality_score),
      color: '#4bc0c0',
    }],
    'Score (1-5)'
  );

  const deliveryChartOptions = {
    ...createChartOptions(
      'Delivery Performance Over Time',
      [{
        name: 'Delivery Score',
        data: data.map(item => item.delivery_score),
        color: '#9966ff',
      }, {
        name: 'On-Time Delivery %',
        data: data.map(item => item.no_order_month ? 100 : item.on_time_delivery_percentage),
        color: '#ff9f40',
        type: 'spline',
        dataLabels: {
          enabled: false
        }
      }],
      'Score (1-5) / Percentage (%)',
      false
    ),
    yAxis: [{
      title: {
        text: 'Score (1-5)'
      },
      min: 0,
      max: 5,
      opposite: false,
      gridLineWidth: 0,
    }, {
      title: {
        text: 'Percentage (%)'
      },
      min: 0,
      max: 100,
      opposite: true,
    }],
    series: [{
      name: 'Delivery Score',
      data: data.map(item => item.delivery_score),
      color: '#9966ff',
      yAxis: 0,
      dataLabels: {
        enabled: true,
        format: '{point.y:.1f}'
      }
    }, {
      name: 'On-Time Delivery %',
      data: data.map(item => item.no_order_month ? 100 : item.on_time_delivery_percentage),
      color: '#ff9f40',
      yAxis: 1,
      type: 'spline',
      tooltip: {
        valueSuffix: '%'
      }
    }]
  };

  const resolutionChartOptions = {
    ...createChartOptions(
      'Complaint Resolution Over Time',
      [{
        name: 'Resolution Score',
        data: data.map(item => item.resolution_score),
        color: '#ff6384',
      }, {
        name: 'Resolution %',
        data: data.map(item => item.no_order_month ? 100 : item.complaint_resolution_percentage),
        color: '#ffcd56',
        type: 'spline'
      }, {
        name: 'Complaints',
        data: data.map(item => item.complaints_count),
        color: '#c9cbcf',
        type: 'column',
        dataLabels: {
          enabled: true
        }
      }],
      'Score (1-5) / Percentage (%) / Count',
      false
    ),
    yAxis: [{
      title: {
        text: 'Score (1-5) / Count'
      },
      min: 0,
      max: 5,
      opposite: false,
      gridLineWidth: 0,
    }, {
      title: {
        text: 'Percentage (%)'
      },
      min: 0,
      max: 100,
      opposite: true,
    }],
    plotOptions: {
      column: {
        grouping: true,
        borderRadius: 4,
        borderWidth: 0,
        pointPadding: 0.2,
        groupPadding: 0.1,
        cursor: 'pointer',
        dataLabels: {
          enabled: true,
          format: '{point.y:.0f}',
          color: '#333',
          style: {
            textOutline: 'none'
          }
        },
        point: {
          events: {
            click: function() {
              setSelectedMonth(this.category);
            }
          }
        }
      }
    }
  };

  // Get current month metrics
  const currentMonthData = selectedMonth 
    ? data.find(item => item.month === selectedMonth) 
    : data.length > 0 
      ? data.find(item => item.month === getCurrentMonthName()) || data[data.length - 1]
      : null;

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
    <div className={`flex flex-col flex-grow transition-all duration-300 ${isSidebarVisible ? "ml-64" : "ml-0"}`}>
      <DashboardHeader isSidebarVisible={isSidebarVisible} toggleSidebar={toggleSidebar} title={pageTitle} />

      <main className="flex flex-col mt-16 justify-center flex-grow  relative">
    <ThemeProvider theme={theme}>
      <DashboardContainer>
       
        
        <Grid container spacing={1} sx={{ mb: 3 }}>
          <Grid item xs={12} md={8}>
            <PerformanceCard>
              <Grid container spacing={2} alignItems="center" sx={{ mb: 1 }}>
                <Grid item xs={12} sm={6} md={4} >
                  <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 500, color: '#5f6c7b' }}>
                    Supplier
                  </Typography>
                  <StyledSelect
                    value={supplier}
                    onChange={(e) => setSupplier(e.target.value)}
                    fullWidth
                    variant="outlined"
                    
                  >
                    {suppliers.map((sup) => (
                      <MenuItem key={sup.id} value={sup.name}>
                        {sup.name}
                      </MenuItem>
                    ))}
                  </StyledSelect>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 500, color: '#5f6c7b' }}>
                    Year
                  </Typography>
                  <StyledSelect
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    fullWidth
                    variant="outlined"
                  >
                    {[2023, 2024, 2025, 2026].map((y) => (
                      <MenuItem key={y} value={y}>
                        {y}
                      </MenuItem>
                    ))}
                  </StyledSelect>
                </Grid>
              </Grid>

              <Typography variant="h6" component="h2" sx={{ fontWeight: 600, mb: 2, color: '#3a4a5a' }}>
                {supplier} Performance - {year}
              </Typography>

              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={tabValue} onChange={handleTabChange} aria-label="performance charts">
                  <Tab label="Performance" {...a11yProps(0)} />
                  <Tab label="Quality" {...a11yProps(1)} />
                  <Tab label="Delivery" {...a11yProps(2)} />
                  <Tab label="Resolution" {...a11yProps(3)} />
                </Tabs>
              </Box>

              {loading ? (
                <div style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <LinearProgress color="primary" style={{ width: '100%' }} />
                </div>
              ) : error ? (
                <div style={{ 
                  height: '400px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  backgroundColor: '#fff8f8',
                  borderRadius: '8px',
                  border: '1px solid #ffcdd2',
                  padding: '20px'
                }}>
                  <Typography color="error">{error}</Typography>
                </div>
              ) : (
                <>
                  <TabPanel value={tabValue} index={0}>
                    <div style={{ height: '400px' }}>
                      <HighchartsReact 
                        highcharts={Highcharts}
                        options={performanceChartOptions}
                        containerProps={{ style: { height: '100%' } }}
                      />
                    </div>
                  </TabPanel>
                  <TabPanel value={tabValue} index={1}>
                    <div style={{ height: '400px' }}>
                      <HighchartsReact 
                        highcharts={Highcharts}
                        options={qualityChartOptions}
                        containerProps={{ style: { height: '100%' } }}
                      />
                    </div>
                  </TabPanel>
                  <TabPanel value={tabValue} index={2}>
                    <div style={{ height: '400px' }}>
                      <HighchartsReact 
                        highcharts={Highcharts}
                        options={deliveryChartOptions}
                        containerProps={{ style: { height: '100%' } }}
                      />
                    </div>
                  </TabPanel>
                  <TabPanel value={tabValue} index={3}>
                    <div style={{ height: '400px' }}>
                      <HighchartsReact 
                        highcharts={Highcharts}
                        options={resolutionChartOptions}
                        containerProps={{ style: { height: '100%' } }}
                      />
                    </div>
                  </TabPanel>
                </>
              )}
            </PerformanceCard>
          </Grid>

          {currentMonthData && !loading && !error && (
            <Grid item xs={12} md={4}>
              <PerformanceCard>
                <Typography variant="h6" component="h2" sx={{ fontWeight: 600, mb: 1, color: '#3a4a5a' }}>
                  {selectedMonth} Metrics
                </Typography>
                
                <Grid container spacing={2}>
  {/* Overall Rating Card - Takes full height on left */}
  <Grid item xs={6}>
    <MetricCard sx={{ height: '100%' }}>
      <Typography variant="subtitle2" color="textSecondary">
        Overall Rating
      </Typography>
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: 'calc(100% - 80px)' // Adjust this to fit your content
        }}
      >
        {currentMonthData.is_future_month || currentMonthData.no_order_month ? (
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            -
          </Typography>
        ) : (
          <>
            <Box display="flex" alignItems="center">
              {[...Array(5)].map((_, i) => (
                <Box 
                  key={i} 
                  sx={{ 
                    color: i < currentMonthData.rating ? '#ffc107' : '#e0e0e0',
                    fontSize: '2.5rem',
                    lineHeight: 1
                  }}
                >
                  {i < Math.floor(currentMonthData.rating) ? (
                    <StarIcon fontSize="large" />
                  ) : (
                    i < currentMonthData.rating ? (
                      <StarHalfIcon fontSize="large" />
                    ) : (
                      <StarBorderIcon fontSize="large" />
                    )
                  )}
                </Box>
              ))}
            </Box>
            <Typography 
              variant="h3" 
              sx={{ 
                fontWeight: 700, 
                mt: 1,
                color: 
                  currentMonthData.rating >= 4 ? '#4caf50' : 
                  currentMonthData.rating >= 2.5 ? '#2196f3' : '#f44336'
              }}
            >
              {currentMonthData.rating.toFixed(1)}
            </Typography>
          </>
        )}
      </Box>
      <LinearProgress 
        variant="determinate" 
        value={currentMonthData.is_future_month || currentMonthData.no_order_month 
          ? 0 
          : (currentMonthData.rating / 5) * 100} 
        sx={{ height: 8, borderRadius: 4 }}
        color={
          currentMonthData.rating >= 4 ? 'success' : 
          currentMonthData.rating >= 2.5 ? 'primary' : 'error'
        }
      />
    </MetricCard>
  </Grid>
  
  {/* Right side - Three cards stacked vertically */}
  <Grid item xs={6}>
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%',
      gap: 1 // This replaces spacing for the inner Grid
    }}>
      {/* Quality Score Card */}
      <MetricCard sx={{ flex: 1 }}>
        <Typography variant="subtitle2" color="textSecondary">
          Quality Score
        </Typography>
        <Box sx={{ }}>
          <StarRating 
            rating={currentMonthData.is_future_month ? 0 : 
                   currentMonthData.no_order_month ? 5 : 
                   currentMonthData.quality_score}
          />
        </Box>
        <LinearProgress 
          variant="determinate" 
          value={currentMonthData.is_future_month ? 0 : 
                currentMonthData.no_order_month ? 100 : 
                (currentMonthData.original_quality / 100) * 100} 
          sx={{ height: 6, borderRadius: 3 }}
          color={
            currentMonthData.no_order_month ? 'success' :
            currentMonthData.original_quality >= 80 ? 'success' : 
            currentMonthData.original_quality >= 50 ? 'primary' : 'error'
          }
        />
      </MetricCard>

      {/* Delivery Score Card */}
      <MetricCard sx={{ flex: 1 }}>
        <Typography variant="subtitle2" color="textSecondary">
          Delivery Score
        </Typography>
        <Box sx={{  }}>
          <StarRating 
            rating={currentMonthData.is_future_month ? 0 : 
                   currentMonthData.no_order_month ? 5 : 
                   currentMonthData.delivery_score}
          />
        </Box>
        <LinearProgress 
          variant="determinate" 
          value={currentMonthData.is_future_month ? 0 : 
                currentMonthData.no_order_month ? 100 : 
                (currentMonthData.original_delivery / 100) * 100} 
          sx={{ height: 6, borderRadius: 3 }}
          color={
            currentMonthData.no_order_month ? 'success' :
            currentMonthData.original_delivery >= 80 ? 'success' : 
            currentMonthData.original_delivery >= 50 ? 'primary' : 'error'
          }
        />
      </MetricCard>

      {/* Resolution Score Card */}
      <MetricCard sx={{ flex: 1 }}>
        <Typography variant="subtitle2" color="textSecondary">
          Resolution Score
        </Typography>
        <Box sx={{ }}>
          <StarRating 
            rating={currentMonthData.is_future_month ? 0 : 
                   currentMonthData.no_order_month ? 5 : 
                   currentMonthData.resolution_score}
          />
        </Box>
        <LinearProgress 
          variant="determinate" 
          value={currentMonthData.is_future_month ? 0 : 
                currentMonthData.no_order_month ? 100 : 
                (currentMonthData.original_resolution / 100) * 100} 
          sx={{ height: 6, borderRadius: 3 }}
          color={
            currentMonthData.no_order_month ? 'success' :
            currentMonthData.original_resolution >= 80 ? 'success' : 
            currentMonthData.original_resolution >= 50 ? 'primary' : 'error'
          }
        />
      </MetricCard>
    </Box>
  </Grid>
 
                  <Grid item xs={12}>
                    <MetricCard>
                      <Typography variant="subtitle2" color="textSecondary" gutterBottom  sx={{ fontWeight: 600 }}>
                        Delivery Performance
                      </Typography>
                      <Grid container spacing={1}>
                        <Grid item xs={4}>
                          <Typography variant="body2">Total</Typography>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {currentMonthData.is_future_month ? '-' : currentMonthData.total_deliveries}
                          </Typography>
                        </Grid>
                        <Grid item xs={4}>
                          <Typography variant="body2">On-Time</Typography>
                          <Typography variant="h6" sx={{ fontWeight: 600, color: '#4caf50' }}>
                            {currentMonthData.is_future_month ? '-' : currentMonthData.on_time_deliveries}
                          </Typography>
                        </Grid>
                        <Grid item xs={4}>
                          <Typography variant="body2">Delayed</Typography>
                          <Typography variant="h6" sx={{ fontWeight: 600, color: '#f44336' }}>
                            {currentMonthData.is_future_month ? '-' : currentMonthData.delayed_deliveries}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} >
                          <Typography variant="body2">On-Time %</Typography>
                          <LinearProgress 
                            variant="determinate" 
                            value={currentMonthData.is_future_month || currentMonthData.no_order_month 
                              ? 0 
                              : currentMonthData.on_time_delivery_percentage} 
                            sx={{ height: 6, borderRadius: 3, mt: 1 }}
                            color={
                              currentMonthData.no_order_month ? 'success' :
                              currentMonthData.on_time_delivery_percentage >= 90 ? 'success' : 
                              currentMonthData.on_time_delivery_percentage >= 70 ? 'primary' : 'error'
                            }
                          />
                          <Typography variant="body2" align="right" sx={{ mt: 0.5 }}>
                            {currentMonthData.is_future_month || currentMonthData.no_order_month 
                              ? '-' 
                              : `${currentMonthData.on_time_delivery_percentage.toFixed(1)}%`}
                          </Typography>
                        </Grid>
                      </Grid>
                    </MetricCard>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <MetricCard>
                      <Typography variant="subtitle2" color="textSecondary" gutterBottom sx={{ fontWeight: 600 }}>
                        Complaint Resolution
                      </Typography>
                      <Grid container spacing={1}>
                        <Grid item xs={6}>
                          <Typography variant="body2">Total Complaints</Typography>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {currentMonthData.is_future_month ? '-' : currentMonthData.complaints_count}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2">Resolution %</Typography>
                          <LinearProgress 
                            variant="determinate" 
                            value={currentMonthData.is_future_month || currentMonthData.no_order_month 
                              ? 0 
                              : currentMonthData.complaint_resolution_percentage} 
                            sx={{ height: 6, borderRadius: 3, mt: 1 }}
                            color={
                              currentMonthData.no_order_month ? 'success' :
                              currentMonthData.complaint_resolution_percentage >= 90 ? 'success' : 
                              currentMonthData.complaint_resolution_percentage >= 70 ? 'primary' : 'error'
                            }
                          />
                          <Typography variant="body2" align="right" sx={{ mt: 0.5 }}>
                            {currentMonthData.is_future_month || currentMonthData.no_order_month 
                              ? '-' 
                              : `${currentMonthData.complaint_resolution_percentage.toFixed(1)}%`}
                          </Typography>
                        </Grid>
                      </Grid>
                    </MetricCard>
                  </Grid>
                </Grid>
              </PerformanceCard>
            </Grid>
          )}
        </Grid>

        {data.length > 0 && !loading && !error && (
          <PerformanceCard>
            <Typography variant="h6" component="h2" sx={{ fontWeight: 600, mb: 3, color: '#3a4a5a' }}>
              Detailed Monthly Metrics
            </Typography>
            
            <TableContainer component={Paper} sx={{ borderRadius: '8px', overflow: 'hidden' }}>
              <Table sx={{ minWidth: 650 }} aria-label="supplier performance table">
                <TableHead sx={{ backgroundColor: '#f8f9fa' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Month</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Overall</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Quality</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Delivery</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Resolution</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Complaints</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Total Deliveries</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>On-Time</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Delayed</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>On-Time %</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Resolution %</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.map((item, index) => (
                    <TableRow 
                      key={index} 
                      hover 
                      selected={selectedMonth === item.month}
                      onClick={() => setSelectedMonth(item.month)}
                      sx={{ 
                        cursor: 'pointer',
                        '&:last-child td, &:last-child th': { border: 0 },
                        backgroundColor: selectedMonth === item.month ? '#f0f7ff' : 'inherit'
                      }}
                    >
                      <TableCell component="th" scope="row" sx={{ fontWeight: selectedMonth === item.month ? 600 : 'normal' }}>
                        {item.month}
                      </TableCell>
                      <TableCell align="right">
                        {item.is_future_month || item.no_order_month ? '-' : (
                          <Chip 
                            label={item.rating.toFixed(1)} 
                            size="small" 
                            color={
                              item.rating >= 4 ? 'success' : 
                              item.rating >= 2.5 ? 'primary' : 'error'
                            }
                          />
                        )}
                      </TableCell>
                      {/* In the table cells */}
<TableCell align="right">
  {item.is_future_month ? '-' : 
   item.no_order_month ? (
     <StarRating rating={5} />
   ) : (
     <StarRating rating={item.quality_score} />
   )}
</TableCell>

<TableCell align="right">
  {item.is_future_month ? '-' : 
   item.no_order_month ? (
     <StarRating rating={5} />
   ) : (
     <StarRating rating={item.delivery_score} />
   )}
</TableCell>

<TableCell align="right">
  {item.is_future_month ? '-' : 
   item.no_order_month ? (
     <StarRating rating={5} />
   ) : (
     <StarRating rating={item.resolution_score} />
   )}
</TableCell>
                      <TableCell align="right">
                        {item.is_future_month ? '-' : (
                          <Chip 
                            label={item.complaints_count} 
                            size="small" 
                            color={item.complaints_count === 0 ? 'success' : 'warning'}
                          />
                        )}
                      </TableCell>
                      <TableCell align="right">
                        {item.is_future_month ? '-' : item.total_deliveries}
                      </TableCell>
                      <TableCell align="right">
                        {item.is_future_month ? '-' : (
                          <span style={{ color: '#4caf50', fontWeight: 500 }}>
                            {item.on_time_deliveries}
                          </span>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        {item.is_future_month ? '-' : (
                          <span style={{ color: '#f44336', fontWeight: 500 }}>
                            {item.delayed_deliveries}
                          </span>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        {item.is_future_month || item.no_order_month ? '-' : (
                          <span style={{
                            color: item.on_time_delivery_percentage >= 90 ? '#4caf50' : 
                                  item.on_time_delivery_percentage >= 70 ? '#2196f3' : '#f44336',
                            fontWeight: 500
                          }}>
                            {item.on_time_delivery_percentage.toFixed(1)}%
                          </span>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        {item.is_future_month || item.no_order_month ? '-' : (
                          <span style={{
                            color: item.complaint_resolution_percentage >= 90 ? '#4caf50' : 
                                  item.complaint_resolution_percentage >= 70 ? '#2196f3' : '#f44336',
                            fontWeight: 500
                          }}>
                            {item.complaint_resolution_percentage.toFixed(1)}%
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </PerformanceCard>
        )}
      </DashboardContainer>
    </ThemeProvider>
    </main>
    </div>
    </div>
  );
};

export default SupplierPerformanceDashboard;