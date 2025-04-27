// imports/ui/ImportExportDialog.jsx
import React, { useState, useEffect } from 'react';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { get } from 'lodash';
import { TasksCollection } from '/imports/db/TasksCollection';

// Material UI components
import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Paper from '@mui/material/Paper';
import Tooltip from '@mui/material/Tooltip';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';

// Icons
import CloseIcon from '@mui/icons-material/Close';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DownloadIcon from '@mui/icons-material/Download';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import FileUploadIcon from '@mui/icons-material/FileUpload';

// Panel components
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`import-export-tabpanel-${index}`}
      aria-labelledby={`import-export-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export function ImportExportDialog({ open, onClose }) {
  // Tab state
  const [tabValue, setTabValue] = useState(0);
  
  // Export state
  const [exportFormat, setExportFormat] = useState('fhirBundle');
  const [exportData, setExportData] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [wordWrap, setWordWrap] = useState(false);
  
  // Import state
  const [importData, setImportData] = useState('');
  const [importFormat, setImportFormat] = useState('fhirBundle');
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  
  // File upload state
  const [isDragging, setIsDragging] = useState(false);
  
  // Fetch task data for export
  const { tasks, tasksReady } = useTracker(function() {
    const tasksSub = Meteor.subscribe('tasks.mine');
    
    return {
      tasksReady: tasksSub.ready(),
      tasks: TasksCollection.find(
        { isDeleted: { $ne: true } },
        { sort: { lastModified: -1 } }
      ).fetch()
    };
  });

  // Handle tab change
  function handleTabChange(event, newValue) {
    setTabValue(newValue);
  }
  
  // Handle export format change
  function handleExportFormatChange(event) {
    setExportFormat(event.target.value);
  }
  
  // Handle export request
  function handleExport() {
    setIsExporting(true);
    
    try {
      if (exportFormat === 'fhirBundle') {
        // Create a FHIR Bundle
        const bundle = {
          resourceType: 'Bundle',
          type: 'collection',
          entry: tasks.map(task => ({
            resource: prepareTaskForExport(task)
          }))
        };
        
        setExportData(JSON.stringify(bundle, null, 2));
      } else if (exportFormat === 'ndjson') {
        // Create NDJSON
        const ndjson = tasks
          .map(task => JSON.stringify(prepareTaskForExport(task)))
          .join('\n');
        
        setExportData(ndjson);
      }
    } catch (error) {
      console.error('Export error:', error);
      setExportData(`Error generating export: ${error.message}`);
    } finally {
      setIsExporting(false);
    }
  }
  
  // Clean up task data for export (remove _id and other Meteor-specific fields)
  function prepareTaskForExport(task) {
    const cleanTask = { ...task };
    
    // Remove MongoDB _id
    delete cleanTask._id;
    
    // Ensure all FHIR Task mandatory fields are present
    cleanTask.resourceType = 'Task';
    
    // Convert references to proper FHIR references if needed
    if (cleanTask.requester && !cleanTask.requester.startsWith('Practitioner/')) {
      cleanTask.requester = {
        reference: `Practitioner/${cleanTask.requester}`
      };
    }
    
    if (cleanTask.owner && !cleanTask.owner.startsWith('Practitioner/')) {
      cleanTask.owner = {
        reference: `Practitioner/${cleanTask.owner}`
      };
    }
    
    // Remove Meteor-specific fields
    delete cleanTask.isDeleted;
    
    return cleanTask;
  }
  
  // Handle copy to clipboard
  function handleCopyToClipboard() {
    navigator.clipboard.writeText(exportData).then(() => {
      // Show temporary success message
      const exportTextArea = document.getElementById('export-data');
      if (exportTextArea) {
        const originalValue = exportTextArea.value;
        exportTextArea.value = 'Copied to clipboard!';
        setTimeout(() => {
          exportTextArea.value = originalValue;
        }, 1000);
      }
    }).catch(err => {
      console.error('Could not copy text: ', err);
    });
  }
  
  // Handle download file
  function handleDownloadFile() {
    const fileExtension = exportFormat === 'fhirBundle' ? 'json' : 'ndjson';
    const filename = `tasks-export.${fileExtension}`;
    const blob = new Blob([exportData], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
  
  // Handle import format change
  function handleImportFormatChange(event) {
    setImportFormat(event.target.value);
  }
  
  // Handle import request
  function handleImport() {
    setIsImporting(true);
    setImportError('');
    setImportSuccess('');
    
    try {
      let tasksToImport = [];
      
      if (importFormat === 'fhirBundle') {
        // Parse FHIR Bundle
        const bundle = JSON.parse(importData);
        
        if (bundle.resourceType !== 'Bundle') {
          throw new Error('Invalid FHIR Bundle format. Expected a Bundle resource.');
        }
        
        tasksToImport = (bundle.entry || [])
          .map(entry => entry.resource)
          .filter(resource => resource.resourceType === 'Task');
          
      } else if (importFormat === 'ndjson') {
        // Parse NDJSON
        tasksToImport = importData
          .split('\n')
          .filter(line => line.trim() !== '')
          .map(line => JSON.parse(line))
          .filter(resource => resource.resourceType === 'Task');
      }
      
      if (tasksToImport.length === 0) {
        throw new Error('No valid Task resources found in the import data.');
      }
      
      // Call server method to import tasks
      Meteor.call('tasks.importMultiple', tasksToImport, (error, result) => {
        setIsImporting(false);
        
        if (error) {
          console.error('Import error:', error);
          setImportError(error.message || 'Failed to import tasks.');
        } else {
          setImportSuccess(`Successfully imported ${result.imported} tasks.`);
          setImportData('');
        }
      });
    } catch (error) {
      console.error('Import parsing error:', error);
      setImportError(`Error parsing import data: ${error.message}`);
      setIsImporting(false);
    }
  }
  
  // File upload handlers
  function handleDragOver(event) {
    event.preventDefault();
    setIsDragging(true);
  }
  
  function handleDragLeave() {
    setIsDragging(false);
  }
  
  function handleDrop(event) {
    event.preventDefault();
    setIsDragging(false);
    setImportError('');
    
    const files = event.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      
      // Auto-detect format from file extension
      if (file.name.endsWith('.ndjson')) {
        setImportFormat('ndjson');
      } else {
        setImportFormat('fhirBundle');
      }
      
      const reader = new FileReader();
      reader.onload = function(e) {
        setImportData(e.target.result);
      };
      reader.onerror = function() {
        setImportError('Error reading file');
      };
      reader.readAsText(file);
    }
  }
  
  function handleFileInputChange(event) {
    const file = event.target.files[0];
    if (file) {
      // Auto-detect format from file extension
      if (file.name.endsWith('.ndjson')) {
        setImportFormat('ndjson');
      } else {
        setImportFormat('fhirBundle');
      }
      
      const reader = new FileReader();
      reader.onload = function(e) {
        setImportData(e.target.result);
      };
      reader.onerror = function() {
        setImportError('Error reading file');
      };
      reader.readAsText(file);
    }
  }

  // Set up export data when tasks change
  useEffect(function() {
    if (tasksReady && tabValue === 0) {
      handleExport();
    }
  }, [tasksReady, exportFormat, tabValue]);
  
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      aria-labelledby="import-export-dialog-title"
    >
      <DialogTitle id="import-export-dialog-title">
        Import/Export Tasks
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="import export tabs">
          <Tab label="Export" />
          <Tab label="Import" />
        </Tabs>
      </Box>
      
      <DialogContent dividers>
        {/* Export Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ mb: 3 }}>
            <FormControl fullWidth>
              <InputLabel id="export-format-label">Export Format</InputLabel>
              <Select
                labelId="export-format-label"
                value={exportFormat}
                label="Export Format"
                onChange={handleExportFormatChange}
              >
                <MenuItem value="fhirBundle">FHIR Bundle (JSON)</MenuItem>
                <MenuItem value="ndjson">NDJSON (Newline Delimited JSON)</MenuItem>
              </Select>
            </FormControl>
          </Box>
          
          <Box sx={{ position: 'relative' }}>
            <TextField
              id="export-data"
              label="Export Data"
              multiline
              rows={15}
              value={isExporting ? 'Generating export...' : exportData}
              fullWidth
              variant="outlined"
              InputProps={{
                readOnly: true,
              }}
            />
            
            {isExporting && (
              <Box sx={{ 
                position: 'absolute', 
                top: 0, 
                left: 0, 
                right: 0, 
                bottom: 0, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.7)' 
              }}>
                <CircularProgress />
              </Box>
            )}
          </Box>
          
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Button 
              startIcon={<ContentCopyIcon />}
              onClick={handleCopyToClipboard}
              disabled={!exportData || isExporting}
            >
              Copy to Clipboard
            </Button>
            
            <Button 
              startIcon={<DownloadIcon />}
              onClick={handleDownloadFile}
              variant="contained"
              disabled={!exportData || isExporting}
            >
              Download File
            </Button>
          </Box>
        </TabPanel>
        
        {/* Import Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ mb: 3 }}>
            <FormControl fullWidth>
              <InputLabel id="import-format-label">Import Format</InputLabel>
              <Select
                labelId="import-format-label"
                value={importFormat}
                label="Import Format"
                onChange={handleImportFormatChange}
              >
                <MenuItem value="fhirBundle">FHIR Bundle (JSON)</MenuItem>
                <MenuItem value="ndjson">NDJSON (Newline Delimited JSON)</MenuItem>
              </Select>
            </FormControl>
          </Box>
          
          {importError && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {importError}
            </Alert>
          )}
          
          {importSuccess && (
            <Alert severity="success" sx={{ mb: 3 }}>
              {importSuccess}
            </Alert>
          )}
          
          <Box
            sx={{
              mb: 3,
              border: '2px dashed',
              borderColor: isDragging ? 'primary.main' : 'divider',
              borderRadius: 1,
              p: 3,
              textAlign: 'center',
              backgroundColor: isDragging ? 'action.hover' : 'background.paper',
              transition: 'all 0.3s'
            }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <CloudUploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="body1" gutterBottom>
              Drag and drop a file here, or
            </Typography>
            <Button
              component="label"
              variant="outlined"
              startIcon={<UploadFileIcon />}
            >
              Choose File
              <input
                type="file"
                accept=".json,.ndjson"
                hidden
                onChange={handleFileInputChange}
              />
            </Button>
          </Box>
          
          <Divider sx={{ my: 2 }}>
            <Typography variant="body2" color="text.secondary">
              OR
            </Typography>
          </Divider>
          
          <TextField
            label="Paste Import Data"
            multiline
            rows={10}
            value={importData}
            onChange={(e) => setImportData(e.target.value)}
            fullWidth
            variant="outlined"
            placeholder={importFormat === 'fhirBundle' ? 
              '{"resourceType": "Bundle", "type": "collection", "entry": [...]}' : 
              '{"resourceType": "Task", "status": "requested", ...}\n{"resourceType": "Task", ...}'
            }
          />
          
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button 
              startIcon={<FileUploadIcon />}
              onClick={handleImport}
              variant="contained"
              disabled={!importData || isImporting}
            >
              {isImporting ? 'Importing...' : 'Import Tasks'}
            </Button>
          </Box>
        </TabPanel>
      </DialogContent>
      
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}