// imports/ui/App.jsx
import React, { useState } from 'react';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { get } from 'lodash';

// Material UI components
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';

// Import icons
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AssignmentIcon from '@mui/icons-material/Assignment';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';

// Import app components
import { TaskForm } from './TaskForm';
import { TaskList } from './TaskList';
import { LoginForm } from './LoginForm';

export function App() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [filter, setFilter] = useState('all');

  // Track user authentication and loading states
  const { user, isLoading } = useTracker(() => {
    // Check if user is logged in via session storage
    const isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true';
    const userId = sessionStorage.getItem('userId');
    const username = sessionStorage.getItem('username');
    
    if (isLoggedIn && userId && username) {
      return {
        isLoading: false,
        user: {
          _id: userId,
          username: username
        }
      };
    }
    
    return {
      isLoading: false,
      user: null
    };
  });

  // Handle drawer toggle
  function handleDrawerToggle() {
    setDrawerOpen(!drawerOpen);
  }

  // Handle logout
  function handleLogout() {
    setDrawerOpen(false);
    // Clear session storage
    sessionStorage.removeItem('isLoggedIn');
    sessionStorage.removeItem('userId');
    sessionStorage.removeItem('username');
    // Reload page to update UI
    window.location.reload();
  }

  // Handle filter changes
  function handleFilterChange(newFilter) {
    setFilter(newFilter);
    setDrawerOpen(false);
  }

  // Render loading state
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Render login form if not authenticated
  if (!user) {
    return <LoginForm />;
  }

  // Render main application with authenticated user
  return (
    <div className="app-container">
      <AppBar position="static">
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={handleDrawerToggle}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Checklist Manifesto
          </Typography>
          <Button color="inherit" onClick={handleLogout}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      {/* Sidebar navigation drawer */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={handleDrawerToggle}
      >
        <Box
          sx={{ width: 250 }}
          role="presentation"
        >
          <List>
            <ListItem>
              <Typography variant="subtitle1">
                {get(user, 'username', 'User')}
              </Typography>
            </ListItem>
            <Divider />
            <ListItem button onClick={() => handleFilterChange('all')}>
              <ListItemIcon>
                <AssignmentIcon />
              </ListItemIcon>
              <ListItemText primary="All Tasks" />
            </ListItem>
            <ListItem button onClick={() => handleFilterChange('active')}>
              <ListItemIcon>
                <PriorityHighIcon />
              </ListItemIcon>
              <ListItemText primary="Active Tasks" />
            </ListItem>
            <ListItem button onClick={() => handleFilterChange('completed')}>
              <ListItemIcon>
                <CheckCircleIcon />
              </ListItemIcon>
              <ListItemText primary="Completed Tasks" />
            </ListItem>
            <ListItem button onClick={() => handleFilterChange('due-soon')}>
              <ListItemIcon>
                <AccessTimeIcon />
              </ListItemIcon>
              <ListItemText primary="Due Soon" />
            </ListItem>
            <Divider />
            <ListItem button onClick={handleLogout}>
              <ListItemIcon>
                <ExitToAppIcon />
              </ListItemIcon>
              <ListItemText primary="Logout" />
            </ListItem>
          </List>
        </Box>
      </Drawer>

      {/* Main content */}
      <Container className="main-content">
        <TaskForm />
        <Box sx={{ mt: 3 }}>
          <TaskList filter={filter} />
        </Box>
      </Container>
    </div>
  );
}