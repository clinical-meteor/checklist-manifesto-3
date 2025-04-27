// imports/ui/layouts/MainLayout.jsx
import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useTracker } from 'meteor/react-meteor-data';
import { Box, CssBaseline } from '@mui/material';

// Components
import Header from '../components/Header';
import SideDrawer from '../components/SideDrawer';

/**
 * Main application layout with header, sidebar, and content area
 * This layout is used for authenticated routes
 */
export default function MainLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();
  
  // Track user data
  const { user } = useTracker(() => ({
    user: Meteor.user()
  }));

  // Handle drawer open/close
  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      <CssBaseline />
      
      {/* App Header */}
      <Header 
        drawerOpen={drawerOpen} 
        handleDrawerToggle={handleDrawerToggle} 
      />
      
      {/* Sidebar */}
      <SideDrawer 
        open={drawerOpen} 
        onClose={() => setDrawerOpen(false)}
        user={user}
      />
      
      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerOpen ? 240 : 0}px)` },
          mt: '64px', // Account for header height
          overflow: 'auto',
          transition: theme => theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          backgroundColor: theme => theme.palette.background.default,
        }}
      >
        {/* Router outlet to render child routes */}
        <Outlet />
      </Box>
    </Box>
  );
}