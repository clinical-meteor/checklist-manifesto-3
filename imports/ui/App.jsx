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
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';

// Import icons
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AssignmentIcon from '@mui/icons-material/Assignment';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';
import PersonAddIcon from '@mui/icons-material/PersonAdd';

// Import app components
import { TaskForm } from './TaskForm';
import { TaskList } from './TaskList';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';

export function App() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [filter, setFilter] = useState('all');
  const [authTab, setAuthTab] = useState(0); // 0 for login, 1 for register

  // Track user authentication and loading states
  const { user, isLoading } = useTracker(function() {
    // Check if user is logged in via localStorage
    const accessToken = localStorage.getItem('accessToken');
    const userId = localStorage.getItem('userId');
    const username = localStorage.getItem('username');
    
    if (accessToken && userId && username) {
      return {
        isLoading: false,
        user: {
          _id: userId,
          username: username,
          accessToken: accessToken
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
    
    const accessToken = localStorage.getItem('accessToken');
    
    if (accessToken) {
      // Call the logout method
      Meteor.call('accounts.logout', accessToken, function(err) {
        if (err) {
          console.error('Logout error:', err);
        }
        
        // Clear localStorage
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userId');
        localStorage.removeItem('username');
        localStorage.removeItem('isLoggedIn');
        
        // Reload page to update UI
        window.location.reload();
      });
    } else {
      // If no token found, just clear localStorage
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userId');
      localStorage.removeItem('username');
      localStorage.removeItem('isLoggedIn');
      
      // Reload page to update UI
      window.location.reload();
    }
  }

  // Handle filter changes
  function handleFilterChange(newFilter) {
    setFilter(newFilter);
    setDrawerOpen(false);
  }

  // Handle auth tab change
  function handleAuthTabChange(event, newValue) {
    setAuthTab(newValue);
  }

  // Render loading state
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Render authentication screen if not authenticated
  if (!user) {
    return (
      <Container>
        <Box sx={{ width: '100%', mt: 4 }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'center' }}>
            <Tabs value={authTab} onChange={handleAuthTabChange} centered>
              <Tab label="Login" icon={<ExitToAppIcon />} iconPosition="start" />
              <Tab label="Register" icon={<PersonAddIcon />} iconPosition="start" />
            </Tabs>
          </Box>
          
          {authTab === 0 ? (
            <LoginForm onSwitchToRegister={function() { setAuthTab(1); }} />
          ) : (
            <RegisterForm onSwitchToLogin={function() { setAuthTab(0); }} />
          )}
        </Box>
      </Container>
    );
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
            <ListItem button onClick={function() { handleFilterChange('all'); }}>
              <ListItemIcon>
                <AssignmentIcon />
              </ListItemIcon>
              <ListItemText primary="All Tasks" />
            </ListItem>
            <ListItem button onClick={function() { handleFilterChange('active'); }}>
              <ListItemIcon>
                <PriorityHighIcon />
              </ListItemIcon>
              <ListItemText primary="Active Tasks" />
            </ListItem>
            <ListItem button onClick={function() { handleFilterChange('completed'); }}>
              <ListItemIcon>
                <CheckCircleIcon />
              </ListItemIcon>
              <ListItemText primary="Completed Tasks" />
            </ListItem>
            <ListItem button onClick={function() { handleFilterChange('due-soon'); }}>
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