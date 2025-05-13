import { exportToExcel } from '../utils/exportToExcel';

function EmployeeDetailsModal({ employee, onClose }) {
  const handleExport = () => {
    exportToExcel([employee], `salary_details_${employee.employee_id}`);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Salary Details - {employee.employee_name} ({employee.employee_id})</h2>
          <button onClick={onClose} className="close-btn">&times;</button>
        </div>
        
        <div className="modal-body">
          <div className="employee-info">
            <div>
              <strong>Department:</strong> {employee.department}
            </div>
            <div>
              <strong>Employee Type:</strong> {employee.employee_type}
            </div>
            <div>
              <strong>Month:</strong> {new Date(employee.year, employee.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
            </div>
          </div>
          
          <div className="attendance-summary">
            <h3>Attendance Summary</h3>
            <div className="summary-grid">
              <div><strong>Total Days:</strong> {employee.total_month_days}</div>
              <div><strong>Working Days:</strong> {employee.total_working_days}</div>
              <div><strong>Present Days:</strong> {employee.present_days}</div>
              <div><strong>Absent Days:</strong> {employee.absent_days}</div>
              <div><strong>Leave Days (CL):</strong> {employee.leave_days}</div>
              <div><strong>CL Used:</strong> {employee.cl_used}</div>
              <div><strong>CL Remaining:</strong> {employee.cl_remaining}</div>
              <div><strong>Holidays:</strong> {employee.holiday_days}</div>
              <div><strong>Sundays:</strong> {employee.sundays}</div>
              <div><strong>OD Days:</strong> {employee.od_days}</div>
              <div><strong>OD Hours:</strong> {employee.od_hours}</div>
              <div><strong>Overtime Hours:</strong> {employee.overtime_hours}</div>
            </div>
          </div>
          
          <div className="salary-breakdown">
            <h3>Salary Breakdown</h3>
            <div className="breakdown-grid">
              <div className="earnings">
                <h4>Earnings</h4>
                <div><strong>Gross Salary:</strong> ₹{employee.gross_salary.toLocaleString()}</div>
                <div><strong>Basic Salary:</strong> ₹{employee.basic_salary.toLocaleString()}</div>
                <div><strong>HRA:</strong> ₹{employee.hra.toLocaleString()}</div>
                <div><strong>Medical Allowance:</strong> ₹{employee.medical_allowance.toLocaleString()}</div>
                <div><strong>Conveyance Allowance:</strong> ₹{employee.conveyance_allowance.toLocaleString()}</div>
                <div><strong>Overtime Payment:</strong> ₹{employee.overtime_payment.toLocaleString()}</div>
                <div><strong>OD Payment:</strong> ₹{employee.od_payment.toLocaleString()}</div>
                <div><strong>Incentive:</strong> ₹{employee.incentive.toLocaleString()}</div>
              </div>
              
              <div className="deductions">
                <h4>Deductions</h4>
                <div><strong>PF:</strong> ₹{employee.pf.toLocaleString()}</div>
                <div><strong>ESIC:</strong> ₹{employee.esic.toLocaleString()}</div>
              </div>
              
              <div className="total">
                <h4>Total</h4>
                <div><strong>Total Salary:</strong> ₹{employee.total_salary.toLocaleString()}</div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="modal-footer">
          <button onClick={handleExport} className="btn export-btn">
            Export to Excel
          </button>
          <button onClick={onClose} className="btn close-btn">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default EmployeeDetailsModal;