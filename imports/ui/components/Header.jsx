// imports/ui/components/Header.jsx
import React, { useState } from 'react';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { useNavigate } from 'react-router-dom';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  IconButton, 
  Button,
  Menu,
  MenuItem,
  Box
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { Session } from 'meteor/session';

export default function Header({ drawerOpen, handleDrawerToggle }) {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  
  // Track user authentication and theme
  const { user, theme } = useTracker(() => ({
    user: Meteor.user(),
    theme: Session.get('theme') || 'light'
  }));
  
  // Toggle theme
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    Session.set('theme', newTheme);
  };
  
  // Menu handlers
  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };
  
  const handleLogout = () => {
    handleClose();
    Meteor.logout(() => {
      navigate('/login');
    });
  };
  
  return (
    <AppBar 
      position="fixed" 
      sx={{ 
        zIndex: (theme) => theme.zIndex.drawer + 1,
        transition: (theme) => theme.transitions.create(['width', 'margin'], {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.leavingScreen,
        }),
      }}
    >
      <Toolbar>
        <IconButton
          color="inherit"
          aria-label="open drawer"
          onClick={handleDrawerToggle}
          edge="start"
          sx={{ mr: 2 }}
        >
          <MenuIcon />
        </IconButton>
        
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }} id="headerTitle">
          Checklist Manifesto
        </Typography>
        
        {/* Theme toggle */}
        <IconButton color="inherit" onClick={toggleTheme} sx={{ mr: 1 }}>
          {theme === 'light' ? <Brightness4Icon /> : <Brightness7Icon />}
        </IconButton>
        
        {/* User menu */}
        {user ? (
          <Box>
            <IconButton
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleMenu}
              color="inherit"
              id="usernameLink"
            >
              <AccountCircleIcon />
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorEl)}
              onClose={handleClose}
            >
              <MenuItem disabled>
                {user.username || (user.emails && user.emails[0].address)}
              </MenuItem>
              <MenuItem onClick={handleLogout} id="logoutButton">Logout</MenuItem>
            </Menu>
          </Box>
        ) : (
          <Button 
            color="inherit" 
            onClick={() => navigate('/login')}
            id="usernameLink"
          >
            Sign In
          </Button>
        )}
      </Toolbar>
    </AppBar>
  );
}