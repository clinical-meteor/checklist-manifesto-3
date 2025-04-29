import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import Divider from '@mui/material/Divider';
import Zoom from '@mui/material/Zoom';

function Screenshot() {
  return (
    <Box sx={{ py: 6, bgcolor: '#f0f4f8' }}>
      <Container maxWidth="lg">
        <Typography
          component="h2"
          variant="h4"
          align="center"
          color="text.primary"
          gutterBottom
        >
          Task Management in Action
        </Typography>
        <Typography variant="body1" align="center" color="text.secondary" paragraph sx={{ mb: 4, maxWidth: '800px', mx: 'auto' }}>
          The Checklist Manifesto app provides a clean, organized interface for managing critical tasks and checklists. 
          Below is an example of the MRI Safety Checklist implementation.
        </Typography>
        
        <Divider sx={{ mb: 4 }} />
        
        <Zoom in={true} timeout={1000}>
          <Paper
            elevation={6}
            sx={{
              p: 2,
              mx: 'auto',
              maxWidth: '90%',
              borderRadius: 2,
              overflow: 'hidden',
              transition: 'transform 0.3s',
              '&:hover': {
                transform: 'scale(1.02)',
                boxShadow: (theme) => theme.shadows[12],
              }
            }}
          >
            <Box
              component="img"
              src="/checklist-manifesto-3/ChecklistManifesto-MriSafetyChecklist.png"
              alt="MRI Safety Checklist Screenshot"
              sx={{
                width: '100%',
                height: 'auto',
                display: 'block',
                objectFit: 'contain',
                borderRadius: 1,
              }}
            />
          </Paper>
        </Zoom>
      </Container>
    </Box>
  );
}

export default Screenshot;