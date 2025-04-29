import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Link from '@mui/material/Link';
import GitHubIcon from '@mui/icons-material/GitHub';
import TwitterIcon from '@mui/icons-material/Twitter';
import EmailIcon from '@mui/icons-material/Email';

function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <Box
      component="footer"
      sx={{
        py: 6,
        px: 2,
        mt: 'auto',
        backgroundColor: (theme) => theme.palette.grey[900],
        color: 'white',
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Typography variant="h6" gutterBottom>
              Checklist Manifesto
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ color: 'grey.400' }}>
              A modern task management application built with Meteor, React, and FHIR.
              MIT Licensed open source project.
            </Typography>
            <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
              <Link href="https://github.com/clinical-meteor/checklist-manifesto-3" target="_blank" color="inherit">
                <GitHubIcon />
              </Link>
              <Link href="https://twitter.com/yourusername" target="_blank" color="inherit">
                <TwitterIcon />
              </Link>
              <Link href="mailto:your.email@example.com" color="inherit">
                <EmailIcon />
              </Link>
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="h6" gutterBottom>
              Resources
            </Typography>
            <Box component="ul" sx={{ pl: 0, listStyle: 'none' }}>
              <Box component="li" sx={{ mb: 1 }}>
                <Link href="https://www.meteor.com/" target="_blank" color="inherit">
                  Meteor Framework
                </Link>
              </Box>
              <Box component="li" sx={{ mb: 1 }}>
                <Link href="https://www.hl7.org/fhir/task.html" target="_blank" color="inherit">
                  FHIR Task Resource
                </Link>
              </Box>
              <Box component="li" sx={{ mb: 1 }}>
                <Link href="https://mui.com/" target="_blank" color="inherit">
                  Material UI
                </Link>
              </Box>
              <Box component="li" sx={{ mb: 1 }}>
                <Link href="https://12factor.net/" target="_blank" color="inherit">
                  12-Factor App Methodology
                </Link>
              </Box>
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="h6" gutterBottom>
              Legal
            </Typography>
            <Box component="ul" sx={{ pl: 0, listStyle: 'none' }}>
              <Box component="li" sx={{ mb: 1 }}>
                <Link href="#" color="inherit">
                  MIT License
                </Link>
              </Box>
              {/* <Box component="li" sx={{ mb: 1 }}>
                <Link href="#" color="inherit">
                  Privacy Policy
                </Link>
              </Box>
              <Box component="li" sx={{ mb: 1 }}>
                <Link href="#" color="inherit">
                  Terms of Use
                </Link>
              </Box> */}
              <Box component="li" sx={{ mb: 1 }}>
                <Typography variant="body2" color="text.secondary" sx={{ color: 'grey.400' }}>
                  This project is not affiliated with Atul Gawande or his book "The Checklist Manifesto".  Go buy Atul's book anyway.  
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
        
      </Container>
    </Box>
  );
}

export default Footer;