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
  Box,
  Chip,
  OutlinedInput,
  IconButton,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

const CreateKeyDialog = ({ open, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    key_name: '',
    key_secrets_data: {
      api_key: '',
      api_base_url: 'https://api.openai.com/v1',
      api_type: 'openai',
      api_version: 'v1',
    },
    available_models: [],
    is_work_with_embeddings: false,
    use_cases: [],
  });
  const [newUseCase, setNewUseCase] = useState('');
  const [newModel, setNewModel] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    try {
      await onSubmit(formData);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create key');
    }
  };

  const handleChange = React.useCallback((field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  }, []);

  const handleAddUseCase = () => {
    if (newUseCase.trim() && !formData.use_cases.includes(newUseCase.trim())) {
      handleChange('use_cases', [...formData.use_cases, newUseCase.trim()]);
      setNewUseCase('');
    }
  };

  const handleAddModel = () => {
    if (newModel.trim() && !formData.available_models.includes(newModel.trim())) {
      handleChange('available_models', [...formData.available_models, newModel.trim()]);
      setNewModel('');
    }
  };

  const handleRemoveUseCase = (useCaseToRemove) => {
    handleChange('use_cases', formData.use_cases.filter(uc => uc !== useCaseToRemove));
  };

  const handleRemoveModel = (modelToRemove) => {
    handleChange('available_models', formData.available_models.filter(m => m !== modelToRemove));
  };

  const handleKeyPress = (event, type) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      if (type === 'useCase') {
        handleAddUseCase();
      } else if (type === 'model') {
        handleAddModel();
      }
    }
  };

  // Update API base URL when API type changes
  React.useEffect(() => {
    const apiType = formData.key_secrets_data.api_type;
    let newBaseUrl = 'https://api.openai.com/v1';
    
    if (apiType === 'google') {
      newBaseUrl = 'https://generativelanguage.googleapis.com/v1';
    } else if (apiType === 'anthropic') {
      newBaseUrl = 'https://api.anthropic.com/v1';
    } else if (apiType === 'azure') {
      newBaseUrl = 'https://your-resource.openai.azure.com';
    }
    
    if (formData.key_secrets_data.api_base_url !== newBaseUrl) {
      handleChange('key_secrets_data.api_base_url', newBaseUrl);
    }
  }, [formData.key_secrets_data.api_type, formData.key_secrets_data.api_base_url, handleChange]);

  // Reset form when dialog closes
  React.useEffect(() => {
    if (!open) {
      setFormData({
        key_name: '',
        key_secrets_data: {
          api_key: '',
          api_base_url: 'https://api.openai.com/v1',
          api_type: 'openai',
          api_version: 'v1',
        },
        available_models: [],
        is_work_with_embeddings: false,
        use_cases: [],
      });
      setNewUseCase('');
      setNewModel('');
      setError('');
    }
  }, [open]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Create New Key</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
          <TextField
            fullWidth
            label="Key Name"
            value={formData.key_name}
            onChange={(e) => handleChange('key_name', e.target.value)}
            required
          />
          <TextField
            fullWidth
            label="API Key"
            value={formData.key_secrets_data.api_key}
            onChange={(e) => handleChange('key_secrets_data.api_key', e.target.value)}
            required
          />
          <TextField
            fullWidth
            label="API Base URL"
            value={formData.key_secrets_data.api_base_url}
            onChange={(e) => handleChange('key_secrets_data.api_base_url', e.target.value)}
            required
          />
          <FormControl fullWidth>
            <InputLabel>API Type</InputLabel>
            <Select
              value={formData.key_secrets_data.api_type}
              onChange={(e) => handleChange('key_secrets_data.api_type', e.target.value)}
              label="API Type"
              required
            >
              <MenuItem value="openai">OpenAI</MenuItem>
              <MenuItem value="azure">Azure</MenuItem>
              <MenuItem value="anthropic">Anthropic</MenuItem>
              <MenuItem value="google">Google</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="API Version"
            value={formData.key_secrets_data.api_version}
            onChange={(e) => handleChange('key_secrets_data.api_version', e.target.value)}
            required
          />
          <Box>
            <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
              <TextField
                fullWidth
                label="New Model"
                value={newModel}
                onChange={(e) => setNewModel(e.target.value)}
                onKeyPress={(e) => handleKeyPress(e, 'model')}
                placeholder="Enter model name and press Enter or click Add"
              />
              <IconButton 
                onClick={handleAddModel}
                color="primary"
                disabled={!newModel.trim()}
              >
                <AddIcon />
              </IconButton>
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {formData.available_models.map((model) => (
                <Chip
                  key={model}
                  label={model}
                  onDelete={() => handleRemoveModel(model)}
                />
              ))}
            </Box>
          </Box>
          <Box>
            <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
              <TextField
                fullWidth
                label="New Use Case"
                value={newUseCase}
                onChange={(e) => setNewUseCase(e.target.value)}
                onKeyPress={(e) => handleKeyPress(e, 'useCase')}
                placeholder="Enter use case name and press Enter or click Add"
              />
              <IconButton 
                onClick={handleAddUseCase}
                color="primary"
                disabled={!newUseCase.trim()}
              >
                <AddIcon />
              </IconButton>
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {formData.use_cases.map((useCase) => (
                <Chip
                  key={useCase}
                  label={useCase}
                  onDelete={() => handleRemoveUseCase(useCase)}
                />
              ))}
            </Box>
          </Box>
          <FormControl fullWidth>
            <InputLabel>Embeddings Support</InputLabel>
            <Select
              value={formData.is_work_with_embeddings}
              onChange={(e) => handleChange('is_work_with_embeddings', e.target.value)}
              label="Embeddings Support"
            >
              <MenuItem value={true}>Yes</MenuItem>
              <MenuItem value={false}>No</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!formData.key_name || !formData.key_secrets_data.api_key || formData.available_models.length === 0}
        >
          Create
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateKeyDialog; 