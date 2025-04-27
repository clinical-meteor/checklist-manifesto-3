import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import PropTypes from 'prop-types';

// Material UI Components
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';

// Icons
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import FileUploadIcon from '@mui/icons-material/FileUpload';

export function SimpleDropZone({ 
  onFilesAccepted, 
  acceptedFileTypes = {
    'application/json': ['.json'],
    'application/x-ndjson': ['.ndjson'],
    'text/plain': ['.txt'],
    'text/csv': ['.csv']
  },
  maxFiles = 1,
  maxSize = 10485760, // 10MB
  instructionText = "Drag and drop files here, or click to select files",
  height = 200
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const onDrop = useCallback(async (acceptedFiles) => {
    if (!acceptedFiles || acceptedFiles.length === 0) return;
    
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      await onFilesAccepted(acceptedFiles);
      setSuccess(`Successfully processed ${acceptedFiles.length} file(s)`);
    } catch (err) {
      console.error('Error processing files:', err);
      setError(err.message || 'Error processing files');
    } finally {
      setIsLoading(false);
    }
  }, [onFilesAccepted]);

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragAccept,
    isDragReject,
    open
  } = useDropzone({
    onDrop,
    accept: acceptedFileTypes,
    maxFiles,
    maxSize,
    noClick: false,
    noKeyboard: false
  });

  // Get border color based on drag state
  const getBorderColor = () => {
    if (isDragAccept) return 'success.main';
    if (isDragReject) return 'error.main';
    if (isDragActive) return 'primary.main';
    return 'grey.300';
  };

  const resetStatus = () => {
    setError(null);
    setSuccess(null);
  };

  return (
    <Paper elevation={0} sx={{ mb: 2 }}>
      {error && (
        <Alert 
          severity="error" 
          action={
            <IconButton color="inherit" size="small" onClick={resetStatus}>
              <CloseIcon fontSize="inherit" />
            </IconButton>
          }
          sx={{ mb: 2 }}
        >
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert 
          severity="success" 
          action={
            <IconButton color="inherit" size="small" onClick={resetStatus}>
              <CloseIcon fontSize="inherit" />
            </IconButton>
          }
          sx={{ mb: 2 }}
        >
          {success}
        </Alert>
      )}
      
      <Box
        {...getRootProps()}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: height,
          border: '2px dashed',
          borderColor: getBorderColor(),
          borderRadius: 2,
          p: 2,
          outline: 'none',
          transition: 'border .24s ease-in-out',
          bgcolor: isDragActive ? 'action.hover' : 'background.paper',
          cursor: 'pointer',
          position: 'relative'
        }}
      >
        <input {...getInputProps()} />
        
        {isLoading ? (
          <CircularProgress />
        ) : isDragActive ? (
          <Box sx={{ textAlign: 'center' }}>
            <CloudUploadIcon fontSize="large" color={isDragReject ? "error" : "primary"} />
            <Typography>
              {isDragReject ? 'File type not accepted' : 'Drop the files here...'}
            </Typography>
          </Box>
        ) : (
          <Box sx={{ textAlign: 'center' }}>
            <FileUploadIcon fontSize="large" color="action" sx={{ mb: 1 }} />
            <Typography>{instructionText}</Typography>
            <Button
              sx={{ mt: 2 }}
              variant="outlined"
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                open();
              }}
            >
              Select Files
            </Button>
          </Box>
        )}
      </Box>
    </Paper>
  );
}

SimpleDropZone.propTypes = {
  onFilesAccepted: PropTypes.func.isRequired,
  acceptedFileTypes: PropTypes.object,
  maxFiles: PropTypes.number,
  maxSize: PropTypes.number,
  instructionText: PropTypes.string,
  height: PropTypes.number
};

export default SimpleDropZone;