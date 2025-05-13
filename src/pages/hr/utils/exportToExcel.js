import * as XLSX from 'xlsx';

export function exportToExcel(data, fileName) {
  // Flatten the data structure for Excel export
  const flattenedData = data.map(item => {
    return {
      'Employee ID': item.employee_id,
      'Employee Name': item.employee_name,
      'Department': item.department,
      'Employee Type': item.employee_type,
      'Month': new Date(item.year, item.month - 1).toLocaleString('default', { month: 'long' }),
      'Year': item.year,
      'Total Days': item.total_month_days,
      'Working Days': item.total_working_days,
      'Present Days': item.present_days,
      'Absent Days': item.absent_days,
      'Leave Days': item.leave_days,
      'CL Used': item.cl_used,
      'CL Remaining': item.cl_remaining,
      'Holidays': item.holiday_days,
      'Sundays': item.sundays,
      'OD Days': item.od_days,
      'OD Hours': item.od_hours,
      'Overtime Hours': item.overtime_hours,
      'Gross Salary': item.gross_salary,
      'Basic Salary': item.basic_salary,
      'HRA': item.hra,
      'Medical Allowance': item.medical_allowance,
      'Conveyance Allowance': item.conveyance_allowance,
      'Overtime Payment': item.overtime_payment,
      'OD Payment': item.od_payment,
      'Incentive': item.incentive,
      'PF Deduction': item.pf,
      'ESIC Deduction': item.esic,
      'Total Salary': item.total_salary
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(flattenedData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Salary Report');
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
}