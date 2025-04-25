// imports/ui/LoginForm.jsx
import React, { useState } from 'react';
import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
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
import Container from '@mui/material/Container';
import Link from '@mui/material/Link';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';

export function LoginForm() {
  // Form state
  const [username, setUsername] = useState('admin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('password');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mode, setMode] = useState('login'); // 'login' or 'register'
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);

  // Set login mode
  function handleModeChange(event, newMode) {
    setMode(newMode);
    setError('');
  }

  // Handle login with Meteor's core login function
  function handleLogin(e) {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    if (!password) {
      setError('Password is required');
      setIsSubmitting(false);
      return;
    }
    
    // Determine login credentials
    const loginCredentials = username.includes('@') 
      ? { email: username, password }
      : { username, password };
    
    // Use Meteor's built-in login method
    Meteor.loginWithPassword(loginCredentials, password, (err) => {
      setIsSubmitting(false);
      
      if (err) {
        console.error('Login error:', err);
        setError(err.reason || 'Login failed. Please check your credentials and try again.');
      } else {
        // Login successful - ensure UI is updated
        window.location.reload();
      }
    });
  }

  // Handle registration
  function handleRegister(e) {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    if (!password) {
      setError('Password is required');
      setIsSubmitting(false);
      return;
    }
    
    if (!username && !email) {
      setError('Username or email is required');
      setIsSubmitting(false);
      return;
    }
    
    const newUser = {
      password,
      profile: {}
    };
    
    if (username) newUser.username = username;
    if (email) newUser.email = email;
    
    Accounts.createUser(newUser, (err) => {
      setIsSubmitting(false);
      
      if (err) {
        console.error('Registration error:', err);
        setError(err.reason || 'Registration failed. Please try again.');
      } else {
        alert('Account created successfully! You are now logged in.');
        window.location.reload();
      }
    });
  }
  
  // Handle password reset request
  function handleResetPassword(e) {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    if (!resetEmail) {
      setError('Email is required to reset your password');
      setIsSubmitting(false);
      return;
    }
    
    Accounts.forgotPassword({ email: resetEmail }, (err) => {
      setIsSubmitting(false);
      
      if (err) {
        console.error('Password reset error:', err);
        // Don't show specific errors for security - just indicate email might be sent
        setResetSent(true);
      } else {
        setResetSent(true);
      }
    });
  }

  // Render the login form
  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, mb: 4 }}>
        <Card>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
              <Typography component="h1" variant="h4">
                Checklist Manifesto
              </Typography>
              <Typography variant="subtitle1" color="text.secondary" sx={{ mt: 1 }}>
                FHIR Task Management System
              </Typography>
            </Box>
            
            <Tabs 
              value={mode} 
              onChange={handleModeChange} 
              variant="fullWidth" 
              sx={{ mb: 3 }}
              disabled={isSubmitting}
            >
              <Tab value="login" label="Sign In" />
              <Tab value="register" label="Register" />
              <Tab value="reset" label="Reset Password" />
            </Tabs>
            
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}
            
            {mode === 'login' && (
              <Box component="form" onSubmit={handleLogin}>
                <TextField
                  label="Username or Email"
                  type="text"
                  variant="outlined"
                  fullWidth
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isSubmitting}
                  margin="normal"
                  required
                />
                
                <TextField
                  label="Password"
                  type="password"
                  variant="outlined"
                  fullWidth
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isSubmitting}
                  margin="normal"
                />
                
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={isSubmitting}
                  sx={{ mt: 3, mb: 2 }}
                >
                  {isSubmitting ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : 'Sign In'}
                </Button>
                
                <Box sx={{ mt: 2, textAlign: 'center' }}>
                  <Link 
                    href="#" 
                    variant="body2" 
                    onClick={(e) => {
                      e.preventDefault();
                      setMode('reset');
                    }}
                  >
                    Forgot password?
                  </Link>
                </Box>
              </Box>
            )}
            
            {mode === 'register' && (
              <Box component="form" onSubmit={handleRegister}>
                <TextField
                  label="Username"
                  type="text"
                  variant="outlined"
                  fullWidth
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  margin="normal"
                  helperText="Choose a unique username"
                />
                
                <TextField
                  label="Email"
                  type="email"
                  variant="outlined"
                  fullWidth
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  margin="normal"
                  helperText="Enter your email address"
                />
                
                <TextField
                  label="Password"
                  type="password"
                  variant="outlined"
                  fullWidth
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isSubmitting}
                  margin="normal"
                  helperText="Password must be at least 6 characters"
                />
                
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={isSubmitting || (!username && !email) || !password}
                  sx={{ mt: 3, mb: 2 }}
                >
                  {isSubmitting ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : 'Create Account'}
                </Button>
                
                <Box sx={{ mt: 2, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Already have an account?{' '}
                    <Link 
                      href="#" 
                      variant="body2" 
                      onClick={(e) => {
                        e.preventDefault();
                        setMode('login');
                      }}
                    >
                      Sign in
                    </Link>
                  </Typography>
                </Box>
              </Box>
            )}
            
            {mode === 'reset' && (
              <Box component="form" onSubmit={handleResetPassword}>
                {resetSent ? (
                  <Alert severity="success" sx={{ mb: 3 }}>
                    If an account with this email exists, a password reset link has been sent.
                    Please check your email.
                  </Alert>
                ) : (
                  <>
                    <Typography variant="body2" paragraph>
                      Enter your email address below and we'll send you a link to reset your password.
                    </Typography>
                    
                    <TextField
                      label="Email"
                      type="email"
                      variant="outlined"
                      fullWidth
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      required
                      disabled={isSubmitting}
                      margin="normal"
                    />
                    
                    <Button
                      type="submit"
                      fullWidth
                      variant="contained"
                      size="large"
                      disabled={isSubmitting || !resetEmail}
                      sx={{ mt: 3, mb: 2 }}
                    >
                      {isSubmitting ? (
                        <CircularProgress size={24} color="inherit" />
                      ) : 'Send Reset Link'}
                    </Button>
                  </>
                )}
                
                <Box sx={{ mt: 2, textAlign: 'center' }}>
                  <Link 
                    href="#" 
                    variant="body2" 
                    onClick={(e) => {
                      e.preventDefault();
                      setMode('login');
                    }}
                  >
                    Back to Sign In
                  </Link>
                </Box>
              </Box>
            )}
            
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                Demo account: admin / password
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                This application uses Meteor's built-in authentication system.
              </Typography>
            </Alert>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
}