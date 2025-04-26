import { Card, CardContent, Typography } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';

const MachinePerformance = ({ data }) => {
  if (!data || data.length === 0) return null;

  const columns = [
    { field: 'machine_no', headerName: 'Machine', width: 120 },
    { field: 'production', headerName: 'Production', type: 'number', width: 120 },
    { field: 'target', headerName: 'Target', type: 'number', width: 120 },
    { 
      field: 'efficiency', 
      headerName: 'Efficiency', 
      type: 'number', 
      width: 130,
      valueFormatter: (params) => {
        if (!params || params.value == null) return 'N/A';
        const value = Number(params.value);
        if (isNaN(value)) return 'N/A';
        return `${value.toFixed(1)}%`;
      },
    },
  ];
  
  

  return (
    <Card elevation={3}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Machine Performance
        </Typography>
        <div style={{ height: 400, width: '100%' }}>
          <DataGrid
            rows={data}
            columns={columns}
            pageSize={5}
            rowsPerPageOptions={[5, 10, 20]}
            disableSelectionOnClick
            getRowId={(row) => row.machine_no || Math.random()} // fallback if machine_no is missing
            initialState={{
              pagination: {
                paginationModel: { pageSize: 5, page: 0 },
              },
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}

export default MachinePerformance;
