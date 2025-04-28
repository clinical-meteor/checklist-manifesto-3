// imports/ui/pages/ListsPage.jsx
import React, { useState, useEffect } from 'react';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { useNavigate, useLocation } from 'react-router-dom';
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
  Tooltip,
  Grid,
  TextField,
  InputAdornment
} from '@mui/material';

// Icons
import ListIcon from '@mui/icons-material/List';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PublicIcon from '@mui/icons-material/Public';
import LockIcon from '@mui/icons-material/Lock';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import PreviewIcon from '@mui/icons-material/Preview';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

// Components
import ListForm from '../components/ListForm';
import { ListConfigModal } from '../components/ListConfigModal';

// Collections
import { ListsCollection } from '../../db/ListsCollection';

export default function ListsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // State
  const [showForm, setShowForm] = useState(false);
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [selectedListId, setSelectedListId] = useState(null);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });
  const [searchTerm, setSearchTerm] = useState('');
  const [showPublicOnly, setShowPublicOnly] = useState(false);
  
  // Check if the user came from creating a new list
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const newList = params.get('newList');
    
    if (newList === 'true') {
      setNotification({
        open: true,
        message: 'List created successfully!',
        severity: 'success'
      });
      
      // Clear the query parameter
      navigate('/lists', { replace: true });
    }
  }, [location, navigate]);
  
  // Track lists data
  const { lists, listsLoading, currentUser } = useTracker(() => {
    const listsSub = Meteor.subscribe('lists.all');
    const userSub = Meteor.subscribe('userData');
    
    // Build filter based on search term and visibility settings
    let filter = { isDeleted: { $ne: true } };
    
    if (searchTerm) {
      const searchRegex = { $regex: searchTerm, $options: 'i' };
      filter.$or = [
        { title: searchRegex },
        { name: searchRegex }, // For backward compatibility
        { description: searchRegex }
      ];
    }
    
    if (showPublicOnly) {
      filter.public = true;
    } else if (Meteor.userId()) {
      // If not showing only public lists, show user's own lists
      filter.$or = [
        { userId: Meteor.userId() },
        { public: true }
      ];
    }
    
    return {
      listsLoading: !listsSub.ready() || !userSub.ready(),
      lists: ListsCollection.find(
        filter,
        { sort: { lastModified: -1 } }
      ).fetch(),
      currentUser: Meteor.user()
    };
  }, [searchTerm, showPublicOnly]);
  
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
  function handleOpenConfig(e, listId) {
    e.stopPropagation(); // Prevent navigation
    setSelectedListId(listId);
    setConfigModalOpen(true);
  }
  
  // Handle navigating to a list
  function handleGoToList(listId) {
    navigate(`/list/${listId}`);
  }
  
  // Handle deleting a list
  function handleDeleteList(e, listId) {
    e.stopPropagation(); // Prevent navigation to the list
    
    if (window.confirm('Are you sure you want to delete this list?')) {
      Meteor.call('lists.remove', listId, (error) => {
        if (error) {
          console.error('Error deleting list:', error);
          setNotification({
            open: true,
            message: `Error: ${error.reason || 'Failed to delete list'}`,
            severity: 'error'
          });
        } else {
          setNotification({
            open: true,
            message: 'List deleted successfully',
            severity: 'success'
          });
        }
      });
    }
  }
  
  // Handle cloning a list
  function handleCloneList(e, list) {
    e.stopPropagation(); // Prevent navigation
    
    if (!currentUser) {
      setNotification({
        open: true,
        message: 'Please sign in to clone lists',
        severity: 'warning'
      });
      return;
    }
    
    Meteor.call('lists.clone', list._id, {}, (error, result) => {
      if (error) {
        console.error('Error cloning list:', error);
        setNotification({
          open: true,
          message: `Error: ${error.reason || 'Failed to clone list'}`,
          severity: 'error'
        });
      } else {
        setNotification({
          open: true,
          message: 'List cloned successfully!',
          severity: 'success'
        });
        
        // Navigate to the new list
        navigate(`/list/${result}`);
      }
    });
  }
  
  // Handle toggling public status
  function handleTogglePublic(e, list) {
    e.stopPropagation(); // Prevent navigation
    
    Meteor.call('lists.togglePublic', list._id, (error) => {
      if (error) {
        console.error('Error toggling list visibility:', error);
        setNotification({
          open: true,
          message: `Error: ${error.reason || 'Failed to update list visibility'}`,
          severity: 'error'
        });
      } else {
        setNotification({
          open: true,
          message: `List is now ${list.public ? 'private' : 'public'}`,
          severity: 'success'
        });
      }
    });
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
  
  // Handle search input change
  function handleSearchChange(e) {
    setSearchTerm(e.target.value);
  }
  
  // Toggle between showing all lists or public lists only
  function togglePublicFilter() {
    setShowPublicOnly(!showPublicOnly);
  }
  
  // Close notification
  function handleCloseNotification() {
    setNotification({ ...notification, open: false });
  }
  
  // Create a new list directly (without form)
  function handleCreateNewList() {
    const defaultListName = `List ${new Date().toLocaleDateString('en-US')}`;
    
    Meteor.call('lists.create', { title: defaultListName }, (error, listId) => {
      if (error) {
        console.error('Error creating list:', error);
        setNotification({
          open: true,
          message: `Error: ${error.reason || 'Failed to create list'}`,
          severity: 'error'
        });
      } else {
        setNotification({
          open: true,
          message: 'New list created successfully!',
          severity: 'success'
        });
        
        // Navigate to the new list
        navigate(`/list/${listId}`);
      }
    });
  }
  
  // Check if current user can edit this list
  function canEditList(list) {
    if (!list || !currentUser) return false;
    return list.userId === currentUser._id;
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
      
      {/* Search and Filter Bar */}
      <Paper sx={{ mb: 3, p: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={8}>
            <TextField
              fullWidth
              placeholder="Search lists..."
              value={searchTerm}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Button
                variant={showPublicOnly ? "contained" : "outlined"}
                startIcon={<PublicIcon />}
                onClick={togglePublicFilter}
                sx={{ mr: 1 }}
              >
                {showPublicOnly ? "Public Lists" : "My Lists"}
              </Button>
              
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setShowForm(true)}
                disabled={showForm}
                id="newListButton"
              >
                New List
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Create New List Form */}
      {showForm && (
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
            {showPublicOnly ? "Public Lists" : "Your Lists"}
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
                  component="div"
                  sx={{
                    borderLeft: 4,
                    borderColor: 'primary.main',
                    cursor: 'pointer'
                  }}
                  className="listItem"
                >
                  <ListItemIcon>
                    <ListIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center' }} onClick={() => handleGoToList(list._id)}>
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
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 0.5 }} onClick={() => handleGoToList(list._id)}>
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
                    onClick={() => handleGoToList(list._id)}
                  />
                  <ListItemSecondaryAction>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<PreviewIcon />}
                      onClick={() => handleGoToList(list._id)}
                      sx={{ mr: 1 }}
                    >
                      Open
                    </Button>

                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<ContentCopyIcon />}
                      onClick={(e) => handleCloneList(e, list)}
                      sx={{ mr: 1 }}
                    >
                      Clone
                    </Button>

                    {canEditList(list) && (
                      <>
                        <IconButton
                          edge="end"
                          aria-label="edit"
                          onClick={(e) => handleOpenConfig(e, list._id)}
                          id="checklistConfig"
                          sx={{ mr: 1 }}
                        >
                          <EditIcon />
                        </IconButton>

                        <IconButton
                          edge="end"
                          aria-label="toggle visibility"
                          onClick={(e) => handleTogglePublic(e, list)}
                          sx={{ mr: 1 }}
                        >
                          {list.public ? <PublicIcon color="primary" /> : <LockIcon />}
                        </IconButton>

                        <IconButton
                          edge="end"
                          aria-label="delete"
                          onClick={(e) => handleDeleteList(e, list._id)}
                          sx={{ color: 'error.main' }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </>
                    )}
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
              {searchTerm 
                ? 'Try a different search term' 
                : showPublicOnly 
                  ? 'There are no public lists available at the moment'
                  : 'Create your first list to get started'
              }
            </Typography>
            
            {!showForm && !searchTerm && !showPublicOnly && (
              <Button 
                variant="contained" 
                sx={{ mt: 2 }}
                startIcon={<AddIcon />}
                onClick={handleCreateNewList}
              >
                Create Quick List
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