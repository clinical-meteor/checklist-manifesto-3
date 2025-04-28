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
  const [createPersonalLists, setCreatePersonalLists] = useState(true);
  const [createClinicalProtocols, setCreateClinicalProtocols] = useState(true);
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
        personalLists: createPersonalLists,
        clinicalProtocols: createClinicalProtocols
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
    setIsSubmitting(true);
    
    // Create personal/home sample lists if selected
    if (createSampleLists) {
      console.log('Creating sample lists...');
      Meteor.call('lists.createSampleData', (error, result) => {
        if (error) {
          console.error('Error creating sample lists:', error);
        } else {
          console.log('Sample lists created successfully:', result);
        }
        
        // Set isSubmitting to false after personal lists creation completes
        // if we're not also creating protocols
        if (!createSampleProtocols) {
          setIsSubmitting(false);
        }
      });
    }
    
    // Create clinical protocols if selected, but don't assign them to the user
    if (createSampleProtocols) {
      console.log('Creating sample protocols...');
      
      // Use the system method that creates public protocols not assigned to the current user
      Meteor.call('protocols.ensureSystemTemplates', (error, result) => {
        if (error) {
          console.error('Error creating clinical protocols:', error);
        } else {
          console.log('Clinical protocols created successfully:', result);
        }
        
        // Always set submitting to false when protocols are done
        setIsSubmitting(false);
      });
    } else if (!createSampleLists) {
      // If neither option is selected, make sure we still reset the submitting state
      setIsSubmitting(false);
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
      setCreatePersonalLists(false);
      setCreateClinicalProtocols(false);
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
              <Typography variant="body1" paragraph>
                Would you like to create sample data to help you get started?
              </Typography>
                
              {/* Sample data checkboxes */}
              <Box sx={{ ml: 4, mt: 2 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={createPersonalLists}
                      onChange={(e) => setCreatePersonalLists(e.target.checked)}
                      disabled={isSubmitting || !createSampleData}
                    />
                  }
                  label="Create personal/home sample task lists"
                />
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', ml: 4, mb: 2 }}>
                  Includes lists like "Shopping List", "Work Tasks", and "Home Projects"
                </Typography>
                
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={createClinicalProtocols}
                      onChange={(e) => setCreateClinicalProtocols(e.target.checked)}
                      disabled={isSubmitting || !createSampleData}
                    />
                  }
                  label="Create clinical protocol templates"
                />
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', ml: 4 }}>
                  Includes protocols like "Collect Blood Specimen", "MRI Safety Checklist", and other medical procedures
                </Typography>
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
              <Box>
                <Typography variant="body1" paragraph>
                  Sample data has been created to help you get started:
                </Typography>
                <Box sx={{ ml: 2 }}>
                  {createPersonalLists && (
                    <Typography variant="body2" paragraph>
                      • Personal task lists for everyday use
                    </Typography>
                  )}
                  {createClinicalProtocols && (
                    <Typography variant="body2" paragraph>
                      • Clinical protocol templates for healthcare workflows
                    </Typography>
                  )}
                </Box>
              </Box>
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