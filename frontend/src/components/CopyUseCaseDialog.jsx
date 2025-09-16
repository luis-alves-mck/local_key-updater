import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Typography,
  Box,
  Chip
} from '@mui/material';

const CopyUseCaseDialog = ({ open, onClose, useCaseData, environments, onCopy }) => {
  const [selectedEnv, setSelectedEnv] = useState('');
  const [error, setError] = useState('');

  const handleCopy = async () => {
    if (!useCaseData) return;
    
    try {
      await onCopy(useCaseData.use_case_name, selectedEnv);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to copy use case');
    }
  };

  // Reset state when dialog closes
  React.useEffect(() => {
    if (!open) {
      setSelectedEnv('');
      setError('');
    }
  }, [open]);

  if (!useCaseData) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Copy Use Case to Environment</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <TextField
          fullWidth
          label="Use Case Name"
          value={useCaseData.use_case_name}
          disabled
          margin="normal"
        />
        
        <Box sx={{ mt: 2, mb: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Associated Keys ({useCaseData.openai_keys?.length || 0})
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {useCaseData.openai_keys?.map((keyAssociation) => (
              <Chip
                key={`${keyAssociation.key_name}-${keyAssociation.model_name}`}
                label={`${keyAssociation.key_name} (${keyAssociation.model_name})`}
                size="small"
                sx={{ bgcolor: '#e3f2fd', color: '#1976d2' }}
              />
            )) || (
              <Typography variant="body2" color="text.secondary">
                No keys associated
              </Typography>
            )}
          </Box>
        </Box>
        
        <FormControl fullWidth margin="normal">
          <InputLabel>Target Environment</InputLabel>
          <Select
            value={selectedEnv}
            onChange={(e) => setSelectedEnv(e.target.value)}
            label="Target Environment"
          >
            <MenuItem key="both" value="both">
              Both (Beta & Production)
            </MenuItem>
            {environments
              .filter((env) => env.name !== 'development')
              .map((env) => (
                <MenuItem key={env.name} value={env.name}>
                  {env.displayName || env.name}
                </MenuItem>
              ))}
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleCopy}
          variant="contained"
          disabled={!selectedEnv}
        >
          Copy
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CopyUseCaseDialog;