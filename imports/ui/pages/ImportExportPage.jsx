// imports/ui/pages/ImportExportPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Container, 
  Typography, 
  Paper, 
  Button, 
  Tabs, 
  Tab, 
  Divider,
  Breadcrumbs,
  Link
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

// Import the task data exporter component
import TaskDataExporter from '../components/TaskDataExporter';

/**
 * Import/Export page for importing and exporting task data
 */
export default function ImportExportPage() {
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  // Navigate back to the task list
  const handleBack = () => {
    navigate('/');
  };
  
  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
          sx={{ mb: 2 }}
        >
          Back to Tasks
        </Button>
        
        <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
          <Link 
            color="inherit" 
            onClick={handleBack}
            sx={{ cursor: 'pointer' }}
          >
            Tasks
          </Link>
          <Typography color="text.primary">Import & Export</Typography>
        </Breadcrumbs>
        
        <Typography variant="h4" component="h1" gutterBottom>
          Import & Export Tasks
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Import and export your tasks in various formats including FHIR Task resources
        </Typography>
      </Box>
      
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="fullWidth"
          aria-label="Import/Export tabs"
        >
          <Tab label="Export" id="export-tab" aria-controls="export-panel" />
          <Tab label="Import" id="import-tab" aria-controls="import-panel" />
        </Tabs>
        
        <Divider />
        
        <Box role="tabpanel" hidden={tabValue !== 0} id="export-panel" aria-labelledby="export-tab">
          {tabValue === 0 && (
            <Box p={3}>
              <TaskDataExporter defaultMode="export" />
            </Box>
          )}
        </Box>
        
        <Box role="tabpanel" hidden={tabValue !== 1} id="import-panel" aria-labelledby="import-tab">
          {tabValue === 1 && (
            <Box p={3}>
              <TaskDataExporter defaultMode="import" />
            </Box>
          )}
        </Box>
      </Paper>
    </Container>
  );
}