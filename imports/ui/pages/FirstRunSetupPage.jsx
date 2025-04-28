// imports/ui/pages/FirstRunSetupPage.jsx
import React, { useState } from 'react';
import { Meteor } from 'meteor/meteor';
import { 
  Box, 
  Container, 
  Paper,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Button,
  TextField,
  Alert,
  CircularProgress,
  FormControlLabel,
  Checkbox,
  Divider
} from '@mui/material';
import { get } from 'lodash';

export default function FirstRunSetupPage() {
  // State
  const [activeStep, setActiveStep] = useState(0);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [createSampleData, setCreateSampleData] = useState(true);
  const [createSampleLists, setCreateSampleLists] = useState(true);
  const [createSampleProtocols, setCreateSampleProtocols] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Steps for the setup wizard
  const steps = [
    'Welcome',
    'Create Admin Account',
    'Sample Data',
    'Complete'
  ];

  // Navigate to next step
  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  // Navigate to previous step
  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  // Handle first user registration
  const handleRegisterFirstUser = () => {
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
    
    // Create user options
    const userOptions = {
      username,
      password,
      profile: {
        sampleData: createSampleData,
        sampleLists: createSampleLists,
        sampleProtocols: createSampleProtocols
      }
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
        // Registration successful, proceed to sample data step
        handleNext();
        
        // Auto-login with the new account
        Meteor.loginWithPassword({ username }, password, function(loginErr) {
          if (loginErr) {
            console.error('Auto-login error:', loginErr);
          } else {
            // Create sample data if selected
            if (createSampleData) {
              createInitialData();
            }
          }
        });
      }
    });
  };

  // Create initial sample data
  const createInitialData = () => {
    // Create sample lists if selected
    if (createSampleLists) {
      Meteor.call('lists.createSampleData', (error) => {
        if (error) {
          console.error('Error creating sample lists:', error);
        } else {
          console.log('Sample lists created successfully');
        }
      });
    }
    
    // Create sample protocols if selected
    if (createSampleProtocols) {
      Meteor.call('protocols.createSampleData', (error) => {
        if (error) {
          console.error('Error creating sample protocols:', error);
        } else {
          console.log('Sample protocols created successfully');
        }
      });
    }
  };

  // Handle page refresh after setup
  const handleFinish = () => {
    window.location.reload();
  };

  // Toggle sample data options
  const handleToggleSampleData = (event) => {
    const checked = event.target.checked;
    setCreateSampleData(checked);
    
    // If main toggle is off, disable all sub-options
    if (!checked) {
      setCreateSampleLists(false);
      setCreateSampleProtocols(false);
    }
  };

  // Render different content based on the current step
  const renderStepContent = (step) => {
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
              
            {/* Remove the sample data checkboxes from here */}
              
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
                Sample Data
              </Typography>
                
              <Typography variant="body1" paragraph>
                Your administrator account has been created successfully and you're now logged in.
              </Typography>
                
              {/* Add the sample data checkboxes here */}
              <Box sx={{ mt: 3, p: 3, bgcolor: 'background.paper', borderRadius: 1 }}>
                <Typography variant="subtitle1" gutterBottom fontWeight="medium">
                  Would you like to create sample data to get started quickly?
                </Typography>
                
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={createSampleData}
                      onChange={handleToggleSampleData}
                      disabled={isSubmitting}
                    />
                  }
                  label="Create sample data for a better demo experience"
                />
                  
                {createSampleData && (
                  <Box sx={{ ml: 4, mt: 2 }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={createSampleLists}
                          onChange={(e) => setCreateSampleLists(e.target.checked)}
                          disabled={isSubmitting || !createSampleData}
                        />
                      }
                      label="Create sample task lists"
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={createSampleProtocols}
                          onChange={(e) => setCreateSampleProtocols(e.target.checked)}
                          disabled={isSubmitting || !createSampleData}
                        />
                      }
                      label="Create sample protocol templates"
                    />
                  </Box>
                )}
              </Box>
    
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                <Button onClick={handleBack} disabled={isSubmitting}>
                  Back
                </Button>
                <Button
                  variant="contained"
                  onClick={handleNext}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? <CircularProgress size={24} /> : 'Continue'}
                </Button>
              </Box>
            </Box>
          );

      case 3:
        return (
          <Box>
            <Typography variant="h5" gutterBottom>
              Setup Complete!
            </Typography>
            <Typography variant="body1" paragraph>
              Your administrator account has been created successfully and you're now logged in.
            </Typography>
            {createSampleData && (
              <Typography variant="body1" paragraph>
                Sample data has been created to help you get started with using the application.
              </Typography>
            )}
            <Typography variant="body1" paragraph>
              You can now start using Checklist Manifesto to manage your tasks and lists.
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Button
                variant="contained"
                onClick={handleFinish}
              >
                Get Started
              </Button>
            </Box>
          </Box>
        );
        
      default:
        return 'Unknown step';
    }
  };

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
          {renderStepContent(activeStep)}
        </Box>
      </Paper>
    </Container>
  );
}