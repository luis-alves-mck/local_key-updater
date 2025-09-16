import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert
} from '@mui/material';
import { Delete, Add, Edit } from '@mui/icons-material';
import axios from 'axios';

function EditUseCaseDialog({ open, onClose, useCase, keys, onUpdate }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  // Form states for adding new key
  const [selectedKey, setSelectedKey] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [keyPriority, setKeyPriority] = useState(1);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Current use case keys
  const [currentKeys, setCurrentKeys] = useState([]);

  useEffect(() => {
    if (useCase) {
      setCurrentKeys(useCase.openai_keys || []);
    }
    setError(null);
    setSuccess(false);
  }, [useCase]);

  const getAvailableKeys = () => {
    return keys.filter(key => 
      !currentKeys.some(ck => ck.key_name === key.key_name)
    );
  };

  const getAvailableModels = () => {
    if (!selectedKey) return [];
    const key = keys.find(k => k.key_name === selectedKey);
    return key?.available_models || [];
  };


  const handleAddKey = async () => {
    if (!selectedKey || !selectedModel || !keyPriority) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await axios.post(
        `http://localhost:5000/api/use-cases/${encodeURIComponent(useCase.use_case_name)}/keys`,
        {
          key_name: selectedKey,
          model_name: selectedModel,
          key_priority: parseInt(keyPriority)
        }
      );

      setCurrentKeys(response.data.openai_keys);
      setSelectedKey('');
      setSelectedModel('');
      setKeyPriority(1);
      setShowAddForm(false);
      setSuccess(true);
      
      if (onUpdate) {
        onUpdate(response.data);
      }
    } catch (error) {
      console.error('Error adding key:', error);
      setError(error.response?.data?.message || 'Failed to add key to use case');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveKey = async (keyName, modelName) => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.delete(
        `http://localhost:5000/api/use-cases/${encodeURIComponent(useCase.use_case_name)}/keys/${encodeURIComponent(keyName)}/${encodeURIComponent(modelName)}`
      );

      setCurrentKeys(response.data.openai_keys);
      setSuccess(true);
      
      if (onUpdate) {
        onUpdate(response.data);
      }
    } catch (error) {
      console.error('Error removing key:', error);
      setError(error.response?.data?.message || 'Failed to remove key from use case');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateKeyPriority = async (keyName, modelName, newPriority) => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.put(
        `http://localhost:5000/api/use-cases/${encodeURIComponent(useCase.use_case_name)}/keys/${encodeURIComponent(keyName)}/${encodeURIComponent(modelName)}`,
        {
          key_priority: parseInt(newPriority)
        }
      );

      setCurrentKeys(response.data.openai_keys);
      setSuccess(true);
      
      if (onUpdate) {
        onUpdate(response.data);
      }
    } catch (error) {
      console.error('Error updating key priority:', error);
      setError(error.response?.data?.message || 'Failed to update key priority');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setShowAddForm(false);
    setSelectedKey('');
    setSelectedModel('');
    setKeyPriority(1);
    setError(null);
    setSuccess(false);
    onClose();
  };

  if (!useCase) return null;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">
            Edit Use Case: {useCase.use_case_name}
          </Typography>
          <Button
            variant="outlined"
            startIcon={<Add />}
            onClick={() => setShowAddForm(!showAddForm)}
            disabled={loading}
          >
            Add Key
          </Button>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Use case updated successfully!
          </Alert>
        )}

        {showAddForm && (
          <Paper sx={{ p: 2, mb: 3, bgcolor: '#f8f9fa' }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Add New Key
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>Select Key</InputLabel>
                <Select
                  value={selectedKey}
                  label="Select Key"
                  onChange={(e) => {
                    setSelectedKey(e.target.value);
                    setSelectedModel('');
                  }}
                  disabled={loading}
                >
                  {getAvailableKeys().map((key) => (
                    <MenuItem key={key.key_name} value={key.key_name}>
                      {key.key_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl sx={{ minWidth: 200 }} disabled={!selectedKey}>
                <InputLabel>Select Model</InputLabel>
                <Select
                  value={selectedModel}
                  label="Select Model"
                  onChange={(e) => setSelectedModel(e.target.value)}
                  disabled={loading || !selectedKey}
                >
                  {getAvailableModels().map((model) => (
                    <MenuItem key={model} value={model}>
                      {model}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                label="Priority"
                type="number"
                value={keyPriority}
                onChange={(e) => setKeyPriority(e.target.value)}
                sx={{ width: 120 }}
                inputProps={{ min: 1, max: 100 }}
                disabled={loading}
              />

              <Button
                variant="contained"
                onClick={handleAddKey}
                disabled={loading || !selectedKey || !selectedModel || !keyPriority}
              >
                Add
              </Button>

              <Button
                variant="outlined"
                onClick={() => setShowAddForm(false)}
                disabled={loading}
              >
                Cancel
              </Button>
            </Box>
          </Paper>
        )}

        <Typography variant="h6" sx={{ mb: 2 }}>
          Current Keys ({currentKeys.length})
        </Typography>

        {currentKeys.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
            <Typography>No keys associated with this use case</Typography>
          </Box>
        ) : (
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Key Name</TableCell>
                  <TableCell>Model</TableCell>
                  <TableCell>Priority</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {currentKeys.map((keyAssociation) => (
                  <TableRow key={`${keyAssociation.key_name}-${keyAssociation.model_name}`}>
                    <TableCell>
                      <Chip 
                        label={keyAssociation.key_name}
                        size="small"
                        sx={{ bgcolor: '#e3f2fd', color: '#1976d2' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={keyAssociation.model_name}
                        size="small"
                        color="secondary"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        type="number"
                        value={keyAssociation.key_priority}
                        onChange={(e) => handleUpdateKeyPriority(
                          keyAssociation.key_name,
                          keyAssociation.model_name,
                          e.target.value
                        )}
                        size="small"
                        sx={{ width: 80 }}
                        inputProps={{ min: 1, max: 100 }}
                        disabled={loading}
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton
                        color="error"
                        size="small"
                        onClick={() => handleRemoveKey(keyAssociation.key_name, keyAssociation.model_name)}
                        disabled={loading}
                      >
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default EditUseCaseDialog;