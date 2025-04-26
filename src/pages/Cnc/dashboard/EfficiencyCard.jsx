import { Card, CardContent, Typography, LinearProgress, Box } from '@mui/material'
import { useTheme } from '@mui/material/styles'

const EfficiencyCard = ({ efficiency, production, target }) => {
  const theme = useTheme()
  const progressColor = efficiency > 90 ? 'success' : efficiency > 70 ? 'warning' : 'error'

  return (
    <Card elevation={3}>
      <CardContent>
        <Typography variant="h6" color="textSecondary">
          Production Efficiency
        </Typography>
        <Box display="flex" alignItems="center" mt={2} mb={1}>
        <Typography variant="h3" sx={{ mr: 2 }}>
            {typeof efficiency === 'number' ? `${efficiency.toFixed(1)}%` : 'N/A'}
        </Typography>

          <Box sx={{ width: '100%' }}>
            <LinearProgress 
              variant="determinate" 
              value={Math.min(efficiency, 100)} 
              color={progressColor}
              sx={{ height: 10, borderRadius: 5 }}
            />
          </Box>
        </Box>
        <Box display="flex" justifyContent="space-between">
          <Typography variant="body2">
            Produced: {production}
          </Typography>
          <Typography variant="body2">
            Target: {target}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  )
}

export default EfficiencyCard