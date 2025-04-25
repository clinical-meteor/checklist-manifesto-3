// imports/ui/RegisterForm.jsx
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
import Link from '@mui/material/Link';
import Divider from '@mui/material/Divider';

export function RegisterForm({ onSwitchToLogin }) {
  // Form state
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle registration
  function handleRegister(e) {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    // Validate inputs
    if (!username && !email) {
      setError('Username or email is required');
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
    
    // Create user object
    const newUser = {
      password,
      profile: {}
    };
    
    if (username) newUser.username = username;
    if (email) newUser.email = email;
    
    // Use Meteor's built-in account creation
    Accounts.createUser(newUser, function(err) {
      setIsSubmitting(false);
      
      if (err) {
        console.error('Registration error:', err);
        setError(get(err, 'reason', 'Registration failed. Please try again.'));
      } else {
        setSuccess(true);
        // Auto-login happens automatically with Accounts.createUser
        setTimeout(function() {
          // Refresh the page to update UI
          window.location.reload();
        }, 1500);
      }
    });
  }

  // Handle switching to login
  function switchToLogin(e) {
    e.preventDefault();
    if (onSwitchToLogin) {
      onSwitchToLogin();
    }
  }

  return (
    <Box sx={{ mt: 4, mb: 4, display: 'flex', justifyContent: 'center' }}>
      <Card sx={{ width: '100%', maxWidth: 500 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" align="center" gutterBottom>
            Create an Account
          </Typography>
          
          <Divider sx={{ mb: 3 }} />
          
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
          
          {success && (
            <Alert severity="success" sx={{ mb: 3 }}>
              Account created successfully! You'll be logged in shortly.
            </Alert>
          )}
          
          <Box component="form" onSubmit={handleRegister}>
            <TextField
              label="Username"
              type="text"
              variant="outlined"
              fullWidth
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              margin="normal"
              disabled={isSubmitting || success}
            />
            
            <TextField
              label="Email Address"
              type="email"
              variant="outlined"
              fullWidth
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
              disabled={isSubmitting || success}
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
              disabled={isSubmitting || success}
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
              disabled={isSubmitting || success}
              error={password !== confirmPassword && confirmPassword !== ''}
              helperText={
                password !== confirmPassword && confirmPassword !== '' 
                  ? 'Passwords do not match' 
                  : ''
              }
            />
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={isSubmitting || success || (!username && !email) || !password || password !== confirmPassword}
              sx={{ mt: 3, mb: 2 }}
            >
              {isSubmitting ? (
                <CircularProgress size={24} color="inherit" />
              ) : 'Register'}
            </Button>
            
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Already have an account?{' '}
                <Link 
                  href="#" 
                  variant="body2" 
                  onClick={switchToLogin}
                >
                  Sign in
                </Link>
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}