import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Link from '@mui/material/Link';

function About() {
  return (
    <Box id="about" sx={{ py: 8, bgcolor: '#f7f9fc' }}>
      <Container maxWidth="lg">
        <Typography
          component="h2"
          variant="h3"
          align="center"
          color="text.primary"
          gutterBottom
        >
          About the Project
        </Typography>
        
        <Grid container spacing={6} sx={{ mt: 2 }}>
          <Grid item xs={12} md={6}>
            <Typography variant="h5" gutterBottom color="primary.main">
              Inspiration
            </Typography>
            <Typography variant="body1" paragraph>
              This project is inspired by Atul Gawande's book "The Checklist Manifesto: How to Get Things Right". The book demonstrates how checklists can dramatically reduce errors and improve outcomes in various fields, from medicine to aviation.
            </Typography>
            <Typography variant="body1" paragraph>
              We highly recommend purchasing and reading the book to understand the profound impact that well-designed checklists can have on complex tasks.
            </Typography>
            <Button 
              variant="outlined" 
              href="https://www.amazon.com/Checklist-Manifesto-How-Things-Right/dp/0312430000"
              target="_blank"
              sx={{ mt: 2 }}
            >
              Buy the Book
            </Button>
            
            <Divider sx={{ my: 4 }} />
            
            <Typography variant="h5" gutterBottom color="primary.main">
              Technical Implementation
            </Typography>
            <Typography variant="body1" paragraph>
              This project serves as a coding exercise and starter template, demonstrating:
            </Typography>
            <Box component="ul" sx={{ pl: 2 }}>
              <Box component="li">
                <Typography variant="body1">Modern Meteor v3 application architecture</Typography>
              </Box>
              <Box component="li">
                <Typography variant="body1">React with Material UI for accessible interfaces</Typography>
              </Box>
              <Box component="li">
                <Typography variant="body1">Implementation of FHIR resources in a web application</Typography>
              </Box>
              <Box component="li">
                <Typography variant="body1">12-Factor app methodology for cloud-native deployment</Typography>
              </Box>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card elevation={3} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardMedia
                component="img"
                height="240"
                image="https://www.hl7.org/fhir/assets/images/fhir-logo-www.png"
                alt="FHIR Logo"
                sx={{objectFit: 'contain'}}
              />
              <CardContent>
                <Typography variant="h5" component="div" gutterBottom>
                  Built with FHIR
                </Typography>
                <Typography variant="body1" color="text.secondary" paragraph>
                  The application implements a simplified version of the <Link href="https://www.hl7.org/fhir/task.html" target="_blank">FHIR Task Resource</Link>, demonstrating how healthcare standards can be integrated into everyday applications.
                </Typography>
                <Typography variant="body1" color="text.secondary" paragraph>
                  FHIR (Fast Healthcare Interoperability Resources) is a standard for healthcare data exchange, providing a way to represent and exchange clinical data in a consistent manner.
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
                  This project is provided as-is, as a learning resource and starting point. It is not intended for clinical use without proper validation and certification.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

export default About;