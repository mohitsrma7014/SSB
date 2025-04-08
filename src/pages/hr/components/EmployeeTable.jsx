import { useState, useMemo } from 'react';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  TablePagination,
  Avatar
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';

const EmployeeTable = ({ employees, onSelect, selectedEmployee }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const filteredEmployees = useMemo(() => {
    return employees.filter(emp =>
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.emp_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.department.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [employees, searchTerm]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Paper sx={{ p: 2, height: '100%',maxHeight: 'calc(100vh - 150px)', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h6" gutterBottom>
        Employees
      </Typography>

      <TextField
        fullWidth
        variant="outlined"
        placeholder="Search employees..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        InputProps={{
          startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />,
        }}
        sx={{ mb: 2 }}
      />

<TableContainer
  sx={{
    maxHeight: 'calc(100vh - 300px)', // Adjust this value to leave space for header/search/pagination
    overflowY: 'auto'
  }}
>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ backgroundColor: 'background.paper' }}>Employee</TableCell>
              <TableCell align="right" sx={{ backgroundColor: 'background.paper' }}>Days Worked</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredEmployees
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((employee) => (
                <TableRow
                  key={employee.emp_code}
                  hover
                  selected={selectedEmployee?.emp_code === employee.emp_code}
                  onClick={() => onSelect(employee)}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar sx={{ width: 32, height: 32, mr: 1 }}>
                        {employee.name.charAt(0)}
                      </Avatar>
                      <div>
                        <div>{employee.name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#666' }}>
                          {employee.emp_code} • {employee.department}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell align="right">
                    {employee.attendance_summary.working_days} /{' '}
                    {employee.attendance_summary.total_days - employee.attendance_summary.total_sundays}
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={filteredEmployees.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Paper>
  );
};

export default EmployeeTable;
