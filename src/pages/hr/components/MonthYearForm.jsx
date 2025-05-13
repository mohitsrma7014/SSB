import { useState } from 'react';

function MonthYearForm({ onSubmit, loading }) {
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (month && year) {
      onSubmit(parseInt(month), parseInt(year));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="month-year-form">
      <div className="form-group">
        <label htmlFor="month">Month:</label>
        <select 
          id="month" 
          value={month} 
          onChange={(e) => setMonth(e.target.value)}
          required
          disabled={loading}
        >
          <option value="">Select Month</option>
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i+1} value={i+1}>
              {new Date(2000, i, 1).toLocaleString('default', { month: 'long' })}
            </option>
          ))}
        </select>
      </div>
      
      <div className="form-group">
        <label htmlFor="year">Year:</label>
        <input 
          id="year" 
          type="number" 
          min="2000" 
          max="2100" 
          value={year} 
          onChange={(e) => setYear(e.target.value)}
          required
          disabled={loading}
        />
      </div>
      
      <button type="submit" disabled={loading || !month || !year}>
        {loading ? 'Loading...' : 'Get Salary Data'}
      </button>
    </form>
  );
}

export default MonthYearForm;