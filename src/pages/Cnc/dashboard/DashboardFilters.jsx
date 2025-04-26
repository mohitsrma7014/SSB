import { useState } from 'react'
import { 
  Box, TextField, MenuItem, Button, Card ,
  FormControl, InputLabel, Select, Stack 
} from '@mui/material'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'

const DashboardFilters = ({ filters, onFilterChange }) => {
  const [dateRange, setDateRange] = useState([null, null])
  const [startDate, endDate] = dateRange

  const handleDateChange = (update) => {
    setDateRange(update)
    onFilterChange('dateRange', update)
  }

  return (
    <Card elevation={3} sx={{ p: 2, mb: 3 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <TextField
          label="Component"
          select
          value={filters.component}
          onChange={(e) => onFilterChange('component', e.target.value)}
          fullWidth
          size="small"
        >
          <MenuItem value="">All Components</MenuItem>
          <MenuItem value="VALVE">Valve</MenuItem>
          <MenuItem value="FLANGE">Flange</MenuItem>
          {/* Add more components as needed */}
        </TextField>

        <TextField
          label="Machine No"
          select
          value={filters.machineNo}
          onChange={(e) => onFilterChange('machineNo', e.target.value)}
          fullWidth
          size="small"
        >
          <MenuItem value="">All Machines</MenuItem>
          <MenuItem value="CNC-1">CNC-1</MenuItem>
          <MenuItem value="CNC-2">CNC-2</MenuItem>
          {/* Add more machines as needed */}
        </TextField>

        <TextField
          label="Operator"
          select
          value={filters.operator}
          onChange={(e) => onFilterChange('operator', e.target.value)}
          fullWidth
          size="small"
        >
          <MenuItem value="">All Operators</MenuItem>
          <MenuItem value="John">John</MenuItem>
          <MenuItem value="Mike">Mike</MenuItem>
          {/* Add more operators as needed */}
        </TextField>

        <Box sx={{ minWidth: 200 }}>
          <DatePicker
            selectsRange
            startDate={startDate}
            endDate={endDate}
            onChange={handleDateChange}
            isClearable
            placeholderText="Select date range"
            customInput={
              <TextField
                label="Date Range"
                fullWidth
                size="small"
              />
            }
          />
        </Box>

        <Button 
          variant="outlined" 
          onClick={() => {
            setDateRange([null, null])
            onFilterChange('dateRange', [null, null])
            // Reset other filters as needed
          }}
        >
          Reset
        </Button>
      </Stack>
    </Card>
  )
}

export default DashboardFilters