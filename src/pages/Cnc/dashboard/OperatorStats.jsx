import { Card, CardContent, Typography } from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import { useTheme } from '@mui/material/styles'

const OperatorStats = ({ data }) => {
  const theme = useTheme()

  if (!data) return null

  const columns = [
    { field: 'operator', headerName: 'Operator', width: 150 },
    { 
      field: 'production', 
      headerName: 'Production', 
      type: 'number', 
      width: 120,
      renderCell: (params) => (
        <strong style={{ color: theme.palette.primary.main }}>
          {params.value}
        </strong>
      )
    },
    { 
      field: 'efficiency', 
      headerName: 'Efficiency', 
      type: 'number', 
      width: 130,
      valueFormatter: (params) => {
        const value = Number(params.value);
        return isNaN(value) ? 'N/A' : `${value.toFixed(1)}%`;
      },
      
      renderCell: (params) => {
        let color = theme.palette.error.main
        if (params.value > 70) color = theme.palette.warning.main
        if (params.value > 90) color = theme.palette.success.main
        
        return (
          <strong style={{ color }}>
            {params.value.toFixed(1)}%
          </strong>
        )
      }
    },
    { 
      field: 'rejection', 
      headerName: 'Rejection', 
      type: 'number', 
      width: 120,
      renderCell: (params) => (
        <strong style={{ color: theme.palette.error.main }}>
          {params.value}
        </strong>
      )
    },
  ]

  return (
    <Card elevation={3}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Operator Performance
        </Typography>
        <div style={{ height: 400, width: '100%' }}>
        <DataGrid
  rows={data}
  columns={columns}
  pageSize={5}
  rowsPerPageOptions={[5, 10]}
  disableSelectionOnClick
  getRowId={(row) => row.operator} // Add this line
  initialState={{
    sorting: {
      sortModel: [{ field: 'efficiency', sort: 'desc' }],
    },
  }}
/>
        </div>
      </CardContent>
    </Card>
  )
}

export default OperatorStats