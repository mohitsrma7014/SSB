import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import {
  Container,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Tabs,
  Tab,
  Box,
  Grid,
  Card,
  CardContent
} from '@mui/material';
import { ExpandMore, Person, Group, Schedule, Today, Event, Work, AccessTime, TimerOff, CalendarToday } from '@mui/icons-material';

const App = () => {
  const now = new Date();

// Get the first day of the current month
const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

// Now initialize state
const [startDate, setStartDate] = useState(firstDayOfMonth);
const [endDate, setEndDate] = useState(now);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const startStr = startDate.toISOString().replace('T', ' ').split('.')[0];
      const endStr = endDate.toISOString().replace('T', ' ').split('.')[0];
      
      const response = await axios.get(
        `http://127.0.0.1:8000/test2/get_employee_attendance/?start=${startStr}&end=${endStr}`
      );
      
      setData(response.data);
    } catch (err) {
      setError(err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          Employee Attendance Dashboard
        </Typography>
        
        <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <DatePicker
              selected={startDate}
              onChange={(date) => setStartDate(date)}
              selectsStart
              startDate={startDate}
              endDate={endDate}
              customInput={<TextField label="Start Date" variant="outlined" fullWidth />}
              showTimeSelect
              timeFormat="HH:mm"
              timeIntervals={15}
              dateFormat="MMMM d, yyyy h:mm aa"
            />
            
            <DatePicker
              selected={endDate}
              onChange={(date) => setEndDate(date)}
              selectsEnd
              startDate={startDate}
              endDate={endDate}
              minDate={startDate}
              customInput={<TextField label="End Date" variant="outlined" fullWidth />}
              showTimeSelect
              timeFormat="HH:mm"
              timeIntervals={15}
              dateFormat="MMMM d, yyyy h:mm aa"
            />
            
            <Button
              variant="contained"
              onClick={fetchData}
              disabled={loading}
              sx={{ height: 56, px: 4 }}
            >
              {loading ? <CircularProgress size={24} /> : 'Fetch Data'}
            </Button>
          </Box>
        </Paper>
      </motion.div>

      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <Paper elevation={3} sx={{ p: 3, mb: 4, bgcolor: 'error.light' }}>
            <Typography color="error">{error}</Typography>
          </Paper>
        </motion.div>
      )}

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress size={60} />
        </Box>
      )}

      {data && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Paper elevation={3} sx={{ mb: 4 }}>
            <Tabs value={activeTab} onChange={handleTabChange} variant="fullWidth">
              <Tab label="Registered Employees" icon={<Person />} />
              <Tab label="Unregistered Employees" icon={<Group />} />
              <Tab label="Summary" icon={<Schedule />} />
            </Tabs>
          </Paper>

          {activeTab === 0 && <RegisteredEmployees data={data.registered_employees} />}
          {activeTab === 1 && <UnregisteredEmployees data={data.unregistered_employees} />}
          {activeTab === 2 && <SummaryView data={data} startDate={startDate} endDate={endDate} />}
        </motion.div>
      )}
    </Container>
  );
};

const RegisteredEmployees = ({ data }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {data.map((employee) => (
        <EmployeeCard key={employee.emp_code} employee={employee} />
      ))}
    </motion.div>
  );
};

const EmployeeCard = ({ employee }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <Accordion
      expanded={expanded}
      onChange={() => setExpanded(!expanded)}
      sx={{ mb: 2 }}
      component={motion.div}
      layout
    >
      <AccordionSummary expandIcon={<ExpandMore />}>
        <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6" component="div">
              {employee.name} ({employee.emp_code})
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {employee.designation} | {employee.department}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip
              label={employee.default_shift}
              color={employee.default_shift === 'rotational' ? 'secondary' : 
                    employee.default_shift.toLowerCase() === 'night' ? 'warning' : 'primary'}
              size="small"
            />
            <Chip
              label={`Work Hours: ${employee.working_hours}`}
              color="info"
              size="small"
            />
          </Box>
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        <Box sx={{ mb: 3 }}>
          <EmployeeSummaryStats summary={employee.attendance_summary} />
        </Box>
        <AttendanceTable attendance={employee.attendance_by_date} />
      </AccordionDetails>
    </Accordion>
  );
};

const EmployeeSummaryStats = ({ summary }) => {
  return (
    <Grid container spacing={2}>
      <Grid item xs={12} sm={6} md={4} lg={2}>
        <StatCard 
          title="Total Days" 
          value={summary.total_days} 
          icon={<Today fontSize="large" />} 
          color="primary" 
        />
      </Grid>
      <Grid item xs={12} sm={6} md={4} lg={2}>
        <StatCard 
          title="Sundays" 
          value={summary.total_sundays} 
          icon={<Event fontSize="large" />} 
          color="secondary" 
        />
      </Grid>
      <Grid item xs={12} sm={6} md={4} lg={2}>
        <StatCard 
          title="Working Days" 
          value={summary.working_days} 
          icon={<Work fontSize="large" />} 
          color="success" 
        />
      </Grid>
      <Grid item xs={12} sm={6} md={4} lg={2}>
        <StatCard 
          title="Leaves" 
          value={summary.total_leaves} 
          icon={<CalendarToday fontSize="large" />} 
          color="error" 
        />
      </Grid>
      <Grid item xs={12} sm={6} md={4} lg={2}>
        <StatCard 
          title="Total Worked" 
          value={summary.total_worked} 
          icon={<AccessTime fontSize="large" />} 
          color="info" 
          isTime
        />
      </Grid>
      <Grid item xs={12} sm={6} md={4} lg={2}>
        <StatCard 
          title="Overtime" 
          value={summary.total_overtime} 
          icon={<TimerOff fontSize="large" />} 
          color="warning" 
          isTime
        />
      </Grid>
    </Grid>
  );
};

const StatCard = ({ title, value, icon, color, isTime = false }) => {
  return (
    <Card sx={{ height: '100%', borderLeft: `4px solid`, borderColor: `${color}.main` }}>
      <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          {icon}
          <Typography variant="subtitle1" color="text.secondary">
            {title}
          </Typography>
        </Box>
        <Typography variant="h5" color={`${color}.main`}>
          {isTime ? value : value}
        </Typography>
      </CardContent>
    </Card>
  );
};

const AttendanceTable = ({ attendance }) => {
  const dates = Object.keys(attendance).sort();

  const getStatusColor = (status) => {
    switch(status) {
      case 'Completed':
        return 'success';
      case 'Present':
        return 'primary';
      case 'Sunday':
        return 'secondary';
      case 'Incomplete':
        return 'warning';
      case 'Absent':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <TableContainer component={Paper} elevation={0} sx={{ maxHeight: 400, overflow: 'auto' }}>
      <Table stickyHeader size="small">
        <TableHead>
          <TableRow>
            <TableCell>Date</TableCell>
            <TableCell>Shift</TableCell>
            <TableCell>First In</TableCell>
            <TableCell>Last Out</TableCell>
            <TableCell>Worked</TableCell>
            <TableCell>Overtime</TableCell>
            <TableCell>Shortfall</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Logs</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {dates.map((date) => {
            const dayData = attendance[date];
            const isNightShift = dayData.shift && dayData.shift.toLowerCase() === 'night';
            
            return (
              <TableRow 
                key={date} 
                hover
                sx={{ 
                  backgroundColor: isNightShift ? 'rgba(255, 152, 0, 0.08)' : 'inherit',
                  '& .MuiTableCell-root': {
                    color: isNightShift ? 'warning.dark' : 'inherit'
                  }
                }}
              >
                <TableCell>{date}</TableCell>
                <TableCell>
                  <Chip 
                    label={dayData.shift || '-'} 
                    size="small" 
                    color={isNightShift ? 'warning' : 'default'}
                  />
                </TableCell>
                <TableCell>{dayData.first_in || '-'}</TableCell>
                <TableCell>{dayData.last_out || '-'}</TableCell>
                <TableCell>{dayData.worked_duration}</TableCell>
                <TableCell>{dayData.overtime}</TableCell>
                <TableCell>{dayData.shortfall}</TableCell>
                <TableCell>
                  <Chip
                    label={dayData.status}
                    color={getStatusColor(dayData.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => console.log(dayData.logs)}
                    disabled={!dayData.logs || dayData.logs.length === 0}
                  >
                    View ({dayData.logs?.length || 0})
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

const UnregisteredEmployees = ({ data }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {data.map((employee) => (
        <Paper key={employee.emp_code} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Unregistered Employee: {employee.emp_code}
          </Typography>
          <Divider sx={{ my: 2 }} />
          <AttendanceTable attendance={employee.attendance_by_date} />
        </Paper>
      ))}
    </motion.div>
  );
};

const SummaryView = ({ data, startDate, endDate }) => {
  const registeredCount = data.registered_employees.length;
  const unregisteredCount = data.unregistered_employees.length;
  
  // Calculate totals across all registered employees
  const totals = {
    total_days: 0,
    total_sundays: 0,
    total_leaves: 0,
    total_leaves_with_sunday: 0,
    working_days: 0,
    total_overtime: '00:00:00',
    total_shortfall: '00:00:00',
    total_worked: '00:00:00'
  };

  data.registered_employees.forEach(emp => {
    totals.total_days += emp.attendance_summary.total_days;
    totals.total_sundays += emp.attendance_summary.total_sundays;
    totals.total_leaves += emp.attendance_summary.total_leaves;
    totals.total_leaves_with_sunday += emp.attendance_summary.total_leaves_with_sunday;
    totals.working_days += emp.attendance_summary.working_days;
    // Need to sum up timedeltas for these
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
        Date Range: {startDate.toLocaleDateString()} to {endDate.toLocaleDateString()}
      </Typography>
      
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            title="Registered Employees"
            value={registeredCount}
            color="primary"
            icon={<Person fontSize="large" />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            title="Unregistered Employees"
            value={unregisteredCount}
            color="secondary"
            icon={<Group fontSize="large" />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            title="Total Working Days"
            value={totals.working_days}
            color="success"
            icon={<Work fontSize="large" />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            title="Total Leaves"
            value={totals.total_leaves}
            color="error"
            icon={<CalendarToday fontSize="large" />}
          />
        </Grid>
      </Grid>
      
      <Typography variant="h5" gutterBottom sx={{ mt: 4, mb: 2 }}>
        Employee Statistics
      </Typography>
      
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <RegisteredEmployees data={data.registered_employees} />
      </Paper>
    </motion.div>
  );
};

const SummaryCard = ({ title, value, color, icon }) => {
  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderLeft: `4px solid`,
        borderColor: `${color}.main`,
        transition: 'transform 0.2s',
        '&:hover': {
          transform: 'translateY(-5px)'
        }
      }}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
          {icon}
          <Typography variant="h6" component="div">
            {title}
          </Typography>
        </Box>
        <Typography variant="h3" component="div" color={`${color}.main`}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default App;