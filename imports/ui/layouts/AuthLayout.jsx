// imports/ui/layouts/AuthLayout.jsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import { Box, Container, Paper, Typography } from '@mui/material';

/**
 * Layout for authentication pages (login, register)
 * This layout is used for public, unauthenticated routes
 */
export default function AuthLayout() {
  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        backgroundColor: theme => theme.palette.background.default
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={3}
          sx={{
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Typography
            component="h1"
            variant="h4"
            sx={{ mb: 3, color: 'primary.main', fontWeight: 'bold' }}
          >
            Checklist Manifesto
          </Typography>
          
          {/* Router outlet to render child routes */}
          <Outlet />
        </Paper>
      </Container>
    </Box>
  );
}