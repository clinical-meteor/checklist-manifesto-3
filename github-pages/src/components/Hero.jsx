import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import DownloadIcon from '@mui/icons-material/Download';
import ChecklistIcon from '@mui/icons-material/ChecklistRtl';

// In a real implementation, this would be the URL to your latest GitHub release asset
// For example: https://github.com/yourusername/checklist-manifesto/releases/download/v1.0.0/checklist-manifesto-v1.0.0.zip
const DOWNLOAD_URL = "https://github.com/yourusername/checklist-manifesto/releases/latest/download/checklist-manifesto.zip";

function Hero() {
  return (
    <Box
      id="hero"
      sx={{
        pt: 8,
        pb: 6,
        background: 'linear-gradient(120deg, #315481 0%, #62807e 100%)',
        color: 'white',
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4} alignItems="center">
          <Grid item xs={12} md={7}>
            <Typography
              component="h1"
              variant="h2"
              gutterBottom
              sx={{ fontWeight: 700 }}
            >
              Checklist Manifesto
            </Typography>
            <Typography variant="h5" paragraph>
              A modern task management application built with Meteor, React, and FHIR
            </Typography>
            <Typography variant="body1" paragraph sx={{ mb: 4 }}>
              Organize your tasks with a powerful, accessible, and standards-compliant application.
              Based on FHIR Task resources for healthcare interoperability.
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                size="large"
                href={DOWNLOAD_URL}
                startIcon={<DownloadIcon />}
                sx={{ 
                  backgroundColor: 'white', 
                  color: 'primary.main',
                  fontWeight: 'bold',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.9)'
                  } 
                }}
              >
                Download App
              </Button>
              <Button
                variant="outlined"
                size="large"
                href="https://github.com/yourusername/checklist-manifesto"
                target="_blank"
                sx={{ 
                  color: 'white', 
                  borderColor: 'white',
                  '&:hover': {
                    borderColor: 'white',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)'
                  } 
                }}
              >
                View Source
              </Button>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={5}>
            <Paper 
              elevation={6}
              sx={{ 
                p: 3, 
                borderRadius: 2,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                bgcolor: 'rgba(255, 255, 255, 0.9)',
                color: 'text.primary'
              }}
            >
              <ChecklistIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" align="center" gutterBottom>
                Current Version: 1.0.0
              </Typography>
              <Typography variant="body2" align="center" paragraph>
                Available for Windows, Mac, and Linux
              </Typography>
              <Button 
                variant="contained" 
                fullWidth
                href={DOWNLOAD_URL}
                startIcon={<DownloadIcon />}
              >
                Download Now
              </Button>
              <Typography variant="caption" sx={{ mt: 2, color: 'text.secondary' }}>
                Released under MIT License
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

export default Hero;