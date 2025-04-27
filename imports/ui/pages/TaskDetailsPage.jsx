// imports/ui/pages/TaskDetailsPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTracker } from 'meteor/react-meteor-data';
import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';

// Components
import { 
  Box, 
  Container, 
  Typography, 
  Paper, 
  Button, 
  CircularProgress,
  Breadcrumbs,
  Link,
  Divider
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

// Collections
import { TasksCollection } from '../../db/TasksCollection';

// Components
import TaskDetails from '../components/TaskDetails';

/**
 * Task details page to view and edit a specific task
 */
export default function TaskDetailsPage() {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const [open, setOpen] = useState(true);
  
  // Track the task data
  const { task, isLoading } = useTracker(() => {
    const subscription = Meteor.subscribe('tasks.byId', taskId);
    
    return {
      isLoading: !subscription.ready(),
      task: TasksCollection.findOne(taskId)
    };
  }, [taskId]);
  
  // Navigate back to the task list
  const handleBack = () => {
    navigate('/');
  };
  
  // Handle dialog close
  const handleClose = () => {
    setOpen(false);
    navigate('/');
  };
  
  // If task not found after loading is complete, navigate back to task list
  useEffect(() => {
    if (!isLoading && !task) {
      navigate('/');
    }
  }, [isLoading, task, navigate]);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!task) {
    return null; // Will redirect due to useEffect
  }

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
          <Typography color="text.primary">Task Details</Typography>
        </Breadcrumbs>
        
        <Typography variant="h4" component="h1" gutterBottom>
          Task Details
        </Typography>
      </Box>
      
      <Paper elevation={2} sx={{ p: 0 }}>
        <TaskDetails 
          taskId={taskId} 
          open={open} 
          onClose={handleClose} 
        />
      </Paper>
    </Container>
  );
}