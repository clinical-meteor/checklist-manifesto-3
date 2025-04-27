// imports/ui/components/SideDrawer.jsx
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTracker } from 'meteor/react-meteor-data';
import { Meteor } from 'meteor/meteor';
import { 
  Box,
  Drawer,
  List,
  Divider,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Typography,
  Toolbar
} from '@mui/material';

// Icons
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import HomeIcon from '@mui/icons-material/Home';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import ImportExportIcon from '@mui/icons-material/ImportExport';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import InfoIcon from '@mui/icons-material/Info';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';

const drawerWidth = 240;

export default function SideDrawer({ open, onClose, user }) {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Event handlers
  const handleNavigate = (path) => {
    navigate(path);
    onClose();
  };
  
  const handleLogout = () => {
    Meteor.logout(() => {
      navigate('/login');
    });
    onClose();
  };
  
  // Helper to check if a route is active
  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };
  
  return (
    <Drawer
      id="sidebarMenuContents"
      variant="temporary"
      open={open}
      onClose={onClose}
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
        },
      }}
    >
      {/* Drawer Header */}
      <Toolbar sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', px: 1 }}>
        <IconButton onClick={onClose}>
          <ChevronLeftIcon />
        </IconButton>
      </Toolbar>
      
      <Divider />
      
      {/* Main Navigation */}
      <List>
        <ListItem disablePadding>
          <ListItemButton
            selected={isActive('/')}
            onClick={() => handleNavigate('/')}
            id="homeLink"
          >
            <ListItemIcon>
              <HomeIcon />
            </ListItemIcon>
            <ListItemText primary="Home" />
          </ListItemButton>
        </ListItem>
        
        {/* Task Filters */}
        <ListItem disablePadding>
          <ListItemButton
            selected={isActive('/tasks/active')}
            onClick={() => handleNavigate('/tasks/active')}
          >
            <ListItemIcon>
              <PendingIcon />
            </ListItemIcon>
            <ListItemText primary="Active Tasks" />
          </ListItemButton>
        </ListItem>
        
        <ListItem disablePadding>
          <ListItemButton
            selected={isActive('/tasks/completed')}
            onClick={() => handleNavigate('/tasks/completed')}
          >
            <ListItemIcon>
              <CheckCircleIcon />
            </ListItemIcon>
            <ListItemText primary="Completed Tasks" />
          </ListItemButton>
        </ListItem>
        
        <ListItem disablePadding>
          <ListItemButton
            selected={isActive('/tasks/due-soon')}
            onClick={() => handleNavigate('/tasks/due-soon')}
          >
            <ListItemIcon>
              <AccessTimeIcon />
            </ListItemIcon>
            <ListItemText primary="Due Soon" />
          </ListItemButton>
        </ListItem>
      </List>
      
      <Divider />
      
      {/* Second Group */}
      <List>
        <ListItem disablePadding>
          <ListItemButton
            selected={isActive('/protocols')}
            onClick={() => handleNavigate('/protocols')}
            id="protocolLibraryLink"
          >
            <ListItemIcon>
              <MenuBookIcon />
            </ListItemIcon>
            <ListItemText primary="Protocol Library" />
          </ListItemButton>
        </ListItem>
        
        {user && (
          <ListItem disablePadding>
            <ListItemButton
              selected={isActive('/import-export')}
              onClick={() => handleNavigate('/import-export')}
            >
              <ListItemIcon>
                <ImportExportIcon />
              </ListItemIcon>
              <ListItemText primary="Import/Export" />
            </ListItemButton>
          </ListItem>
        )}
      </List>
      
      <Divider />
      
      {/* User Actions */}
      <List>
        {user && (
          <>
            <ListItem disablePadding>
              <ListItemButton
                onClick={() => handleNavigate('/')}
                id="newListButton"
              >
                <ListItemIcon>
                  <AddCircleOutlineIcon />
                </ListItemIcon>
                <ListItemText primary="New List" />
              </ListItemButton>
            </ListItem>
            
            <ListItem disablePadding>
              <ListItemButton
                onClick={handleLogout}
                id="logoutButton"
              >
                <ListItemIcon>
                  <ExitToAppIcon />
                </ListItemIcon>
                <ListItemText primary="Logout" />
              </ListItemButton>
            </ListItem>
          </>
        )}
        
        {!user && (
          <ListItem disablePadding>
            <ListItemButton
              onClick={() => handleNavigate('/login')}
            >
              <ListItemIcon>
                <ExitToAppIcon />
              </ListItemIcon>
              <ListItemText primary="Login" />
            </ListItemButton>
          </ListItem>
        )}
      </List>
      
      {/* Connection Status */}
      <Box sx={{ mt: 'auto', p: 2, textAlign: 'center' }} id="connectionStatusPanel">
        <Typography variant="caption" color="text.secondary">
          {Meteor.status().connected ? 'Connected' : 'Disconnected'}
        </Typography>
      </Box>
    </Drawer>
  );
}