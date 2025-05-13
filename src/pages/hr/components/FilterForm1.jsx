function FilterForm({ filter, onChange }) {
  return (
    <div className="filter-form">
      <div className="form-group">
        <label htmlFor="employeeId">Employee ID:</label>
        <input
          id="employeeId"
          type="text"
          name="employeeId"
          value={filter.employeeId}
          onChange={onChange}
          placeholder="Filter by ID"
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="employeeName">Employee Name:</label>
        <input
          id="employeeName"
          type="text"
          name="employeeName"
          value={filter.employeeName}
          onChange={onChange}
          placeholder="Filter by name"
        />
      </div>
    </div>
  );
}

export default FilterForm;