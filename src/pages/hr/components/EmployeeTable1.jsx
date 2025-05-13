import { exportToExcel } from '../utils/exportToExcel';

function EmployeeTable({ employees, onViewDetails }) {
  if (employees.length === 0) {
    return <div className="no-data">No employee data found</div>;
  }

  const handleExport = () => {
    exportToExcel(employees, 'salary_report');
  };

  return (
    <div className="employee-table-container">
      <button onClick={handleExport} className="btn export-btn">
        Export to Excel
      </button>
      
      <table className="employee-table">
        <thead>
          <tr>
            <th>Employee ID</th>
            <th>Employee Name</th>
            <th>Department</th>
            <th>Type</th>
            <th>Present Days</th>
            <th>Total Salary</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {employees.map(emp => (
            <tr key={emp.employee_id}>
              <td>{emp.employee_id}</td>
              <td>{emp.employee_name}</td>
              <td>{emp.department}</td>
              <td>{emp.employee_type}</td>
              <td>{emp.present_days} / {emp.total_working_days}</td>
              <td>₹{emp.total_salary.toLocaleString()}</td>
              <td>
                <button 
                  onClick={() => onViewDetails(emp)}
                  className="btn view-btn"
                >
                  View Details
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default EmployeeTable;