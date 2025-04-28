// imports/ui/pages/ListDetailPage.jsx
import React, { useState, useEffect } from 'react';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { get } from 'lodash';
import moment from 'moment';

// Material UI components
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  Breadcrumbs,
  Link,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  IconButton,
  Tooltip,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Checkbox,
  Menu,
  MenuItem
} from '@mui/material';

// Icons
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SettingsIcon from '@mui/icons-material/Settings';
import AddIcon from '@mui/icons-material/Add';
import PublicIcon from '@mui/icons-material/Public';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';
import ScheduleIcon from '@mui/icons-material/Schedule';

// Components
import { TaskForm } from '../components/TaskForm';
import { ListConfigModal } from '../components/ListConfigModal';

// Collections
import { ListsCollection } from '../../db/ListsCollection';
import { TasksCollection } from '../../db/TasksCollection';

export function ListDetailPage() {
  const { listId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  // State
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });
  const [taskMenuAnchor, setTaskMenuAnchor] = useState(null);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  
  // Check for query parameters (like a newly added task)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const newTask = params.get('newTask');
    
    if (newTask === 'true') {
      setNotification({
        open: true,
        message: 'Task added successfully!',
        severity: 'success'
      });
      
      // Clear the query parameter
      navigate(`/list/${listId}`, { replace: true });
    }
  }, [location, navigate, listId]);
  
  // Track list and tasks data
  const { list, tasks, isLoading, currentUser } = useTracker(() => {
    const noData = { list: null, tasks: [], isLoading: true, currentUser: null };
    
    if (!listId) {
      return { ...noData, isLoading: false };
    }
    
    const listSub = Meteor.subscribe('lists.byId', listId);
    const tasksSub = Meteor.subscribe('tasks.byList', listId);
    const userSub = Meteor.subscribe('userData');
    
    if (!listSub.ready() || !tasksSub.ready() || !userSub.ready()) {
      return noData;
    }
    
    const listData = ListsCollection.findOne(listId);
    
    if (!listData) {
      return { ...noData, isLoading: false };
    }
    
    return {
      list: listData,
      tasks: TasksCollection.find(
        { listId: listId, isDeleted: { $ne: true } },
        { sort: { status: 1, ordinal: 1 } }
      ).fetch(),
      isLoading: false,
      currentUser: Meteor.user()
    };
  }, [listId]);
  
  // Check if current user can edit this list
  function canEditList() {
    if (!list || !currentUser) return false;
    return list.userId === currentUser._id;
  }
  
  // Navigate back to lists page
  function handleBack() {
    navigate('/lists');
  }
  
  // Open the config modal
  function handleOpenConfig() {
    setConfigModalOpen(true);
  }
  
  // Handle task creation success
  function handleTaskCreated(taskId) {
    setNotification({
      open: true,
      message: 'Task created successfully!',
      severity: 'success'
    });
    
    // Could auto-navigate to the task detail if desired
    // navigate(`/task/${taskId}`);
  }
  
  // Open task menu
  function handleOpenTaskMenu(event, taskId) {
    event.stopPropagation();
    setTaskMenuAnchor(event.currentTarget);
    setSelectedTaskId(taskId);
  }
  
  // Close task menu
  function handleCloseTaskMenu() {
    setTaskMenuAnchor(null);
    setSelectedTaskId(null);
  }
  
  // Handle navigating to task details
  function handleGoToTask(taskId) {
    navigate(`/task/${taskId}`);
  }
  
  // Handle deleting a task
  function handleDeleteTask() {
    handleCloseTaskMenu();
    
    if (!selectedTaskId) return;
    
    if (window.confirm('Are you sure you want to delete this task?')) {
      Meteor.call('tasks.remove', selectedTaskId, (error) => {
        if (error) {
          console.error('Error deleting task:', error);
          setNotification({
            open: true,
            message: `Error: ${error.reason || 'Failed to delete task'}`,
            severity: 'error'
          });
        } else {
          setNotification({
            open: true,
            message: 'Task deleted successfully',
            severity: 'success'
          });
        }
      });
    }
  }
  
  // Handle toggling task status (complete/incomplete)
  function handleToggleTaskStatus(event, taskId, currentStatus) {
    event.stopPropagation();
    
    const newStatus = currentStatus === 'completed' ? 'in-progress' : 'completed';
    
    Meteor.call('tasks.setStatus', taskId, newStatus, (error) => {
      if (error) {
        console.error('Error updating task status:', error);
        setNotification({
          open: true,
          message: `Error: ${error.reason || 'Failed to update task status'}`,
          severity: 'error'
        });
      }
    });
  }
  
  // Close notification
  function handleCloseNotification() {
    setNotification({ ...notification, open: false });
  }
  
  // Format the task due date for display
  function formatDueDate(date) {
    if (!date) return null;
    
    const dueDate = moment(date);
    const today = moment().startOf('day');
    const tomorrow = moment().add(1, 'day').startOf('day');
    
    if (dueDate.isSame(today, 'day')) {
      return 'Today';
    } else if (dueDate.isSame(tomorrow, 'day')) {
      return 'Tomorrow';
    } else {
      return dueDate.format('MMM D, YYYY');
    }
  }
  
  // Check if a task is overdue
  function isTaskOverdue(task) {
    const dueDate = get(task, 'executionPeriod.end');
    if (!dueDate) return false;
    
    return moment(dueDate).isBefore(moment()) && task.status !== 'completed';
  }
  
  // Get priority information for display
  function getPriorityInfo(priority = 'routine') {
    const priorityMap = {
      'routine': { color: 'success', label: 'Routine' },
      'urgent': { color: 'error', label: 'Urgent' },
      'asap': { color: 'warning', label: 'ASAP' },
      'stat': { color: 'error', label: 'STAT' }
    };
    
    return priorityMap[priority] || { color: 'default', label: priority };
  }
  
  // Loading state
  if (isLoading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }
  
  // List not found
  if (!list) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ mb: 4 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={handleBack}
            sx={{ mb: 2 }}
          >
            Back to Lists
          </Button>
          
          <Alert severity="error">
            List not found or you don't have permission to view it.
          </Alert>
        </Box>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="lg" id="checklistPage" className="checklist">
      <Box sx={{ mb: 4 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
          sx={{ mb: 2 }}
        >
          Back to Lists
        </Button>
        
        <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
          <Link 
            color="inherit" 
            onClick={handleBack}
            sx={{ cursor: 'pointer' }}
          >
            Lists
          </Link>
          <Typography color="text.primary">
            {list.title || list.name}
          </Typography>
        </Breadcrumbs>
        
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="h4" component="h1" id="checklistTitle">
              {list.title || list.name}
            </Typography>
            
            {list.public && (
              <Tooltip title="Public list">
                <PublicIcon sx={{ ml: 1, color: 'primary.main' }} />
              </Tooltip>
            )}
          </Box>
          
          {canEditList() && (
            <IconButton 
              onClick={handleOpenConfig}
              id="checklistConfig"
            >
              <SettingsIcon />
            </IconButton>
          )}
        </Box>
        
        {list.description && (
          <Typography variant="body1" color="text.secondary" paragraph>
            {list.description}
          </Typography>
        )}
      </Box>
      
      {notification.open && (
        <Alert 
          severity={notification.severity} 
          onClose={handleCloseNotification}
          sx={{ mb: 3 }}
        >
          {notification.message}
        </Alert>
      )}
      
      {/* Task Form - only show for list owners */}
      {canEditList() && (
        <Box sx={{ mb: 3 }} id="newTaskRibbon">
          <TaskForm 
            listId={listId}
            onSuccess={handleTaskCreated}
          />
        </Box>
      )}
      
      {/* Tasks Display */}
      <Paper>
        <Box sx={{ p: 2, borderBottom: '1px solid #eee' }}>
          <Typography variant="h6">
            Tasks
            {tasks.length > 0 && (
              <Chip 
                label={tasks.length} 
                size="small" 
                sx={{ ml: 1 }} 
              />
            )}
          </Typography>
        </Box>
        
        <div id="taskList" className="content-scrollable list-items">
          {tasks.length > 0 ? (
            <List>
              {tasks.map((task) => (
                <React.Fragment key={task._id}>
                  <ListItem 
                    button
                    onClick={() => handleGoToTask(task._id)}
                    sx={{
                      borderLeft: 4,
                      borderColor: task.priority === 'urgent' || task.priority === 'stat'
                        ? 'error.main'
                        : task.priority === 'asap'
                          ? 'warning.main'
                          : 'success.main',
                      opacity: task.status === 'completed' ? 0.7 : 1,
                      bgcolor: isTaskOverdue(task) ? 'rgba(244, 67, 54, 0.08)' : 'inherit'
                    }}
                  >
                    <ListItemIcon onClick={(e) => handleToggleTaskStatus(e, task._id, task.status)}>
                      <Checkbox
                        edge="start"
                        checked={task.status === 'completed'}
                        icon={<RadioButtonUncheckedIcon />}
                        checkedIcon={<CheckCircleIcon />}
                        sx={{ color: task.status === 'completed' ? 'success.main' : 'inherit' }}
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography 
                          variant="body1" 
                          sx={{ 
                            textDecoration: task.status === 'completed' ? 'line-through' : 'none',
                            fontWeight: task.status === 'completed' ? 'normal' : 'medium'
                          }}
                        >
                          {task.description}
                        </Typography>
                      }
                      secondary={
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 0.5 }}>
                          {task.status && (
                            <Chip
                              size="small"
                              label={task.status}
                              color={task.status === 'completed' ? 'success' : 'default'}
                              variant="outlined"
                            />
                          )}
                          
                          {task.priority && (
                            <Chip
                              size="small"
                              icon={<PriorityHighIcon />}
                              label={getPriorityInfo(task.priority).label}
                              color={getPriorityInfo(task.priority).color}
                              variant="outlined"
                            />
                          )}
                          
                          {get(task, 'executionPeriod.end') && (
                            <Tooltip title={moment(get(task, 'executionPeriod.end')).format('MMM D, YYYY')}>
                              <Chip
                                size="small"
                                icon={<ScheduleIcon />}
                                label={`Due: ${formatDueDate(get(task, 'executionPeriod.end'))}`}
                                color={isTaskOverdue(task) ? 'error' : 'default'}
                                variant="outlined"
                              />
                            </Tooltip>
                          )}
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton 
                        edge="end" 
                        aria-label="more options"
                        onClick={(e) => handleOpenTaskMenu(e, task._id)}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                  <Divider component="li" variant="inset" />
                </React.Fragment>
              ))}
            </List>
          ) : (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h6" className="title-message">
                No tasks here
              </Typography>
              <Typography variant="body2" color="text.secondary" className="subtitle-message">
                {canEditList() 
                  ? 'Add new tasks using the form above' 
                  : 'This list does not contain any tasks yet'
                }
              </Typography>
              
              {canEditList() && (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  sx={{ mt: 2 }}
                  onClick={() => document.getElementById('task-description-field')?.focus()}
                >
                  Add First Task
                </Button>
              )}
            </Box>
          )}
        </div>
      </Paper>
      
      {/* Task Options Menu */}
      <Menu
        anchorEl={taskMenuAnchor}
        open={Boolean(taskMenuAnchor)}
        onClose={handleCloseTaskMenu}
      >
        <MenuItem onClick={() => {
          handleCloseTaskMenu();
          if (selectedTaskId) {
            navigate(`/task/${selectedTaskId}`);
          }
        }}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>View/Edit Task</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDeleteTask}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Delete Task</ListItemText>
        </MenuItem>
      </Menu>
      
      {/* Config Modal */}
      <ListConfigModal
        open={configModalOpen}
        onClose={() => setConfigModalOpen(false)}
        listId={listId}
      />
    </Container>
  );
}

export default ListDetailPage;