import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

// Material UI Components
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import Toolbar from '@mui/material/Toolbar';
import Tooltip from '@mui/material/Tooltip';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import CardHeader from '@mui/material/CardHeader';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

// Icons
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';
import DeleteIcon from '@mui/icons-material/Delete';
import FormatIndentIncreaseIcon from '@mui/icons-material/FormatIndentIncrease';
import FormatIndentDecreaseIcon from '@mui/icons-material/FormatIndentDecrease';
import CodeIcon from '@mui/icons-material/Code';
import RefreshIcon from '@mui/icons-material/Refresh';
import WrapTextIcon from '@mui/icons-material/WrapText';

// Code Editor
import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/mode-json';
import 'ace-builds/src-noconflict/theme-github';
import 'ace-builds/src-noconflict/theme-monokai';
import 'ace-builds/src-noconflict/ext-language_tools';
import 'ace-builds/src-noconflict/ext-searchbox';

export function JsonDataEditor({
  value = '',
  onChange,
  onFormat,
  onValidate,
  height = 500,
  readOnly = false,
  title = 'JSON Editor',
  showToolbar = true,
  showActions = true,
  theme = 'light',
  actionButtons = []
}) {
  const [editorContent, setEditorContent] = useState(value || '');
  const [editorSettings, setEditorSettings] = useState({
    wrapEnabled: true,
    readOnly: readOnly
  });
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });
  const [isValid, setIsValid] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Update editor content when value prop changes
  useEffect(() => {
    if (value !== undefined && value !== null) {
      setEditorContent(value);
    }
  }, [value]);

  // Update editor settings when readOnly prop changes
  useEffect(() => {
    setEditorSettings(prev => ({
      ...prev,
      readOnly
    }));
  }, [readOnly]);

  // Format the JSON content
  const formatJson = () => {
    try {
      setIsProcessing(true);
      
      // Parse and stringify to format
      let formatted;
      
      if (editorContent && editorContent.trim()) {
        const parsed = JSON.parse(editorContent);
        formatted = JSON.stringify(parsed, null, 2);
        
        setEditorContent(formatted);
        if (onChange) onChange(formatted);
        
        showNotification('JSON formatted successfully', 'success');
        setIsValid(true);
      } else {
        showNotification('No content to format', 'warning');
      }
      
      if (onFormat) onFormat(formatted);
    } catch (error) {
      console.error('JSON formatting error:', error);
      showNotification('Invalid JSON: ' + error.message, 'error');
      setIsValid(false);
    } finally {
      setIsProcessing(false);
    }
  };

  // Minify the JSON content
  const minifyJson = () => {
    try {
      setIsProcessing(true);
      
      if (editorContent && editorContent.trim()) {
        const parsed = JSON.parse(editorContent);
        const minified = JSON.stringify(parsed);
        
        setEditorContent(minified);
        if (onChange) onChange(minified);
        
        showNotification('JSON minified successfully', 'success');
        setIsValid(true);
      } else {
        showNotification('No content to minify', 'warning');
      }
    } catch (error) {
      console.error('JSON minification error:', error);
      showNotification('Invalid JSON: ' + error.message, 'error');
      setIsValid(false);
    } finally {
      setIsProcessing(false);
    }
  };

  // Validate the JSON content
  const validateJson = () => {
    try {
      setIsProcessing(true);
      
      if (editorContent && editorContent.trim()) {
        JSON.parse(editorContent);
        showNotification('JSON is valid', 'success');
        setIsValid(true);
        
        if (onValidate) onValidate(true);
      } else {
        showNotification('No content to validate', 'warning');
      }
    } catch (error) {
      console.error('JSON validation error:', error);
      showNotification('Invalid JSON: ' + error.message, 'error');
      setIsValid(false);
      
      if (onValidate) onValidate(false, error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Clear the editor content
  const clearEditor = () => {
    setEditorContent('');
    if (onChange) onChange('');
    showNotification('Editor cleared', 'info');
  };

  // Copy editor content to clipboard
  const copyToClipboard = () => {
    if (!editorContent) {
      showNotification('No content to copy', 'warning');
      return;
    }
    
    navigator.clipboard.writeText(editorContent)
      .then(() => {
        showNotification('Content copied to clipboard', 'success');
      })
      .catch(err => {
        console.error('Error copying to clipboard:', err);
        showNotification('Failed to copy to clipboard', 'error');
      });
  };

  // Paste from clipboard
  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setEditorContent(text);
      if (onChange) onChange(text);
      showNotification('Content pasted from clipboard', 'success');
    } catch (err) {
      console.error('Error pasting from clipboard:', err);
      showNotification('Failed to paste from clipboard', 'error');
    }
  };

  // Toggle word wrap
  const toggleWordWrap = () => {
    setEditorSettings(prev => ({
      ...prev,
      wrapEnabled: !prev.wrapEnabled
    }));
    showNotification(`Word wrap ${editorSettings.wrapEnabled ? 'disabled' : 'enabled'}`, 'info');
  };

  // Handle editor content change
  const handleEditorChange = (newValue) => {
    setEditorContent(newValue);
    if (onChange) onChange(newValue);
  };

  // Show notification
  const showNotification = (message, severity) => {
    setNotification({
      open: true,
      message,
      severity: severity || 'info'
    });
  };

  // Close notification
  const closeNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  return (
    <Card>
      {title && <CardHeader title={title} />}
      
      {showToolbar && (
        <Toolbar variant="dense" sx={{ 
          px: 1, 
          bgcolor: theme === 'dark' ? 'grey.900' : 'grey.100',
          borderBottom: 1,
          borderColor: 'divider'
        }}>
          <ButtonGroup variant="text" size="small" sx={{ mr: 1 }}>
            <Tooltip title="Format JSON">
              <IconButton onClick={formatJson} disabled={isProcessing}>
                <FormatIndentIncreaseIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Minify JSON">
              <IconButton onClick={minifyJson} disabled={isProcessing}>
                <FormatIndentDecreaseIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Validate JSON">
              <IconButton onClick={validateJson} disabled={isProcessing}>
                <CodeIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </ButtonGroup>
          
          <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
          
          <ButtonGroup variant="text" size="small" sx={{ mr: 1 }}>
            <Tooltip title="Copy to Clipboard">
              <IconButton onClick={copyToClipboard} disabled={!editorContent}>
                <ContentCopyIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Paste from Clipboard">
              <IconButton onClick={pasteFromClipboard} disabled={editorSettings.readOnly}>
                <ContentPasteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Clear Editor">
              <IconButton onClick={clearEditor} disabled={!editorContent || editorSettings.readOnly}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </ButtonGroup>
          
          <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
          
          <Tooltip title={editorSettings.wrapEnabled ? "Disable Word Wrap" : "Enable Word Wrap"}>
            <IconButton onClick={toggleWordWrap}>
              <WrapTextIcon fontSize="small" color={editorSettings.wrapEnabled ? "primary" : "inherit"} />
            </IconButton>
          </Tooltip>
          
          <Box sx={{ flexGrow: 1 }} />
          
          {isProcessing && <CircularProgress size={24} sx={{ mr: 2 }} />}
          
          <Typography variant="caption" color={isValid ? "success.main" : "error.main"}>
            {isValid ? "Valid JSON" : "Invalid JSON"}
          </Typography>
        </Toolbar>
      )}
      
      <CardContent sx={{ p: 0 }}>
        <AceEditor
          mode="json"
          theme={theme === 'dark' ? 'monokai' : 'github'}
          width="100%"
          height={`${height}px`}
          value={editorContent}
          onChange={handleEditorChange}
          name="json-data-editor"
          editorProps={{ $blockScrolling: true }}
          setOptions={{
            useWorker: false,
            showLineNumbers: true,
            tabSize: 2,
            showPrintMargin: false,
            wrapEnabled: editorSettings.wrapEnabled,
            readOnly: editorSettings.readOnly
          }}
        />
      </CardContent>
      
      {showActions && (
        <CardActions>
          <Button 
            startIcon={<DeleteIcon />} 
            onClick={clearEditor}
            disabled={!editorContent || editorSettings.readOnly}
          >
            Clear
          </Button>
          
          <Box sx={{ flexGrow: 1 }} />
          
          {actionButtons.map((button, index) => (
            <React.Fragment key={index}>
              {button}
            </React.Fragment>
          ))}
        </CardActions>
      )}
      
      {/* Notification system */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={closeNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
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
    </Card>
  );
}

// Define Divider component that was used in the code but wasn't imported
const Divider = ({ orientation = 'horizontal', flexItem = false, sx = {} }) => (
  <Box
    component="hr"
    sx={{
      m: 0,
      p: 0,
      border: 'none',
      ...(orientation === 'vertical' ? {
        height: flexItem ? 'auto' : '100%',
        borderLeftWidth: '1px',
        borderLeftStyle: 'solid',
        borderLeftColor: 'divider',
        display: 'inline-block',
      } : {
        width: '100%',
        borderTopWidth: '1px',
        borderTopStyle: 'solid',
        borderTopColor: 'divider',
      }),
      ...sx
    }}
  />
);

JsonDataEditor.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func,
  onFormat: PropTypes.func,
  onValidate: PropTypes.func,
  height: PropTypes.number,
  readOnly: PropTypes.bool,
  title: PropTypes.string,
  showToolbar: PropTypes.bool,
  showActions: PropTypes.bool,
  theme: PropTypes.oneOf(['light', 'dark']),
  actionButtons: PropTypes.array
};

export default JsonDataEditor;