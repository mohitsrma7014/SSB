import { useState } from 'react';
import { Paper, Typography, Grid, Button, Menu, MenuItem } from '@mui/material';
import { format } from 'date-fns';

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DateSelector = ({ month, year, onChange }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMonthSelect = (selectedMonth) => {
    onChange(selectedMonth + 1, year);
    handleClose();
  };

  const handlePrevMonth = () => {
    const date = new Date(year, month - 2);
    onChange(date.getMonth() + 1, date.getFullYear());
  };

  const handleNextMonth = () => {
    const date = new Date(year, month);
    onChange(date.getMonth() + 1, date.getFullYear());
  };

  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Grid container alignItems="center" spacing={2}>
        <Grid item>
          <Button onClick={handlePrevMonth} variant="outlined">
            Previous
          </Button>
        </Grid>

        <Grid item>
          <Button
            aria-controls={open ? 'month-menu' : undefined}
            aria-haspopup="true"
            aria-expanded={open ? 'true' : undefined}
            onClick={handleClick}
            variant="contained"
            sx={{ minWidth: 120 }}
          >
            {months[month - 1]}
          </Button>
          <Menu
            id="month-menu"
            anchorEl={anchorEl}
            open={open}
            onClose={handleClose}
            MenuListProps={{ 'aria-labelledby': 'basic-button' }}
          >
            {months.map((monthName, index) => (
              <MenuItem
                key={monthName}
                selected={index === month - 1}
                onClick={() => handleMonthSelect(index)}
              >
                {monthName}
              </MenuItem>
            ))}
          </Menu>
        </Grid>

        <Grid item>
          <input
            type="number"
            value={year}
            onChange={(e) => onChange(month, parseInt(e.target.value, 10))}
            style={{ width: 80, padding: '6px 8px', fontSize: '1rem', borderRadius: 4, border: '1px solid #ccc' }}
          />
        </Grid>

        <Grid item>
          <Button onClick={handleNextMonth} variant="outlined">
            Next
          </Button>
        </Grid>

        <Grid item xs>
          <Typography variant="h6" align="right">
            {format(new Date(year, month - 1), 'MMMM yyyy')}
          </Typography>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default DateSelector;
