import { useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import {
  Paper,
  Typography,
  Grid,
  Divider,
  Tabs,
  Tab,
  Box,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip as MuiTooltip
} from '@mui/material';
import {
  AttachMoney as SalaryIcon,
  Work as WorkIcon,
  Event as CalendarIcon,
  AccessTime as TimeIcon
} from '@mui/icons-material';
import { format, parseISO, isSunday } from 'date-fns';
import EventIcon from '@mui/icons-material/Event';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const SalaryDetails = ({ employee, month, year }) => {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const formatMoney = (value) => {
    const num = Number(value || 0);
    return isNaN(num) ? '0.00' : num.toFixed(2);
  };
  
  const salaryData = {
    labels: ['Basic', 'Overtime', 'Deductions', 'Net Pay'],
    datasets: [
      {
        label: 'Amount (₹)',
        data: [
          employee.attendance_summary?.salary_details?.basic_salary || 0,
          employee.attendance_summary?.salary_details?.overtime_amount || 0,
          employee.attendance_summary?.salary_details?.deductions || 0,
          employee.attendance_summary?.salary_details?.net_pay || 0,
        ],
        backgroundColor: [
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(255, 99, 132, 0.6)',
          'rgba(75, 192, 192, 0.6)',
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(255, 99, 132, 1)',
          'rgba(75, 192, 192, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const attendanceData = {
    labels: ['Working Days', 'Leaves', 'Sundays'],
    datasets: [
      {
        data: [
          employee.attendance_summary?.working_days || 0,
          employee.attendance_summary?.total_leaves || 0,
          employee.attendance_summary?.total_sundays || 0,
        ],
        backgroundColor: [
          'rgba(75, 192, 192, 0.6)',
          'rgba(255, 99, 132, 0.6)',
          'rgba(255, 206, 86, 0.6)',
        ],
        borderColor: [
          'rgba(75, 192, 192, 1)',
          'rgba(255, 99, 132, 1)',
          'rgba(255, 206, 86, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Present': return 'success';
      case 'Absent': return 'error';
      case 'Sunday': return 'warning';
      case 'Holiday': return 'secondary';
      case 'Partial': return 'info';
      default: return 'default';
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        {employee.name} - {employee.department}
      </Typography>
      <Typography color="text.secondary" gutterBottom>
        Employee ID: {employee.emp_code} • {employee.designation}
      </Typography>

      <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 3 }}>
        <Tab label="Summary" />
        <Tab label="Attendance Details" />
        <Tab label="Salary Breakdown" />
      </Tabs>

      {tabValue === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <WorkIcon sx={{ mr: 1 }} /> Attendance Summary
              </Typography>
              <Divider sx={{ my: 1 }} />
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2">Total Days:</Typography>
                  <Typography variant="h6">{employee.attendance_summary?.total_days || 0}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">Working Days:</Typography>
                  <Typography variant="h6">{employee.attendance_summary?.working_days || 0}</Typography>
                </Grid>
              
              <Grid item xs={6}>
                <Typography variant="body2">CL Used:</Typography>
                <Typography variant="h6">
                  {employee.leave_details?.cl_used || 0} / {employee.leave_details?.total_cl || 0}
                </Typography>
              </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">Leaves:</Typography>
                  <Typography variant="h6">{employee.attendance_summary?.total_leaves || 0}</Typography>
                </Grid>
                {/* <Grid item xs={12}>
  <Paper sx={{ p: 2, mt: 2 }}>
    <Typography variant="subtitle1" gutterBottom>
      Leave Details
    </Typography>
    <Divider sx={{ my: 1 }} />
    <Grid container spacing={2}>
      <Grid item xs={4}>
        <Typography variant="body2">Total CL:</Typography>
        <Typography variant="h6">{employee.leave_details?.total_cl || 0}</Typography>
      </Grid>
      <Grid item xs={4}>
        <Typography variant="body2">CL Used:</Typography>
        <Typography variant="h6" color={employee.leave_details?.cl_used ? "error.main" : "text.primary"}>
          {employee.leave_details?.cl_used || 0}
        </Typography>
      </Grid>
      <Grid item xs={4}>
        <Typography variant="body2">CL Remaining:</Typography>
        <Typography variant="h6" color="success.main">
          {employee.leave_details?.cl_remaining || 0}
        </Typography>
      </Grid>
      <Grid item xs={6}>
        <Typography variant="body2">Other Leaves:</Typography>
        <Typography variant="h6">{employee.leave_details?.other_leaves || 0}</Typography>
      </Grid>
      <Grid item xs={6}>
        <Typography variant="body2">Total Leaves:</Typography>
        <Typography variant="h6">{employee.attendance_summary?.total_leaves || 0}</Typography>
      </Grid>
    </Grid>
  </Paper>
</Grid> */}
                <Grid item xs={6}>
                  <Typography variant="body2">Sundays:</Typography>
                  <Typography variant="h6">{employee.attendance_summary?.total_sundays || 0}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">Total Worked:</Typography>
                  <Typography variant="h6">{employee.attendance_summary?.total_worked || 0}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">Overtime:</Typography>
                  <Typography variant="h6" color="success.main">
                    {employee.attendance_summary?.total_overtime || 0}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <SalaryIcon sx={{ mr: 1 }} /> Salary Summary
              </Typography>
              <Divider sx={{ my: 1 }} />
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2">Basic Salary:</Typography>
                  <Typography variant="h6">₹{formatMoney(employee.attendance_summary?.salary_details?.basic_salary)}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">Per Day Salary:</Typography>
                  <Typography variant="h6">₹{formatMoney(employee.attendance_summary?.salary_details?.per_day_salary)}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">Overtime:</Typography>
                  <Typography variant="h6">₹{formatMoney(employee.attendance_summary?.salary_details?.overtime_amount)}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">Deductions:</Typography>
                  <Typography variant="h6" color="error.main">
                    ₹{formatMoney(employee.attendance_summary?.salary_details?.deductions)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">PF:</Typography>
                  <Typography variant="h6">₹{formatMoney(employee.attendance_summary?.salary_details?.pf)}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">ESI:</Typography>
                  <Typography variant="h6">₹{formatMoney(employee.attendance_summary?.salary_details?.esi)}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="body2">Net Pay:</Typography>
                  <Typography variant="h4" color="primary.main">
                    ₹{formatMoney(employee.attendance_summary?.salary_details?.net_pay)}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, height: '100%' }}>
              <Typography variant="subtitle1" gutterBottom>
                Attendance Distribution
              </Typography>
              <Box sx={{ height: 300 }}>
                <Bar
                  data={attendanceData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false,
                      },
                    },
                  }}
                />
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, height: '100%' }}>
              <Typography variant="subtitle1" gutterBottom>
                Salary Distribution
              </Typography>
              <Box sx={{ height: 300 }}>
                <Bar
                  data={salaryData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false,
                      },
                    },
                  }}
                />
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}

      {tabValue === 1 && (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Day</TableCell>
                <TableCell>Shift</TableCell>
                <TableCell>First In</TableCell>
                <TableCell>Last Out</TableCell>
                <TableCell>Worked</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {Object.entries(employee.attendance_by_date || {})
                .sort(([dateA], [dateB]) => new Date(dateA) - new Date(dateB))
                .map(([date, attendance]) => {
                  const dateObj = parseISO(date);
                  return (
                    <TableRow key={date}>
                      <TableCell>{format(dateObj, 'dd MMM yyyy')}</TableCell>
                      <TableCell>{format(dateObj, 'EEEE')}</TableCell>
                      <TableCell>{attendance?.shift || '-'}</TableCell>
                      <TableCell>
                        {attendance?.first_in || '-'}
                        {attendance?.has_manual_entries && (
                          <MuiTooltip title="Manual entry">
                          <Chip label="M" size="small" sx={{ ml: 1 }} />
                        </MuiTooltip>
                        )}
                      </TableCell>
                      <TableCell>{attendance?.last_out || '-'}</TableCell>
                      <TableCell>{attendance?.worked_duration || '-'}</TableCell>
                      <TableCell>
  <Chip
    label={attendance?.status || '-'}
    size="small"
    color={getStatusColor(attendance?.status)}
    {...(attendance?.is_holiday && {
      variant: "outlined",
      title: "Company Holiday"
    })}
  />
  {attendance?.is_holiday && (
    <MuiTooltip title="Company Holiday">
      <EventIcon fontSize="small" color="secondary" sx={{ ml: 1 }} />
    </MuiTooltip>
  )}
</TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {tabValue === 2 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Salary Calculation
              </Typography>
              <Divider sx={{ my: 1 }} />
              <Table size="small">
                <TableBody>
                  <TableRow>
                    <TableCell>Basic Salary</TableCell>
                    <TableCell align="right">₹{formatMoney(employee.attendance_summary?.salary_details?.basic_salary)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Per Day Salary</TableCell>
                    <TableCell align="right">₹{formatMoney(employee.attendance_summary?.salary_details?.per_day_salary)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Working Days</TableCell>
                    <TableCell align="right">{employee.attendance_summary?.working_days || 0}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Base Salary</TableCell>
                    <TableCell align="right">
                      ₹{formatMoney(
                        (employee.attendance_summary?.salary_details?.per_day_salary || 0) * 
                        (employee.attendance_summary?.working_days || 0)
                      )}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Overtime Amount</TableCell>
                    <TableCell align="right">₹{formatMoney(employee.attendance_summary?.salary_details?.overtime_amount)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      <strong>Gross Salary</strong>
                    </TableCell>
                    <TableCell align="right">
                      <strong>₹{formatMoney(employee.attendance_summary?.salary_details?.total_salary)}</strong>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Deductions
              </Typography>
              <Divider sx={{ my: 1 }} />
              <Table size="small">
                <TableBody>
                  <TableRow>
                    <TableCell>Provident Fund (PF)</TableCell>
                    <TableCell align="right">₹{formatMoney(employee.attendance_summary?.salary_details?.pf)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Employee State Insurance (ESI)</TableCell>
                    <TableCell align="right">₹{formatMoney(employee.attendance_summary?.salary_details?.esi)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      <strong>Total Deductions</strong>
                    </TableCell>
                    <TableCell align="right">
                      <strong>₹{formatMoney(employee.attendance_summary?.salary_details?.deductions)}</strong>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      <strong>Net Pay</strong>
                    </TableCell>
                    <TableCell align="right">
                      <strong style={{ fontSize: '1.2rem' }}>
                        ₹{formatMoney(employee.attendance_summary?.salary_details?.net_pay)}
                      </strong>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Paper>
          </Grid>
        </Grid>
      )}
    </Paper>
  );
};

export default SalaryDetails;