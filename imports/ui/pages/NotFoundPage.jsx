// imports/ui/pages/NotFoundPage.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Container, Typography, Button, Paper } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

/**
 * Not Found page to display when a route doesn't exist
 */
export default function NotFoundPage() {
  const navigate = useNavigate();
  
  // Navigate back to the home page
  function handleGoHome() {
    navigate('/');
  }
  
  return (
    <Container maxWidth="md">
      <Paper 
        elevation={3} 
        sx={{ 
          p: 4, 
          mt: 8, 
          textAlign: 'center',
          borderRadius: 2
        }}
      >
        <ErrorOutlineIcon 
          color="error" 
          sx={{ fontSize: 72, mb: 2 }} 
        />
        
        <Typography variant="h3" component="h1" gutterBottom>
          Page Not Found
        </Typography>
        
        <Typography variant="body1" paragraph>
          The page you're looking for doesn't exist or has been moved.
        </Typography>
        
        <Box sx={{ mt: 4 }}>
          <Button
            variant="contained"
            startIcon={<ArrowBackIcon />}
            onClick={handleGoHome}
            size="large"
          >
            Back to Home
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}