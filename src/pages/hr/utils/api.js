export const fetchSalaryData = async (month, year) => {
    const response = await fetch(`http://localhost:8000/test2/api/calculate-salary/?month=${month}&year=${year}`);
    if (!response.ok) {
      throw new Error('Failed to fetch salary data');
    }
    return await response.json();
  };