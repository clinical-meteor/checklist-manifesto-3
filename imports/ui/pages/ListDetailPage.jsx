// imports/ui/pages/ListDetailPage.jsx
import React, { useState } from 'react';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { useParams, useNavigate } from 'react-router-dom';
import { get } from 'lodash';

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
  Tooltip
} from '@mui/material';

// Icons
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SettingsIcon from '@mui/icons-material/Settings';
import AddIcon from '@mui/icons-material/Add';
import PublicIcon from '@mui/icons-material/Public';
import DatasetLinkedIcon from '@mui/icons-material/DatasetLinked';

// Components
import { TaskForm } from '../components/TaskForm';
import { TaskList } from '../components/TaskList';
import { ListConfigModal } from '../components/ListConfigModal';
import { IFrameViewer } from '../components/IFrameViewer';

// Collections
import { ListsCollection } from '../../db/ListsCollection';
import { TasksCollection } from '../../db/TasksCollection';

export function ListDetailPage() {
  const { listId } = useParams();
  const navigate = useNavigate();
  
  // State
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });
  const [showIFrame, setShowIFrame] = useState(false);
  const [iframeUrl, setIframeUrl] = useState('');
  
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
        { sort: { ordinal: 1 } }
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
  }
  
  // Close notification
  function handleCloseNotification() {
    setNotification({ ...notification, open: false });
  }
  
  // Handle opening iframe with a URL
  function handleOpenIFrame(url) {
    setIframeUrl(url || get(list, 'url', ''));
    setShowIFrame(true);
  }
  
  // Handle closing iframe
  function handleCloseIFrame() {
    setShowIFrame(false);
    setIframeUrl('');
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
            
            {list.url && (
              <Tooltip title="View linked resource">
                <IconButton 
                  color="primary" 
                  onClick={() => handleOpenIFrame(list.url)}
                  size="small"
                  sx={{ ml: 1 }}
                >
                  <DatasetLinkedIcon />
                </IconButton>
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
        
        <div id="protocolLibraryItems" className="content-scrollable list-items">
          {tasks.length > 0 ? (
            <TaskList 
              tasks={tasks}
              listId={listId}
              canEdit={canEditList()}
            />
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
            </Box>
          )}
        </div>
      </Paper>
      
      {/* Config Modal */}
      <ListConfigModal
        open={configModalOpen}
        onClose={() => setConfigModalOpen(false)}
        listId={listId}
      />
      
      {/* IFrame display */}
      {showIFrame && (
        <IFrameViewer
          url={iframeUrl}
          open={showIFrame}
          onClose={handleCloseIFrame}
          title={list.title || list.name}
        />
      )}
    </Container>
  );
}

export default ListDetailPage;