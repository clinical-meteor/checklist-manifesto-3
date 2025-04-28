import React, { useState, useEffect } from 'react';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { TasksCollection } from '/imports/db/TasksCollection';
import { get, set, cloneDeep } from 'lodash';
import moment from 'moment';

// Material UI components
import {
  Box,
  Paper,
  Typography,
  Grid,
  Tab,
  Tabs,
  Button,
  TextField,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  CircularProgress,
  Card,
  CardContent,
  CardHeader,
  CardActions,
  Snackbar,
  Alert,
  Divider
} from '@mui/material';

// Icons
import FileUploadIcon from '@mui/icons-material/FileUpload';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';
import DeleteIcon from '@mui/icons-material/Delete';
import RefreshIcon from '@mui/icons-material/Refresh';

// DropZone component
import { useDropzone } from 'react-dropzone';

// Editor component
import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/mode-json';
import 'ace-builds/src-noconflict/theme-github';
import 'ace-builds/src-noconflict/theme-monokai';
import 'ace-builds/src-noconflict/ext-language_tools';

export function TaskDataExporter({ defaultMode = 'import' }) {
  // Component state
  const [tabIndex, setTabIndex] = useState(defaultMode === 'export' ? 1 : 0);
  const [exportFormat, setExportFormat] = useState('bundle'); // 'bundle' or 'ndjson'
  const [importData, setImportData] = useState('');
  const [exportData, setExportData] = useState('');
  const [fileName, setFileName] = useState('tasks-export-' + moment().format('YYYY-MM-DD'));
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });
  const [editorKey, setEditorKey] = useState(0); // Used to force re-render of editor

  // Theme from context or default to light
  const theme = get(Meteor, 'settings.public.theme', 'light');

  // Get personal tasks from database (owned by current user)
  const { tasks, tasksLoading } = useTracker(function() {
    const tasksHandle = Meteor.subscribe('tasks.mine');
    
    return {
      tasks: TasksCollection.find(
        { 
          requester: Meteor.userId(), // Only get tasks owned by the current user
          isDeleted: { $ne: true }
        }, 
        { sort: { lastModified: -1 } }
      ).fetch(),
      tasksLoading: !tasksHandle.ready()
    };
  });

  // Handle file dropping
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/json': ['.json'],
      'application/x-ndjson': ['.ndjson', '.phr']
    },
    onDrop: function(acceptedFiles) {
      handleFileUpload(acceptedFiles);
    }
  });

  // Handle file upload
  async function handleFileUpload(files) {
    if (!files || files.length === 0) return;
    
    setIsLoading(true);
    
    try {
      const file = files[0];
      const text = await file.text();
      
      // Detect if it's NDJSON or JSON
      if (file.name.endsWith('.ndjson') || file.name.endsWith('.phr')) {
        // Handle NDJSON format
        setImportData(text);
      } else {
        // Handle JSON format (Bundle or single Task)
        try {
          // Try to format it nicely
          const parsedData = JSON.parse(text);
          setImportData(JSON.stringify(parsedData, null, 2));
        } catch (e) {
          // If parsing fails, just set the raw text
          setImportData(text);
        }
      }
      
      showNotification('File loaded successfully', 'success');
    } catch (error) {
      console.error('Error reading file:', error);
      showNotification('Error reading file: ' + error.message, 'error');
    } finally {
      setIsLoading(false);
    }
  }

  // Generate export data
  function generateExport() {
    setIsLoading(true);
    
    try {
      if (tasks.length === 0) {
        showNotification('No tasks available for export', 'warning');
        setIsLoading(false);
        return;
      }
      
      if (exportFormat === 'bundle') {
        // Create FHIR Bundle
        const bundle = {
          resourceType: 'Bundle',
          type: 'collection',
          meta: {
            lastUpdated: new Date().toISOString()
          },
          entry: tasks.map(function(task) {
            return {
              fullUrl: `Task/${task.id || task._id}`,
              resource: sanitizeTaskForExport(task),
              request: {
                method: 'PUT',
                url: `Task/${task.id || task._id}`
              }
            };
          })
        };
        
        setExportData(JSON.stringify(bundle, null, 2));
      } else {
        // Create NDJSON format (one JSON object per line)
        const ndjson = tasks
          .map(function(task) {
            return JSON.stringify(sanitizeTaskForExport(task));
          })
          .join('\n');
        
        setExportData(ndjson);
      }
      
      // Force editor to update with new format
      setEditorKey(prev => prev + 1);
      
      showNotification(`${tasks.length} tasks prepared for export`, 'success');
    } catch (error) {
      console.error('Error generating export:', error);
      showNotification('Error generating export: ' + error.message, 'error');
    } finally {
      setIsLoading(false);
    }
  }

  // Sanitize task for export (ensure FHIR compliance)
  function sanitizeTaskForExport(task) {
    // Create a deep copy to avoid modifying the original
    const sanitizedTask = cloneDeep(task);
    
    // Ensure resourceType is set
    sanitizedTask.resourceType = 'Task';
    
    // Use id instead of _id for FHIR compliance
    if (sanitizedTask._id && !sanitizedTask.id) {
      sanitizedTask.id = sanitizedTask._id;
    }
    
    // Remove Meteor-specific fields
    delete sanitizedTask._id;
    delete sanitizedTask._document;
    
    // Format dates in ISO format if they exist
    if (sanitizedTask.authoredOn) {
      sanitizedTask.authoredOn = moment(sanitizedTask.authoredOn).toISOString();
    }
    
    if (sanitizedTask.lastModified) {
      sanitizedTask.lastModified = moment(sanitizedTask.lastModified).toISOString();
    }
    
    if (get(sanitizedTask, 'executionPeriod.start')) {
      set(sanitizedTask, 'executionPeriod.start', 
          moment(get(sanitizedTask, 'executionPeriod.start')).toISOString());
    }
    
    if (get(sanitizedTask, 'executionPeriod.end')) {
      set(sanitizedTask, 'executionPeriod.end', 
          moment(get(sanitizedTask, 'executionPeriod.end')).toISOString());
    }
    
    return sanitizedTask;
  }

  // Import tasks from JSON/NDJSON
  async function importTasks() {
    if (!importData.trim()) {
      showNotification('No data to import', 'warning');
      return;
    }
    
    setIsLoading(true);
    
    try {
      let taskResources = [];
      
      // Determine if it's NDJSON (multiple lines) or JSON (single object)
      if (importData.includes('\n')) {
        // Handle NDJSON format (one JSON object per line)
        taskResources = importData
          .split('\n')
          .filter(function(line) { return line.trim(); })
          .map(function(line) { 
            try {
              return JSON.parse(line);
            } catch (e) {
              console.warn('Failed to parse NDJSON line:', e);
              return null;
            }
          })
          .filter(function(resource) { return resource && resource.resourceType === 'Task'; });
      } else {
        // Try to parse as a single JSON
        const parsedData = JSON.parse(importData);
        
        // Check if it's a Bundle
        if (parsedData.resourceType === 'Bundle' && Array.isArray(parsedData.entry)) {
          // Extract resources from bundle
          taskResources = parsedData.entry
            .filter(function(entry) { return get(entry, 'resource.resourceType') === 'Task'; })
            .map(function(entry) { return entry.resource; });
        } else if (parsedData.resourceType === 'Task') {
          // It's a single Task resource
          taskResources = [parsedData];
        } else {
          throw new Error('Imported data is not a valid FHIR Bundle or Task resource');
        }
      }
      
      if (taskResources.length === 0) {
        showNotification('No valid Task resources found in the imported data', 'warning');
        setIsLoading(false);
        return;
      }
      
      // Call the server-side method to import multiple tasks at once
      Meteor.call('tasks.importMultiple', taskResources, function(error, result) {
        setIsLoading(false);
        
        if (error) {
          console.error('Error importing tasks:', error);
          showNotification('Error importing tasks: ' + error.message, 'error');
        } else {
          showNotification(`Successfully imported ${result.imported} tasks`, 'success');
          
          // Clear the import data
          setImportData('');
        }
      });
    } catch (error) {
      console.error('Error importing tasks:', error);
      showNotification('Error importing tasks: ' + error.message, 'error');
      setIsLoading(false);
    }
  }

  // Download the export data as a file
  function downloadExport() {
    if (!exportData) {
      showNotification('No data to download', 'warning');
      return;
    }
    
    // Determine file extension based on format
    const fileExtension = exportFormat === 'bundle' ? '.json' : '.ndjson';
    const fullFileName = fileName + fileExtension;
    
    // Create a Blob with the data
    const blob = new Blob([exportData], { 
      type: exportFormat === 'bundle' ? 'application/json' : 'application/x-ndjson' 
    });
    
    // Create a download URL
    const url = URL.createObjectURL(blob);
    
    // Create a temporary anchor element to trigger the download
    const a = document.createElement('a');
    a.href = url;
    a.download = fullFileName;
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    setTimeout(function() {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 0);
    
    showNotification(`Downloaded ${fullFileName}`, 'success');
  }

  // Copy export data to clipboard
  function copyToClipboard() {
    if (!exportData) {
      showNotification('No data to copy', 'warning');
      return;
    }
    
    navigator.clipboard.writeText(exportData)
      .then(function() {
        showNotification('Export data copied to clipboard', 'success');
      })
      .catch(function(err) {
        console.error('Error copying to clipboard:', err);
        showNotification('Error copying to clipboard', 'error');
      });
  }

  // Handle tab change
  function handleTabChange(event, newValue) {
    setTabIndex(newValue);
  }

  // Handle export format change
  function handleExportFormatChange(event) {
    setExportFormat(event.target.value);
    // Regenerate export with new format
    if (!tasksLoading && tasks.length > 0) {
      generateExport();
    }
  }

  // Show notification
  function showNotification(message, severity) {
    setNotification({
      open: true,
      message,
      severity: severity || 'info'
    });
  }

  // Close notification
  function closeNotification() {
    setNotification({ ...notification, open: false });
  }

  // Clear the editor
  function clearEditor() {
    if (tabIndex === 0) {
      setImportData('');
    } else {
      setExportData('');
    }
  }

  // Generate export automatically when tasks are loaded or format changes
  useEffect(function() {
    if (!tasksLoading && tabIndex === 1 && tasks.length > 0) {
      generateExport();
    }
  }, [tasksLoading, tabIndex, exportFormat]);

  return (
    <Box sx={{ width: '100%' }}>
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabIndex}
          onChange={handleTabChange}
          aria-label="Import/Export tabs"
        >
          <Tab 
            icon={<FileUploadIcon />} 
            iconPosition="start" 
            label="Import" 
          />
          <Tab 
            icon={<FileDownloadIcon />} 
            iconPosition="start" 
            label="Export" 
          />
        </Tabs>
      </Paper>

      {tabIndex === 0 ? (
        // Import Tab
        <Card>
          <CardHeader title="Import Tasks" />
          <CardContent>
            {/* Drop zone */}
            <Box 
              {...getRootProps()} 
              sx={{
                border: '2px dashed',
                borderColor: isDragActive ? 'primary.main' : 'grey.400',
                borderRadius: 2,
                p: 3,
                mb: 3,
                textAlign: 'center',
                backgroundColor: isDragActive ? 'rgba(0, 0, 0, 0.04)' : 'transparent',
                cursor: 'pointer'
              }}
            >
              <input {...getInputProps()} />
              {isDragActive ? (
                <Typography>Drop the files here...</Typography>
              ) : (
                <Typography>
                  Drag and drop JSON or NDJSON files here, or click to select files
                </Typography>
              )}
            </Box>

            <Typography variant="subtitle2" gutterBottom>
              Or paste JSON/NDJSON data below:
            </Typography>
            
            {/* Editor - full width */}
            <Box sx={{ width: '100%', position: 'relative' }}>
              <AceEditor
                mode="json"
                theme={theme === 'dark' ? 'monokai' : 'github'}
                width="100%"
                height="400px"
                value={importData}
                onChange={setImportData}
                name="import-editor"
                editorProps={{ $blockScrolling: true }}
                setOptions={{
                  useWorker: false,
                  showLineNumbers: true,
                  tabSize: 2,
                }}
              />
              
              {isLoading && (
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
            
            {/* Help section - always displayed below editor */}
            <Paper variant="outlined" sx={{ mt: 3, p: 2 }}>
              <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                Import Help
              </Typography>
              
              <Typography variant="subtitle2" gutterBottom>
                Supported formats:
              </Typography>
              <ul>
                <li>
                  <Typography paragraph>
                    FHIR Bundle containing Task resources
                  </Typography>
                </li>
                <li>
                  <Typography paragraph>
                    Single FHIR Task resource
                  </Typography>
                </li>
                <li>
                  <Typography paragraph>
                    NDJSON file with one Task resource per line
                  </Typography>
                </li>
              </ul>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="subtitle2" gutterBottom>
                Example Task (minimal):
              </Typography>
              <Box sx={{ 
                backgroundColor: 'grey.100', 
                p: 2, 
                borderRadius: 1,
                fontSize: '0.85rem',
                fontFamily: 'monospace',
                whiteSpace: 'pre-wrap'
              }}>
{`{
  "resourceType": "Task",
  "status": "requested",
  "description": "Complete project documentation",
  "priority": "routine",
  "executionPeriod": {
    "end": "2025-05-01T00:00:00.000Z"
  }
}`}
              </Box>
            </Paper>
          </CardContent>
          <CardActions>
            <Button 
              startIcon={<DeleteIcon />} 
              onClick={clearEditor}
              disabled={!importData || isLoading}
            >
              Clear
            </Button>
            <Box sx={{ flexGrow: 1 }} />
            <Button
              variant="contained"
              color="primary"
              startIcon={isLoading ? <CircularProgress size={24} /> : <ContentPasteIcon />}
              onClick={importTasks}
              disabled={!importData || isLoading}
            >
              {isLoading ? 'Importing...' : 'Import Tasks'}
            </Button>
          </CardActions>
        </Card>
      ) : (
        // Export Tab
        <Card>
          <CardHeader title="Export Tasks" />
          <CardContent>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="File Name"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  fullWidth
                  disabled={isLoading}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel id="export-format-label">Export Format</InputLabel>
                  <Select
                    labelId="export-format-label"
                    id="export-format-select"
                    value={exportFormat}
                    label="Export Format"
                    onChange={handleExportFormatChange}
                    disabled={isLoading}
                  >
                    <MenuItem value="bundle">FHIR Bundle (.json)</MenuItem>
                    <MenuItem value="ndjson">NDJSON (.ndjson)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle2">
                Export Data: {tasks.length} Personal Tasks
              </Typography>
              <Button
                startIcon={<RefreshIcon />}
                size="small"
                onClick={generateExport}
                disabled={isLoading || tasksLoading || tasks.length === 0}
              >
                Refresh
              </Button>
            </Box>
            
            <Box sx={{ width: '100%', position: 'relative' }}>
              <AceEditor
                key={editorKey} // Force re-render when format changes
                mode={exportFormat === 'ndjson' ? 'text' : 'json'}
                theme={theme === 'dark' ? 'monokai' : 'github'}
                width="100%"
                height="400px"
                value={exportData}
                onChange={setExportData}
                name="export-editor"
                readOnly={false}
                editorProps={{ $blockScrolling: true }}
                setOptions={{
                  useWorker: false,
                  showLineNumbers: true,
                  tabSize: 2,
                }}
              />
              
              {isLoading && (
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
          </CardContent>
          <CardActions>
            <Button 
              startIcon={<DeleteIcon />} 
              onClick={clearEditor}
              disabled={!exportData || isLoading}
            >
              Clear
            </Button>
            <Box sx={{ flexGrow: 1 }} />
            <Button
              startIcon={<ContentCopyIcon />}
              onClick={copyToClipboard}
              disabled={!exportData || isLoading}
              sx={{ mr: 1 }}
            >
              Copy
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={<FileDownloadIcon />}
              onClick={downloadExport}
              disabled={!exportData || isLoading}
            >
              Download
            </Button>
          </CardActions>
        </Card>
      )}

      {/* Notification snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={closeNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={closeNotification}
          severity={notification.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default TaskDataExporter;