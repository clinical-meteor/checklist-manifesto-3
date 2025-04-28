import React, { useState, useEffect } from 'react';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { TasksCollection } from '/imports/db/TasksCollection';
import { get, set } from 'lodash';
import moment from 'moment';

// Material UI components
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import CircularProgress from '@mui/material/CircularProgress';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import CardActions from '@mui/material/CardActions';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Divider from '@mui/material/Divider';

// Icons
import FileUploadIcon from '@mui/icons-material/FileUpload';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';
import DeleteIcon from '@mui/icons-material/Delete';
import CodeIcon from '@mui/icons-material/Code';

// DropZone component
import { useDropzone } from 'react-dropzone';

// Editor component
import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/mode-json';
import 'ace-builds/src-noconflict/theme-github';
import 'ace-builds/src-noconflict/theme-monokai';
import 'ace-builds/src-noconflict/ext-language_tools';

export function TaskDataExporter(props) {
  // Component state
  const [tabIndex, setTabIndex] = useState(0);
  const [exportFormat, setExportFormat] = useState('bundle'); // 'bundle' or 'ndjson'
  const [importData, setImportData] = useState('');
  const [exportData, setExportData] = useState('');
  const [fileName, setFileName] = useState('tasks-export-' + moment().format('YYYY-MM-DD'));
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });

  // Theme from context
  let theme = 'light';
  if (typeof Meteor.useTheme === 'function') {
    const themeContext = Meteor.useTheme();
    theme = themeContext.theme;
  }

  // Get personal tasks from database (owned by current user)
  const { tasks, tasksLoading } = useTracker(() => {
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
    onDrop: acceptedFiles => {
      handleFileUpload(acceptedFiles);
    }
  });

  // Handle file upload
  async function handleFileUpload(files) {
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
          entry: tasks.map(task => ({
            fullUrl: `Task/${task.id || task._id}`,
            resource: sanitizeTaskForExport(task),
            request: {
              method: 'PUT',
              url: `Task/${task.id || task._id}`
            }
          }))
        };
        
        setExportData(JSON.stringify(bundle, null, 2));
      } else {
        // Create NDJSON format (one JSON object per line)
        const ndjson = tasks
          .map(task => JSON.stringify(sanitizeTaskForExport(task)))
          .join('\n');
        
        setExportData(ndjson);
      }
      
      // Switch to the export tab
      setTabIndex(1);
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
    const sanitizedTask = { ...task };
    
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
          .filter(line => line.trim())
          .map(line => JSON.parse(line));
      } else {
        // Try to parse as a single JSON
        const parsedData = JSON.parse(importData);
        
        // Check if it's a Bundle
        if (parsedData.resourceType === 'Bundle' && Array.isArray(parsedData.entry)) {
          // Extract resources from bundle
          taskResources = parsedData.entry
            .filter(entry => get(entry, 'resource.resourceType') === 'Task')
            .map(entry => entry.resource);
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
      
      // Import each task
      const importResults = await Promise.all(
        taskResources.map(taskResource => {
          return new Promise((resolve, reject) => {
            Meteor.call('tasks.import', taskResource, (error, result) => {
              if (error) {
                reject(error);
              } else {
                resolve(result);
              }
            });
          });
        })
      );
      
      showNotification(`Successfully imported ${importResults.length} tasks`, 'success');
      
      // Clear the import data
      setImportData('');
    } catch (error) {
      console.error('Error importing tasks:', error);
      showNotification('Error importing tasks: ' + error.message, 'error');
    } finally {
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
    setTimeout(() => {
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
      .then(() => {
        showNotification('Export data copied to clipboard', 'success');
      })
      .catch(err => {
        console.error('Error copying to clipboard:', err);
        showNotification('Error copying to clipboard', 'error');
      });
  }

  // Handle tab change
  function handleTabChange(event, newValue) {
    setTabIndex(newValue);
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

  // Generate export automatically when tasks are loaded
  useEffect(() => {
    if (!tasksLoading && tabIndex === 1 && !exportData) {
      generateExport();
    }
  }, [tasksLoading, tabIndex, exportFormat]);

  return (
    <Box sx={{ py: 2 }}>
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
        <Grid container spacing={3}>
          <Grid item xs={12} md={7}>
            <Card>
              <CardHeader title="Import Tasks" />
              <CardContent>
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
                  startIcon={<ContentPasteIcon />}
                  onClick={importTasks}
                  disabled={!importData || isLoading}
                >
                  {isLoading ? <CircularProgress size={24} /> : 'Import Tasks'}
                </Button>
              </CardActions>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={5}>
            <Card>
              <CardHeader title="Import Help" />
              <CardContent>
                <Typography variant="subtitle2" gutterBottom>
                  Supported formats:
                </Typography>
                <Typography paragraph>
                  • FHIR Bundle containing Task resources
                </Typography>
                <Typography paragraph>
                  • Single FHIR Task resource
                </Typography>
                <Typography paragraph>
                  • NDJSON file with one Task resource per line
                </Typography>
                
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
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      ) : (
        // Export Tab
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardHeader title="Export Tasks" />
              <CardContent>
                <Box sx={{ mb: 3 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        label="File Name"
                        value={fileName}
                        onChange={(e) => setFileName(e.target.value)}
                        fullWidth
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
                          onChange={(e) => setExportFormat(e.target.value)}
                        >
                          <MenuItem value="bundle">FHIR Bundle (.json)</MenuItem>
                          <MenuItem value="ndjson">NDJSON (.ndjson)</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                </Box>
                
                <Typography variant="subtitle2" gutterBottom>
                  Export Data: {tasks.length} Personal Tasks
                </Typography>
                
                <AceEditor
                  mode="json"
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
                  {isLoading ? <CircularProgress size={24} /> : 'Download'}
                </Button>
              </CardActions>
            </Card>
          </Grid>
        </Grid>
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