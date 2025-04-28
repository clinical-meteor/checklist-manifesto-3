import React, { useState } from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemButton from '@mui/material/ListItemButton';
import Container from '@mui/material/Container';
import GitHubIcon from '@mui/icons-material/GitHub';

function Header() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const toggleDrawer = function() {
    setDrawerOpen(!drawerOpen);
  };

  const scrollToSection = function(sectionId) {
    document.getElementById(sectionId).scrollIntoView({ behavior: 'smooth' });
    setDrawerOpen(false);
  };

  return (
    <AppBar position="sticky">
      <Container maxWidth="lg">
        <Toolbar disableGutters>
          <Typography
            variant="h6"
            component="div"
            sx={{ flexGrow: 1, display: { xs: 'none', sm: 'block' } }}
          >
            Checklist Manifesto
          </Typography>
          
          {/* Mobile menu icon */}
          <Box sx={{ display: { xs: 'flex', sm: 'none' } }}>
            <IconButton
              size="large"
              edge="start"
              color="inherit"
              aria-label="menu"
              onClick={toggleDrawer}
            >
              <MenuIcon />
            </IconButton>
          </Box>
          
          {/* Desktop navigation */}
          <Box sx={{ display: { xs: 'none', sm: 'flex' } }}>
            <Button color="inherit" onClick={function() { scrollToSection('hero'); }}>
              Home
            </Button>
            <Button color="inherit" onClick={function() { scrollToSection('features'); }}>
              Features
            </Button>
            <Button color="inherit" onClick={function() { scrollToSection('about'); }}>
              About
            </Button>
            <Button 
              color="inherit"
              href="https://github.com/yourusername/checklist-manifesto" 
              target="_blank"
              startIcon={<GitHubIcon />}
            >
              GitHub
            </Button>
          </Box>
        </Toolbar>
      </Container>
      
      {/* Mobile navigation drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={toggleDrawer}
      >
        <Box
          sx={{ width: 250 }}
          role="presentation"
        >
          <List>
            <ListItem disablePadding>
              <ListItemButton onClick={function() { scrollToSection('hero'); }}>
                <ListItemText primary="Home" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton onClick={function() { scrollToSection('features'); }}>
                <ListItemText primary="Features" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton onClick={function() { scrollToSection('about'); }}>
                <ListItemText primary="About" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton 
                component="a" 
                href="https://github.com/yourusername/checklist-manifesto"
                target="_blank"
              >
                <GitHubIcon sx={{ mr: 1 }} />
                <ListItemText primary="GitHub" />
              </ListItemButton>
            </ListItem>
          </List>
        </Box>
      </Drawer>
    </AppBar>
  );
}

export default Header;