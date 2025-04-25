// imports/ui/LoginForm.jsx
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
import Link from '@mui/material/Link';
import Divider from '@mui/material/Divider';

export function LoginForm() {
  // Form state
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('password');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetMode, setResetMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);

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
      ? { email: username }
      : { username };
    
    // Use Meteor's built-in login method
    Meteor.loginWithPassword(loginCredentials, password, function(err) {
      setIsSubmitting(false);
      
      if (err) {
        console.error('Login error:', err);
        setError(get(err, 'reason', 'Login failed. Please check your credentials and try again.'));
      } else {
        // Login successful
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
    
    Meteor.call('user.sendResetPasswordEmail', resetEmail, function(err, result) {
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

  // Switch to password reset mode
  function toggleResetMode() {
    setResetMode(!resetMode);
    setError('');
  }

  // If in password reset mode
  if (resetMode) {
    return (
      <Box sx={{ mt: 4, mb: 4, display: 'flex', justifyContent: 'center' }}>
        <Card sx={{ width: '100%', maxWidth: 500 }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" align="center" gutterBottom>
              Reset Password
            </Typography>
            
            <Divider sx={{ mb: 3 }} />
            
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}
            
            {resetSent ? (
              <Box>
                <Alert severity="success" sx={{ mb: 3 }}>
                  If an account with this email exists, a password reset link has been sent.
                  Please check your email.
                </Alert>
                
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={toggleResetMode}
                  sx={{ mt: 2 }}
                >
                  Back to Login
                </Button>
              </Box>
            ) : (
              <Box component="form" onSubmit={handleResetPassword}>
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
                
                <Box sx={{ mt: 2, textAlign: 'center' }}>
                  <Link 
                    href="#" 
                    variant="body2" 
                    onClick={toggleResetMode}
                  >
                    Back to Sign In
                  </Link>
                </Box>
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>
    );
  }

  // Normal login form
  return (
    <Box sx={{ mt: 4, mb: 4, display: 'flex', justifyContent: 'center' }}>
      <Card sx={{ width: '100%', maxWidth: 500 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" align="center" gutterBottom>
            Sign In
          </Typography>
          
          <Divider sx={{ mb: 3 }} />
          
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
          
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
                onClick={toggleResetMode}
              >
                Forgot password?
              </Link>
            </Box>
          </Box>
          
          <Alert severity="info" sx={{ mt: 3 }}>
            <Typography variant="body2">
              Demo account: admin / password
            </Typography>
          </Alert>
        </CardContent>
      </Card>
    </Box>
  );
}