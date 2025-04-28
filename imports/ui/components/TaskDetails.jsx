// imports/ui/components/TaskDetails.jsx - Fixed version
import React, { useState, useEffect } from 'react';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { get, set } from 'lodash';
import moment from 'moment';
import { TasksCollection } from '/imports/db/TasksCollection';
import { formatDateTime, isTaskOverdue } from '/imports/utils/dateHelpers';

// Material UI components
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Chip from '@mui/material/Chip';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Grid from '@mui/material/Grid';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import CircularProgress from '@mui/material/CircularProgress';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import Alert from '@mui/material/Alert';

// Icons
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AddCommentIcon from '@mui/icons-material/AddComment';

// Import components with correct named exports
import ModifyProtocolDialog from './ModifyProtocolDialog';
import SaveAltIcon from '@mui/icons-material/SaveAlt';
import PublicIcon from '@mui/icons-material/Public';

import { useNavigate } from 'react-router-dom';

function TaskDetails({ taskId, open, onClose, isProtocol = false }) {
  const navigate = useNavigate();
  
  // State for the form
  const [isEditing, setIsEditing] = useState(false);
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [dueDate, setDueDate] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const [protocolDialogOpen, setProtocolDialogOpen] = useState(false);

  // Fetch task data
  const { task, isLoading, currentUser } = useTracker(function() {
    const noData = { task: null, isLoading: false, currentUser: null };
    
    if (!taskId) {
      return noData;
    }

    // Choose the appropriate subscription based on isProtocol flag
    const taskSub = isProtocol ? 
      Meteor.subscribe('protocols.single', taskId) : 
      Meteor.subscribe('tasks.byId', taskId);
    
    const userSub = Meteor.subscribe('userData');
    
    if (!taskSub.ready() || !userSub.ready()) {
      return { ...noData, isLoading: true };
    }

    const taskData = TasksCollection.findOne(taskId);
    const user = Meteor.user();
    
    return {
      task: taskData,
      isLoading: false,
      currentUser: user
    };
  }, [taskId, isProtocol]);

  // Initialize form state when task data is loaded
  useEffect(() => {
    if (task && !isEditing) {
      setDescription(task.description || '');
      setStatus(task.status || '');
      setPriority(task.priority || 'routine');
      setDueDate(get(task, 'executionPeriod.end') ? moment(get(task, 'executionPeriod.end')) : null);
      setIsPublic(!!task.public);
    }
  }, [task, isEditing]);

  // Reset form when dialog closes
  function handleClose() {
    setIsEditing(false);
    setNoteText('');
    onClose();
  }

  async function handleTogglePublic() {
    try {
      await new Promise((resolve, reject) => {
        Meteor.call('tasks.togglePublic', taskId, !isPublic, (err, result) => {
          if (err) {
            reject(err);
          } else {
            setIsPublic(!isPublic);
            resolve(result);
          }
        });
      });
    } catch (error) {
      console.error('Error toggling protocol visibility:', error);
      alert(`Failed to update: ${error.message}`);
    }
  }

  // Start editing mode
  function handleStartEditing() {
    setIsEditing(true);
  }

  // Cancel editing mode
  function handleCancelEditing() {
    // Reset form values to task values
    if (task) {
      setDescription(task.description || '');
      setStatus(task.status || '');
      setPriority(task.priority || 'routine');
      setDueDate(get(task, 'executionPeriod.end') ? moment(get(task, 'executionPeriod.end')) : null);
    }
    
    setIsEditing(false);
  }

  async function handleCloneProtocol() {
    if (!task) return;
    
    try {
      setIsSubmitting(true);
      const result = await new Promise((resolve, reject) => {
        Meteor.call('protocols.createTaskFromProtocol', task._id, (err, result) => {
          if (err) {
            reject(err);
          } else {
            resolve(result);
          }
        });
      });
      
      // Redirect to the new task
      handleClose();
      navigate(`/task/${result}`);
    } catch (error) {
      console.error('Error cloning protocol:', error);
      alert(`Failed to clone protocol: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  // Save task changes
  async function handleSaveTask() {
    if (!task) return;
    
    try {
      setIsSubmitting(true);
      
      const updates = {
        description: description,
        status: status,
        priority: priority
      };
      
      if (dueDate) {
        updates.dueDate = dueDate.toDate();
      }
      
      await new Promise((resolve, reject) => {
        Meteor.call('tasks.update', task._id, updates, (err, result) => {
          if (err) {
            reject(err);
          } else {
            resolve(result);
          }
        });
      });
      
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating task:', error);
      alert(`Failed to update task: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  // Add a note to the task
  async function handleAddNote() {
    if (!task || !noteText.trim()) return;
    
    try {
      setIsSubmitting(true);
      await new Promise((resolve, reject) => {
        Meteor.call('tasks.addNote', task._id, noteText, (err, result) => {
          if (err) {
            reject(err);
          } else {
            resolve(result);
          }
        });
      });
      setNoteText('');
    } catch (error) {
      console.error('Error adding note:', error);
      alert(`Failed to add note: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  // Delete the task
  async function handleDeleteTask() {
    if (!task) return;
    
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await new Promise((resolve, reject) => {
          Meteor.call('tasks.remove', task._id, (err, result) => {
            if (err) {
              reject(err);
            } else {
              resolve(result);
            }
          });
        });
        handleClose();
      } catch (error) {
        console.error('Error deleting task:', error);
        alert(`Failed to delete task: ${error.message}`);
      }
    }
  }

  // Check if current user can edit this task
  function canEditTask() {
    if (!task || !currentUser) return false;
    return task.requester === currentUser._id || task.owner === currentUser._id;
  }

  // Get task status display info
  function getStatusInfo(statusValue) {
    const statusMap = {
      'draft': { color: 'default', label: 'Draft' },
      'requested': { color: 'info', label: 'Requested' },
      'received': { color: 'info', label: 'Received' },
      'accepted': { color: 'info', label: 'Accepted' },
      'rejected': { color: 'error', label: 'Rejected' },
      'ready': { color: 'warning', label: 'Ready' },
      'cancelled': { color: 'error', label: 'Cancelled' },
      'in-progress': { color: 'primary', label: 'In Progress' },
      'on-hold': { color: 'warning', label: 'On Hold' },
      'failed': { color: 'error', label: 'Failed' },
      'completed': { color: 'success', label: 'Completed' },
      'entered-in-error': { color: 'error', label: 'Error' }
    };

    return statusMap[statusValue] || { color: 'default', label: statusValue };
  }

  // Get priority display info
  function getPriorityInfo(priorityValue) {
    const priorityMap = {
      'routine': { color: 'success', label: 'Routine' },
      'urgent': { color: 'error', label: 'Urgent' },
      'asap': { color: 'warning', label: 'ASAP' },
      'stat': { color: 'error', label: 'STAT' }
    };

    return priorityMap[priorityValue] || { color: 'default', label: priorityValue };
  }

  // Loading state
  if (isLoading) {
    return (
      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
        <DialogContent>
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  // No task found
  if (!task) {
    return (
      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
        <DialogTitle>
          Task Details
          <IconButton
            aria-label="close"
            onClick={handleClose}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Typography>Task not found or you don't have permission to view it.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Close</Button>
        </DialogActions>
      </Dialog>
    );
  }

  // Render task details
  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
      <DialogTitle>
        {isEditing ? 'Edit Task' : 'Task Details'}
        <IconButton
          aria-label="close"
          onClick={handleClose}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent dividers>
        {isEditing ? (
          // Edit mode - show form
          <Box component="form" sx={{ mt: 1 }}>
            <TextField
              label="Task Description"
              fullWidth
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              margin="normal"
              required
              disabled={isSubmitting}
            />
            
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel id="status-label">Status</InputLabel>
                  <Select
                    labelId="status-label"
                    value={status}
                    label="Status"
                    onChange={(e) => setStatus(e.target.value)}
                    disabled={isSubmitting}
                  >
                    <MenuItem value="draft">Draft</MenuItem>
                    <MenuItem value="requested">Requested</MenuItem>
                    <MenuItem value="received">Received</MenuItem>
                    <MenuItem value="accepted">Accepted</MenuItem>
                    <MenuItem value="in-progress">In Progress</MenuItem>
                    <MenuItem value="on-hold">On Hold</MenuItem>
                    <MenuItem value="completed">Completed</MenuItem>
                    <MenuItem value="cancelled">Cancelled</MenuItem>
                    <MenuItem value="failed">Failed</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel id="priority-label">Priority</InputLabel>
                  <Select
                    labelId="priority-label"
                    value={priority}
                    label="Priority"
                    onChange={(e) => setPriority(e.target.value)}
                    disabled={isSubmitting}
                  >
                    <MenuItem value="routine">Routine</MenuItem>
                    <MenuItem value="urgent">Urgent</MenuItem>
                    <MenuItem value="asap">ASAP</MenuItem>
                    <MenuItem value="stat">STAT</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <LocalizationProvider dateAdapter={AdapterMoment}>
                  <DateTimePicker
                    label="Due Date"
                    value={dueDate}
                    onChange={setDueDate}
                    slotProps={{ textField: { fullWidth: true, margin: "normal" } }}
                    disabled={isSubmitting}
                    minDateTime={moment()}
                  />
                </LocalizationProvider>
              </Grid>
            </Grid>
          </Box>
        ) : (
          // View mode - show details
          <>
            <Typography variant="h5" gutterBottom>
              {task.description}
            </Typography>
            
            <Box sx={{ mt: 2, mb: 3, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip
                label={getStatusInfo(task.status).label}
                color={getStatusInfo(task.status).color}
              />
              
              {task.priority && (
                <Chip
                  label={getPriorityInfo(task.priority).label}
                  color={getPriorityInfo(task.priority).color}
                />
              )}
              
              {get(task, 'executionPeriod.end') && (
                <Chip
                  icon={<AccessTimeIcon />}
                  label={`Due: ${formatDateTime(get(task, 'executionPeriod.end'))}`}
                  color={isTaskOverdue(task) ? 'error' : 'default'}
                  variant="outlined"
                />
              )}
            </Box>
            
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Created
                </Typography>
                <Typography variant="body1">
                  {formatDateTime(task.authoredOn)}
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Last Modified
                </Typography>
                <Typography variant="body1">
                  {formatDateTime(task.lastModified)}
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Created By
                </Typography>
                <Typography variant="body1">
                  {task.requester || 'Unknown'}
                </Typography>
              </Grid>
              
              {task.owner && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Assigned To
                  </Typography>
                  <Typography variant="body1">
                    {task.owner}
                  </Typography>
                </Grid>
              )}
            </Grid>
            
            <Divider sx={{ my: 3 }} />
            
            {/* Notes Section */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="h6" gutterBottom>
                Notes
              </Typography>
              
              {get(task, 'note', []).length > 0 ? (
                <List sx={{ bgcolor: '#f5f5f5', borderRadius: 1 }}>
                  {get(task, 'note', []).map((note, index) => (
                    <ListItem 
                      key={index} 
                      alignItems="flex-start"
                      divider={index < task.note.length - 1}
                      sx={{ py: 2 }}
                    >
                      <ListItemText
                        primary={note.text}
                        secondary={`${formatDateTime(note.time)} by ${note.authorId || 'Unknown'}`}
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No notes yet.
                </Typography>
              )}
            </Box>
            
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Add Note
              </Typography>
              <TextField
                multiline
                rows={3}
                fullWidth
                placeholder="Add a note about this task..."
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                disabled={isSubmitting}
              />
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                <Button
                  variant="contained"
                  startIcon={<AddCommentIcon />}
                  onClick={handleAddNote}
                  disabled={!noteText.trim() || isSubmitting}
                >
                  Add Note
                </Button>
              </Box>
            </Box>
          </>
        )}
      </DialogContent>
      
      <DialogActions sx={{ px: 3, py: 2 }}>
        {isEditing ? (
          <>
            <Button 
              onClick={handleCancelEditing}
              startIcon={<CancelIcon />}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSaveTask}
              startIcon={<SaveIcon />}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </>
        ) : (
          <>
            <Button 
              startIcon={<DeleteIcon />}
              color="error"
              onClick={handleDeleteTask}
              disabled={!canEditTask()}
            >
              Delete
            </Button>
            
            <Box sx={{ flex: 1 }} />
            
            <Button onClick={handleClose}>
              Close
            </Button>
            
            {canEditTask() && !isProtocol && (
              <Button
                startIcon={<SaveAltIcon />}
                onClick={() => setProtocolDialogOpen(true)}
              >
                Save as Protocol
              </Button>
            )}
            
            {canEditTask() && isProtocol && (
              <Button
                color={isPublic ? "primary" : "default"}
                startIcon={<PublicIcon />}
                onClick={handleTogglePublic}
                sx={{ mr: 1 }}
              >
                {isPublic ? "Public Protocol" : "Make Public"}
              </Button>
            )}
            
            {isProtocol && (
              <Button
                variant="contained"
                color="primary"
                onClick={handleCloneProtocol}
                disabled={!currentUser}
              >
                Clone Protocol
              </Button>
            )}
            
            {canEditTask() && !isProtocol && (
              <Button
                variant="contained"
                startIcon={<EditIcon />}
                onClick={handleStartEditing}
              >
                Edit
              </Button>
            )}
          </>
        )}
      </DialogActions>
      
      {protocolDialogOpen && (
        <ModifyProtocolDialog
          open={protocolDialogOpen}
          onClose={() => setProtocolDialogOpen(false)}
          taskId={task._id}
          onSave={(protocolId) => {
            // Show success message or redirect
            setProtocolDialogOpen(false);
          }}
        />
      )}
    </Dialog>
  );
}

// Make sure to export the component correctly
export default TaskDetails;