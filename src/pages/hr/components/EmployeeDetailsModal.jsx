// src/components/EmployeeDetailsModal.jsx
import React from 'react'
import {
  Modal,
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Grid,
  Card,
  CardContent,
  Avatar,
  useTheme,
  Chip,
} from '@mui/material'
import {
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Work as WorkIcon,
  AccessTime as AccessTimeIcon,
  Schedule as ScheduleIcon,
  ExitToApp as GatePassIcon,
} from '@mui/icons-material'
import { format } from 'date-fns';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '80%',
  maxWidth: 1200,
  maxHeight: '90vh',
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
  overflow: 'auto',
}

const getGatePassColor = (action) => {
  switch(action) {
    case 'FD': return 'success';
    case 'HD': return 'warning';
    case 'FD_CUT': return 'error';
    case 'HD_CUT': return 'error';
    default: return 'default';
  }
}

const getGatePassLabel = (action) => {
  switch(action) {
    case 'FD': return 'Full Day';
    case 'HD': return 'Half Day';
    case 'FD_CUT': return 'Full Day Cut';
    case 'HD_CUT': return 'Half Day Cut';
    default: return action;
  }
}

const EmployeeDetailsModal = ({ open, onClose, employee, month, year }) => {
  const theme = useTheme()
  
  if (!employee) return null

  // Employee summary cards data
  const summaryCards = [
    {
      title: 'Month Days',
      value: employee.total_days_in_month,
      icon: <CalendarTodayIcon />,
      color: theme.palette.success.main,
    },
    {
      title: 'Working Days',
      value: employee.total_working_days,
      icon: <CalendarTodayIcon />,
      color: theme.palette.success.main,
    },
    {
      title: 'Present Days',
      value: employee.total_present_days,
      icon: <CheckCircleIcon />,
      color: theme.palette.success.main,
    },
    {
      title: 'Absent Days',
      value: employee.total_absent_days,
      icon: <CancelIcon />,
      color: theme.palette.error.main,
    },
    {
      title: 'Holi-Days',
      value: employee.total_holiday_days,
      icon: <CancelIcon />,
      color: theme.palette.error.main,
    },
    {
      title: 'OD Days',
      value: `${employee.extra_days?.od_days || 0} D, ${employee.extra_days?.od_hours || 0} H`,
      icon: <WorkIcon />,
      color: theme.palette.info.main,
    },

  
    {
      title: 'OT Hours',
      value: employee.total_overtime_hours?.toFixed(2) || '0.00',
      icon: <ScheduleIcon />,
      color: theme.palette.success.dark,
    },
  ]

  // Collect all gate passes for the gate pass table
  const gatePasses = employee.daily_attendance
    .filter(day => day.gate_pass)
    .map(day => ({
      ...day.gate_pass,
      date: day.date,
      status: day.status,
      working_hours: day.working_hours
    }))

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={style}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3,
          }}
        >
          <Typography variant="h5" component="h2">
            {employee.employee_name} - Attendance Details
          </Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1">
            <strong>Employee ID:</strong> {employee.employee_id}
          </Typography>
          <Typography variant="subtitle1">
            <strong>Department:</strong> {employee.department}
          </Typography>
          <Typography variant="subtitle1">
            <strong>Month:</strong> {format(new Date(year, month - 1, 1), 'MMMM yyyy')}
          </Typography>
        </Box>

        {/* Employee summary cards */}
        <Grid container spacing={2} sx={{ mb: 3 }} wrap="nowrap">
          {summaryCards.map((card, index) => (
            <Grid item xs={12} sm={6} md={4} lg={2} key={index}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Avatar sx={{ 
                    backgroundColor: `${card.color}20`, 
                    color: card.color,
                    width: 50,
                    height: 50,
                    margin: '0 auto 10px'
                  }}>
                    {card.icon}
                  </Avatar>
                  <Typography variant="subtitle2" color="text.secondary">
                    {card.title}
                  </Typography>
                  <Typography variant="h6">
                    {card.value}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <TableContainer component={Paper} sx={{ mb: 3 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Day Type</TableCell>
                <TableCell>Shift</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>In Time</TableCell>
                <TableCell>Out Time</TableCell>
                <TableCell>OT Hours</TableCell>
                <TableCell>Remarks</TableCell>
                <TableCell>Gate Pass</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {employee.daily_attendance.map((day, index) => (
                <TableRow key={index}>
                  <TableCell>{new Date(day.date).toLocaleDateString()}</TableCell>
                  <TableCell>{day.day_type}</TableCell>
                  <TableCell>{day.shift_type}</TableCell>
                  <TableCell>
                    {day.status}
                    {day.gate_pass && (
                      <Chip
                        size="small"
                        label={getGatePassLabel(day.gate_pass.action_taken)}
                        color={getGatePassColor(day.gate_pass.action_taken)}
                        sx={{ ml: 1 }}
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    {day.actual_in || '-'}
                    {day.is_manual_in && ' (Manual)'}
                  </TableCell>
                  <TableCell>
                    {day.actual_out || '-'}
                    {day.is_manual_out && ' (Manual)'}
                    {day.gate_pass && (
                      <Typography variant="caption" display="block" color="text.secondary">
                        Gate Pass: {day.gate_pass.out_time}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>{day.overtime_hours}</TableCell>
                  <TableCell>{day.remarks}</TableCell>
                  <TableCell>
                    {day.gate_pass ? (
                      <Box>
                        <Typography variant="body2">
                          {day.gate_pass.out_time} - {getGatePassLabel(day.gate_pass.action_taken)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Approved by: {day.gate_pass.approved_by}
                        </Typography>
                        {day.gate_pass.reason && (
                          <Typography variant="caption" display="block">
                            Reason: {day.gate_pass.reason}
                          </Typography>
                        )}
                      </Box>
                    ) : '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {gatePasses.length > 0 && (
          <>
            <Typography variant="h6" gutterBottom>
              Gate Pass Details
            </Typography>
            <TableContainer component={Paper} sx={{ mb: 3 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Out Time</TableCell>
                    <TableCell>Work Hours</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Approved By</TableCell>
                    <TableCell>Reason</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {gatePasses.map((gp, index) => (
                    <TableRow key={index}>
                      <TableCell>{new Date(gp.date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={getGatePassLabel(gp.action_taken)}
                          color={getGatePassColor(gp.action_taken)}
                        />
                      </TableCell>
                      <TableCell>{gp.out_time}</TableCell>
                      <TableCell>{gp.working_hours}</TableCell>
                      <TableCell>{gp.status}</TableCell>
                      <TableCell>{gp.approved_by}</TableCell>
                      <TableCell>{gp.reason || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}

        {employee.od_slips.length > 0 && (
          <>
            <Typography variant="h6" gutterBottom>
              On Duty Slips
            </Typography>
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Days</TableCell>
                    <TableCell>Hours</TableCell>
                    <TableCell>Reason</TableCell>
                    <TableCell>Approved By</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {employee.od_slips.map((od, index) => (
                    <TableRow key={index}>
                      <TableCell>{new Date(od.date).toLocaleDateString()}</TableCell>
                      <TableCell>{od.days}</TableCell>
                      <TableCell>{od.hours}</TableCell>
                      <TableCell>{od.reason}</TableCell>
                      <TableCell>{od.approved_by}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}

        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="contained" onClick={onClose}>
            Close
          </Button>
        </Box>
      </Box>
    </Modal>
  )
}

export default EmployeeDetailsModal