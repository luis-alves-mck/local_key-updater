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
} from '@mui/material';

const CopyKeyDialog = ({ open, onClose, keyData, environments, onCopy }) => {
  const [selectedEnv, setSelectedEnv] = useState('');
  const [error, setError] = useState('');

  const handleCopy = async () => {
    if (!keyData) return;
    
    try {
      await onCopy(keyData.key_name, selectedEnv);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to copy key');
    }
  };

  // Reset state when dialog closes
  React.useEffect(() => {
    if (!open) {
      setSelectedEnv('');
      setError('');
    }
  }, [open]);

  if (!keyData) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Copy Key to Environment</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <TextField
          fullWidth
          label="Key Name"
          value={keyData.key_name}
          disabled
          margin="normal"
        />
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

export default CopyKeyDialog; 