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
import Container from '@mui/material/Container';

export function LoginForm() {
  // Form state
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('password');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle manual login
  function handleLogin() {
    setIsSubmitting(true);
    setError('');
    
    if (!username || !password) {
      setError('Username and password are required');
      setIsSubmitting(false);
      return;
    }
    
    // For the demo, we'll use a direct approach to log in
    // This bypasses Meteor.loginWithPassword which isn't available in Meteor v3 API
    try {
      // Call the server method to log in
      Meteor.call('login', { username, password }, (err, result) => {
        setIsSubmitting(false);
        
        if (err) {
          console.error('Login error:', err);
          setError('Login failed. Please check your credentials and try again.');
        } else if (result && result.userId) {
          // Login successful - store user ID in session
          sessionStorage.setItem('userId', result.userId);
          sessionStorage.setItem('username', username);
          sessionStorage.setItem('isLoggedIn', 'true');
          
          // Force reload to update UI
          window.location.reload();
        } else {
          setError('Login failed. Please try again.');
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      setError('An unexpected error occurred. Please try again.');
      setIsSubmitting(false);
    }
  }

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
            
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}
            
            <Box component="form" onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>
              <TextField
                label="Username"
                type="text"
                variant="outlined"
                fullWidth
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={isSubmitting}
                margin="normal"
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
            </Box>
            
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                Demo account: admin / password
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                Note: This is a simplified demo. In a real application, proper authentication would be implemented.
              </Typography>
            </Alert>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
}