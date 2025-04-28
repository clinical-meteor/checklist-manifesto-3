// imports/ui/pages/ListsPage.jsx
import React, { useState } from 'react';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { useNavigate } from 'react-router-dom';
import { get } from 'lodash';

// Material UI components
import {
  Box,
  Container,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Button,
  Divider,
  Chip,
  CircularProgress,
  Alert,
  Tooltip
} from '@mui/material';

// Icons
import ListIcon from '@mui/icons-material/List';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PublicIcon from '@mui/icons-material/Public';
import LockIcon from '@mui/icons-material/Lock';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

// Components
import ListForm from '../components/ListForm';
import { ListConfigModal } from '../components/ListConfigModal';

// Collections
import { ListsCollection } from '../../db/ListsCollection';

export function ListsPage() {
  const navigate = useNavigate();
  
  // State
  const [showForm, setShowForm] = useState(false);
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [selectedListId, setSelectedListId] = useState(null);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });
  
  // Track lists data
  const { lists, listsLoading, currentUser } = useTracker(() => {
    const listsSub = Meteor.subscribe('lists.all');
    const userSub = Meteor.subscribe('userData');
    
    return {
      listsLoading: !listsSub.ready() || !userSub.ready(),
      lists: ListsCollection.find(
        { userId: Meteor.userId(), isDeleted: { $ne: true } },
        { sort: { lastModified: -1 } }
      ).fetch(),
      currentUser: Meteor.user()
    };
  });
  
  // Handle creating a new list
  function handleNewListSaved(listId) {
    setShowForm(false);
    
    // Show notification
    setNotification({
      open: true,
      message: 'List created successfully!',
      severity: 'success'
    });
    
    // Navigate to the new list
    navigate(`/list/${listId}`);
  }
  
  // Handle opening config modal
  function handleOpenConfig(listId) {
    setSelectedListId(listId);
    setConfigModalOpen(true);
  }
  
  // Handle navigating to a list
  function handleGoToList(listId) {
    navigate(`/list/${listId}`);
  }
  
  // Format creation date for display
  function formatDate(date) {
    if (!date) return 'Unknown';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
  
  // Close notification
  function handleCloseNotification() {
    setNotification({ ...notification, open: false });
  }
  
  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          My Lists
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Manage your task lists and protocols
        </Typography>
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
      
      {/* Create New List Form */}
      {!showForm ? (
        <Box sx={{ mb: 3 }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setShowForm(true)}
            id="newListButton"
          >
            Create New List
          </Button>
        </Box>
      ) : (
        <Box sx={{ mb: 3 }}>
          <ListForm
            onSave={handleNewListSaved}
            onCancel={() => setShowForm(false)}
          />
        </Box>
      )}
      
      {/* Lists Display */}
      <Paper>
        <Box sx={{ p: 2, borderBottom: '1px solid #eee' }}>
          <Typography variant="h6">
            Your Lists
            {!listsLoading && (
              <Chip 
                label={lists.length} 
                size="small" 
                sx={{ ml: 1 }} 
              />
            )}
          </Typography>
        </Box>
        
        {listsLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : lists.length > 0 ? (
          <List id="lists">
            {lists.map((list) => (
              <React.Fragment key={list._id}>
                <ListItem 
                  button
                  onClick={() => handleGoToList(list._id)}
                  className="listItem"
                >
                  <ListItemIcon>
                    <ListIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="subtitle1">
                          {list.title || list.name}
                        </Typography>
                        {list.public && (
                          <Tooltip title="Public list">
                            <PublicIcon fontSize="small" sx={{ ml: 1, color: 'primary.main' }} />
                          </Tooltip>
                        )}
                      </Box>
                    }
                    secondary={
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 0.5 }}>
                        {list.description && (
                          <Typography variant="body2" color="text.secondary">
                            {list.description}
                          </Typography>
                        )}
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                          <AccessTimeIcon fontSize="small" color="action" />
                          <Typography variant="caption" color="text.secondary">
                            {formatDate(list.lastModified || list.createdAt)}
                          </Typography>
                          {typeof list.incompleteCount === 'number' && (
                            <Chip 
                              size="small" 
                              label={`${list.incompleteCount} task${list.incompleteCount !== 1 ? 's' : ''}`}
                              className="count-list"
                            />
                          )}
                        </Box>
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      aria-label="edit"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenConfig(list._id);
                      }}
                      id="checklistConfig"
                    >
                      <EditIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
                <Divider component="li" />
              </React.Fragment>
            ))}
          </List>
        ) : (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6">
              No lists found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Create your first list to get started
            </Typography>
            {!showForm && (
              <Button 
                variant="contained" 
                sx={{ mt: 2 }}
                startIcon={<AddIcon />}
                onClick={() => setShowForm(true)}
              >
                Create New List
              </Button>
            )}
          </Box>
        )}
      </Paper>
      
      {/* Config Modal */}
      <ListConfigModal
        open={configModalOpen}
        onClose={() => {
          setConfigModalOpen(false);
          setSelectedListId(null);
        }}
        listId={selectedListId}
      />
    </Container>
  );
}

export default ListsPage;