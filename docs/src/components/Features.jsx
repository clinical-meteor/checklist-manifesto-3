import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccessibilityNewIcon from '@mui/icons-material/AccessibilityNew';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import CodeIcon from '@mui/icons-material/Code';
import SecurityIcon from '@mui/icons-material/Security';
import CloudIcon from '@mui/icons-material/Cloud';

// Feature items
const features = [
  {
    icon: <CheckCircleIcon color="primary" sx={{ fontSize: 48 }} />,
    title: 'Task Management',
    description: 'Complete CRUD operations for tasks with filtering, prioritization, and due dates.'
  },
  {
    icon: <MedicalServicesIcon color="primary" sx={{ fontSize: 48 }} />,
    title: 'FHIR Compliant',
    description: 'Built on the FHIR Task resource model for healthcare interoperability standards.'
  },
  {
    icon: <AccessibilityNewIcon color="primary" sx={{ fontSize: 48 }} />,
    title: 'Accessible Design',
    description: 'Material UI components provide built-in 508 compliance and accessibility features.'
  },
  {
    icon: <CloudIcon color="primary" sx={{ fontSize: 48 }} />,
    title: '12-Factor Design',
    description: 'Environment-based configuration follows cloud-native application best practices.'
  },
  {
    icon: <SecurityIcon color="primary" sx={{ fontSize: 48 }} />,
    title: 'User Authentication',
    description: 'Secure user authentication system with password reset capabilities.'
  },
  {
    icon: <CodeIcon color="primary" sx={{ fontSize: 48 }} />,
    title: 'Open Source',
    description: 'MIT licensed code available on GitHub for learning and customization.'
  }
];

function Features() {
  return (
    <Box id="features" sx={{ py: 8, bgcolor: 'background.paper' }}>
      <Container maxWidth="lg">
        <Typography
          component="h2"
          variant="h3"
          align="center"
          color="text.primary"
          gutterBottom
        >
          Features
        </Typography>
        <Typography variant="h6" align="center" color="text.secondary" paragraph>
          A modern task management application with a focus on healthcare standards and accessibility
        </Typography>
        
        <Grid container spacing={4} sx={{ mt: 4 }}>
          {features.map((feature, index) => (
            <Grid item key={index} xs={12} sm={6} md={4}>
              <Paper
                elevation={3}
                sx={{
                  p: 3,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  borderRadius: 2,
                  transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: 6
                  }
                }}
              >
                <Box sx={{ mb: 2 }}>
                  {feature.icon}
                </Box>
                <Typography variant="h5" component="h3" gutterBottom>
                  {feature.title}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {feature.description}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}

export default Features;