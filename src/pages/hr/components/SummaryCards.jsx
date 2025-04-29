// src/components/SummaryCards.jsx
import React from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Avatar,
  useTheme,
} from '@mui/material'
import {
  People as PeopleIcon,
  Event as EventIcon,
} from '@mui/icons-material'

const iconStyle = { fontSize: 40, opacity: 0.8 }

const SummaryCards = ({ data }) => {
  const theme = useTheme()

  const cards = [
    {
      title: 'Total Employees',
      value: data.totalEmployees,
      icon: <PeopleIcon sx={iconStyle} />,
      color: theme.palette.primary.main,
    },
  ]

  return (
    <Grid container spacing={3} sx={{ mb: 3 }}>
      {cards.map((card, index) => (
        <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    gutterBottom
                  >
                    {card.title}
                  </Typography>
                  <Typography variant="h4" component="div">
                    {card.value}
                  </Typography>
                </div>
                <Avatar
                  sx={{
                    backgroundColor: `${card.color}20`,
                    color: card.color,
                    width: 60,
                    height: 60,
                  }}
                >
                  {card.icon}
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  )
}

export default SummaryCards