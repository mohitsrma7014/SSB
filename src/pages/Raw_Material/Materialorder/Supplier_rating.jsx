import { useState } from 'react';
import axios from 'axios';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { 
  Box, 
  Button, 
  Container, 
  FormControl, 
  InputLabel, 
  MenuItem, 
  Select, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper,
  Typography,
  LinearProgress,
  Alert
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

function Supplier_rating() {
  const [supplierId, setSupplierId] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [performanceData, setPerformanceData] = useState(null);

  // Fetch suppliers on component mount
  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const response = await axios.get('http://192.168.1.199:8001/raw_material/api/suppliers/');

        setSuppliers(response.data);
      } catch (err) {
        setError('Failed to load suppliers');
      }
    };
    fetchSuppliers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!supplierId || !startDate || !endDate) {
      setError('Please fill all fields');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = {
        supplier_id: supplierId,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0]
      };

      const response = await axios.get('http://192.168.1.199:8001/raw_material/api/supplier-performance/', { params });

      setPerformanceData(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch performance data');
    } finally {
      setLoading(false);
    }
  };

  const getRatingColor = (rating) => {
    if (rating >= 90) return '#4CAF50'; // Green
    if (rating >= 70) return '#8BC34A'; // Light green
    if (rating >= 60) return '#FFC107'; // Yellow
    return '#F44336'; // Red
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Supplier Performance Rating
        </Typography>

        <Paper sx={{ p: 3, mb: 3 }}>
          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel id="supplier-label">Supplier</InputLabel>
              <Select
                labelId="supplier-label"
                value={supplierId}
                label="Supplier"
                onChange={(e) => setSupplierId(e.target.value)}
                required
              >
                <MenuItem value=""><em>Select Supplier</em></MenuItem>
                {suppliers.map(supplier => (
                  <MenuItem key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <DatePicker
              label="Start Date"
              value={startDate}
              onChange={(newValue) => setStartDate(newValue)}
              slotProps={{ textField: { required: true } }}
              sx={{ width: 200 }}
            />

            <DatePicker
              label="End Date"
              value={endDate}
              onChange={(newValue) => setEndDate(newValue)}
              minDate={startDate}
              slotProps={{ textField: { required: true } }}
              sx={{ width: 200 }}
            />

            <Button 
              type="submit" 
              variant="contained" 
              disabled={loading}
              sx={{ height: 56 }}
            >
              Generate Report
            </Button>
          </Box>
        </Paper>

        {loading && <LinearProgress sx={{ mb: 3 }} />}
        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

        {performanceData && (
          <Paper sx={{ p: 2, overflowX: 'auto' }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              {performanceData.supplier_name} - Performance Rating
            </Typography>

            <TableContainer>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Parameter</TableCell>
                    <TableCell>Weight</TableCell>
                    {performanceData.months.map(month => (
                      <TableCell key={month} align="center">{month}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>RM BAR QUALITY RATING (RM QR)</TableCell>
                    <TableCell>40%</TableCell>
                    {performanceData.quality_rating.map((rating, i) => (
                      <TableCell key={i} align="center" sx={{ backgroundColor: getRatingColor(rating/0.4) }}>
                        {rating}
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell>DELIVERY RATING</TableCell>
                    <TableCell>20%</TableCell>
                    {performanceData.delivery_rating.map((rating, i) => (
                      <TableCell key={i} align="center" sx={{ backgroundColor: getRatingColor(rating/0.2) }}>
                        {rating}
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell>Quality Failure Received</TableCell>
                    <TableCell>20%</TableCell>
                    {performanceData.qfr_count.map((count, i) => (
                      <TableCell key={i} align="center">
                        {count}
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell>SYSTEM AUDIT SCORE</TableCell>
                    <TableCell>20%</TableCell>
                    {performanceData.audit_score.map((score, i) => (
                      <TableCell key={i} align="center" sx={{ backgroundColor: getRatingColor(score/0.2) }}>
                        {score}
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow sx={{ '& td': { fontWeight: 'bold' } }}>
                    <TableCell>SQR (%)</TableCell>
                    <TableCell>100%</TableCell>
                    {performanceData.overall_rating.map((rating, i) => (
                      <TableCell key={i} align="center" sx={{ backgroundColor: getRatingColor(rating) }}>
                        {rating.toFixed(1)}
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell>RANKING</TableCell>
                    <TableCell></TableCell>
                    {performanceData.ranking.map((rank, i) => (
                      <TableCell key={i} align="center">
                        <Box 
                          sx={{
                            display: 'inline-block',
                            width: 24,
                            height: 24,
                            borderRadius: '50%',
                            backgroundColor: getRatingColor(
                              performanceData.overall_rating[i]
                            ),
                            color: 'white',
                            lineHeight: '24px',
                            fontWeight: 'bold'
                          }}
                        >
                          {rank}
                        </Box>
                      </TableCell>
                    ))}
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>

            <Box sx={{ mt: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body2">Rating Legend:</Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                {['A (≥90)', 'B (70-89)', 'C (60-69)', 'D (<60)'].map((label, i) => (
                  <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{
                      width: 16,
                      height: 16,
                      borderRadius: '50%',
                      backgroundColor: getRatingColor([90, 70, 60, 0][i])
                    }} />
                    <Typography variant="body2">{label}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          </Paper>
        )}
      </Container>
    </LocalizationProvider>
  );
}

export default Supplier_rating;