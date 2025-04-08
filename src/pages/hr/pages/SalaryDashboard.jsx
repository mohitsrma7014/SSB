import { useState, useEffect } from 'react';
import { Container, Typography, Grid, Paper, CircularProgress, Alert, Button } from '@mui/material';
import DateSelector from '../components/DateSelector';
import EmployeeTable from '../components/EmployeeTable';
import SalaryDetails from '../components/SalaryDetails';
import { fetchSalaryData } from '../utils/api';
import { Sidebar } from "../../Navigation/Sidebar";
import DashboardHeader from "../../Navigation/DashboardHeader";

const SalaryDashboard = () => {
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  
    const toggleSidebar = () => {
      setIsSidebarVisible(!isSidebarVisible);
    };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await fetchSalaryData(month, year);
        setData(result);
        setSelectedEmployee(result?.registered_employees?.[0] || null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [month, year]);
  const pageTitle = "Salary Dashboard";

  const handleDateChange = (newMonth, newYear) => {
    setMonth(newMonth);
    setYear(newYear);
  };

  const handleEmployeeSelect = (employee) => {
    setSelectedEmployee(employee);
  };

  return (
    <div className="flex">
    {/* Sidebar */}
    <div className={`fixed top-0 left-0 h-full transition-all duration-300 ${
      isSidebarVisible ? "w-64" : "w-0 overflow-hidden"
    }`} style={{ zIndex: 50 }}>
      {isSidebarVisible && <Sidebar isVisible={isSidebarVisible} toggleSidebar={toggleSidebar} />}
    </div>

    {/* Main Content */}
    <div className={`flex flex-col flex-grow transition-all duration-300 ${
      isSidebarVisible ? "ml-64" : "ml-0"
    }`}>
      <DashboardHeader isSidebarVisible={isSidebarVisible} toggleSidebar={toggleSidebar} title={pageTitle} />

      <main className="flex flex-col mt-20 justify-center flex-grow ">
    <Container maxWidth="full" >

      <DateSelector month={month} year={year} onChange={handleDateChange} />

      {loading && (
        <Paper sx={{ p: 3, mt: 3, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Paper>
      )}

      {error && (
        <Alert severity="error" sx={{ mt: 3 }}>
          {error}
        </Alert>
      )}

      {data && (
        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid item xs={12} md={4}>
            <EmployeeTable
              employees={data.registered_employees}
              onSelect={handleEmployeeSelect}
              selectedEmployee={selectedEmployee}
            />
          </Grid>

          <Grid item xs={12} md={8}>
            {selectedEmployee ? (
              <>
                <SalaryDetails employee={selectedEmployee} month={month} year={year} />
                <Button
                  variant="contained"
                  color="primary"
                  sx={{ mt: 2 }}
                  onClick={() => window.print()}
                >
                  Print Report
                </Button>
              </>
            ) : (
              <Paper sx={{ p: 3 }}>
                <Typography>Select an employee to view details</Typography>
              </Paper>
            )}
          </Grid>
        </Grid>
      )}
    </Container>
    </main>
      </div>
    </div>
  );
};

export default SalaryDashboard;