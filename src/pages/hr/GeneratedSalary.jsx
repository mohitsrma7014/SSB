import { useState } from 'react';
import MonthYearForm from './components/MonthYearForm';
import FilterForm from './components/FilterForm1';
import EmployeeTable from './components/EmployeeTable1';
import EmployeeDetailsModal from './components/EmployeeDetailsModal1';

function GeneratedSalary() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedMonthYear, setSelectedMonthYear] = useState(null);
  const [filter, setFilter] = useState({ employeeId: '', employeeName: '' });
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchSalaryData = async (month, year) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/salary-calculation?month=${month}&year=${year}`);
      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }
      const result = await response.json();
      setData(result);
      setSelectedMonthYear({ month, year });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilter(prev => ({ ...prev, [name]: value }));
  };

  const filteredEmployees = data?.results?.filter(emp => {
    const idMatch = emp.employee_id.toString().includes(filter.employeeId.toLowerCase());
    const nameMatch = emp.employee_name.toLowerCase().includes(filter.employeeName.toLowerCase());
    return idMatch && nameMatch;
  }) || [];

  return (
    <div className="container">
      <h1>Salary Management System</h1>
      
      {!selectedMonthYear ? (
        <MonthYearForm onSubmit={fetchSalaryData} loading={loading} />
      ) : (
        <>
          <div className="header-actions">
            <button 
              className="btn secondary"
              onClick={() => setSelectedMonthYear(null)}
            >
              Change Month/Year
            </button>
            <span className="month-year-display">
              {new Date(selectedMonthYear.year, selectedMonthYear.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
            </span>
          </div>

          <FilterForm filter={filter} onChange={handleFilterChange} />
          
          {loading && <div className="loading">Loading...</div>}
          {error && <div className="error">{error}</div>}
          
          <EmployeeTable 
            employees={filteredEmployees} 
            onViewDetails={(emp) => {
              setSelectedEmployee(emp);
              setIsModalOpen(true);
            }} 
          />
        </>
      )}

      {isModalOpen && selectedEmployee && (
        <EmployeeDetailsModal 
          employee={selectedEmployee} 
          onClose={() => setIsModalOpen(false)} 
        />
      )}
    </div>
  );
}

export default GeneratedSalary;