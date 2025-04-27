// imports/ui/FirstRunSetup.jsx
import React, { useState } from 'react';
import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';

// Material UI components
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';

export function FirstRunSetup({ onComplete }) {
  // Form state
  const [activeStep, setActiveStep] = useState(0);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Steps for the setup
  const steps = [
    'Welcome',
    'Create Admin Account',
    'Complete'
  ];

  function handleNext() {
    setActiveStep((prevStep) => prevStep + 1);
  }

  function handleBack() {
    setActiveStep((prevStep) => prevStep - 1);
  }

  // Handle first user registration
  function handleRegisterFirstUser() {
    setIsSubmitting(true);
    setError('');
    
    // Validate inputs
    if (!username) {
      setError('Username is required');
      setIsSubmitting(false);
      return;
    }
    
    if (!password) {
      setError('Password is required');
      setIsSubmitting(false);
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setIsSubmitting(false);
      return;
    }
    
    // Create user options, only including email if it's not empty
    const userOptions = {
      username,
      password
    };
    
    // Only include email if it's provided and not empty
    if (email && email.trim() !== '') {
      userOptions.email = email;
    }
    
    // Register first user with admin privileges
    Meteor.call('accounts.registerFirstUser', userOptions, function(err, result) {
      setIsSubmitting(false);
      
      if (err) {
        console.error('Registration error:', err);
        setError(get(err, 'reason', 'Registration failed. Please try again.'));
      } else {
        // Registration successful, proceed to next step
        handleNext();
        
        // Auto-login with the new account
        Meteor.loginWithPassword({ username }, password, function(loginErr) {
          if (loginErr) {
            console.error('Auto-login error:', loginErr);
          } else {
            // After short delay, complete setup
            setTimeout(function() {
              if (onComplete) onComplete();
              window.location.reload();
            }, 2000);
          }
        });
      }
    });
  }

  // Render based on the current step
  function getStepContent(step) {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="h5" gutterBottom>
              Welcome to Checklist Manifesto
            </Typography>
            <Typography variant="body1" paragraph>
              Thank you for installing Checklist Manifesto! This appears to be your first time running the application.
            </Typography>
            <Typography variant="body1" paragraph>
              Let's start by setting up an administrator account which you'll use to manage the application.
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
              <Button
                variant="contained"
                onClick={handleNext}
              >
                Get Started
              </Button>
            </Box>
          </Box>
        );
      
      case 1:
        return (
          <Box>
            <Typography variant="h5" gutterBottom>
              Create Admin Account
            </Typography>
            
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}
            
            <TextField
              label="Username"
              type="text"
              variant="outlined"
              fullWidth
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              margin="normal"
              required
              disabled={isSubmitting}
            />
            
            <TextField
              label="Email Address (Optional)"
              type="email"
              variant="outlined"
              fullWidth
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
              disabled={isSubmitting}
            />
            
            <TextField
              label="Password"
              type="password"
              variant="outlined"
              fullWidth
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              required
              disabled={isSubmitting}
            />
            
            <TextField
              label="Confirm Password"
              type="password"
              variant="outlined"
              fullWidth
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              margin="normal"
              required
              disabled={isSubmitting}
              error={password !== confirmPassword && confirmPassword !== ''}
              helperText={
                password !== confirmPassword && confirmPassword !== '' 
                  ? 'Passwords do not match' 
                  : ''
              }
            />
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
              <Button onClick={handleBack}>
                Back
              </Button>
              <Button
                variant="contained"
                onClick={handleRegisterFirstUser}
                disabled={isSubmitting || !username || !password || password !== confirmPassword}
              >
                {isSubmitting ? <CircularProgress size={24} /> : 'Create Account'}
              </Button>
            </Box>
          </Box>
        );
      
      case 2:
        return (
          <Box>
            <Typography variant="h5" gutterBottom>
              Setup Complete!
            </Typography>
            <Typography variant="body1" paragraph>
              Your administrator account has been created successfully and you're now logged in.
            </Typography>
            <Typography variant="body1" paragraph>
              You can now start using Checklist Manifesto to manage your tasks and create additional user accounts if needed.
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Button
                variant="contained"
                onClick={() => {
                  if (onComplete) onComplete();
                  window.location.reload();
                }}
              >
                Get Started
              </Button>
            </Box>
          </Box>
        );
        
      default:
        return 'Unknown step';
    }
  }

  return (
    <Container maxWidth="md" sx={{ mt: 8 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" align="center" gutterBottom>
          Checklist Manifesto Setup
        </Typography>
        
        <Stepper activeStep={activeStep} sx={{ mt: 4, mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        
        <Box sx={{ mt: 4 }}>
          {getStepContent(activeStep)}
        </Box>
      </Paper>
    </Container>
  );
}