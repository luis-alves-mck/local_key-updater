import { memo, useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControlLabel,
  Checkbox,
  Box,
  Chip,
  Autocomplete,
  Typography,
  Tooltip,
  IconButton,
  Alert
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import AddIcon from '@mui/icons-material/Add';

const EditKeyDialog = memo(({
  open,
  onClose,
  keyData,
  handleSubmit,
  getKeysWithSameApiKey,
  useCases,
  getUseCasesForKey,
  isDevelopment
}) => {
  const [formData, setFormData] = useState(keyData);
  const [availableModels, setAvailableModels] = useState([]);
  const [relatedKeys, setRelatedKeys] = useState([]);
  const [newUseCase, setNewUseCase] = useState('');
  const [newModel, setNewModel] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setFormData({
      ...keyData,
      use_cases: keyData ? getUseCasesForKey(keyData.key_name).map(uc => uc.use_case_name) : []
    });
    if (keyData?.available_models) {
      setAvailableModels(keyData.available_models);
    }
    if (keyData?.key_secrets_data?.api_key) {
      setRelatedKeys(getKeysWithSameApiKey(keyData.key_secrets_data.api_key, keyData.key_name));
    }
  }, [keyData, getKeysWithSameApiKey]);

  const handleInputChange = (e) => {
    if (!isDevelopment) return;
    
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === 'checkbox' ? checked : value
        }
      }));
      if (parent === 'key_secrets_data' && child === 'api_key') {
        setRelatedKeys(getKeysWithSameApiKey(value, formData.key_name));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleAddUseCase = () => {
    if (!isDevelopment) return;
    
    if (newUseCase.trim() && !formData.use_cases?.includes(newUseCase.trim())) {
      setFormData(prev => ({
        ...prev,
        use_cases: [...(prev.use_cases || []), newUseCase.trim()]
      }));
      setNewUseCase('');
    }
  };

  const handleAddModel = () => {
    if (!isDevelopment) return;
    
    if (newModel.trim() && !availableModels.includes(newModel.trim())) {
      setAvailableModels(prev => [...prev, newModel.trim()]);
      setNewModel('');
    }
  };

  const handleRemoveUseCase = (useCaseToRemove) => {
    if (!isDevelopment) return;
    
    setFormData(prev => ({
      ...prev,
      use_cases: (prev.use_cases || []).filter(uc => uc !== useCaseToRemove)
    }));
  };

  const handleRemoveModel = (modelToRemove) => {
    if (!isDevelopment) return;
    
    setAvailableModels(prev => prev.filter(m => m !== modelToRemove));
  };

  const handleKeyPress = (event, type) => {
    if (!isDevelopment) return;
    
    if (event.key === 'Enter') {
      event.preventDefault();
      if (type === 'useCase') {
        handleAddUseCase();
      } else if (type === 'model') {
        handleAddModel();
      }
    }
  };

  const handleSave = () => {
    if (!isDevelopment) {
      onClose();
      return;
    }
    
    try {
      handleSubmit({
        ...formData,
        available_models: availableModels
      });
    } catch (err) {
      setError(err.message || 'Failed to update key');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{isDevelopment ? 'Edit Key' : 'View Key'}</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TextField
              label="Key Name"
              name="key_name"
              value={formData?.key_name || ''}
              onChange={handleInputChange}
              fullWidth
              disabled={!isDevelopment}
              inputProps={{ 'data-testid': 'key-name-input' }}
            />
            {relatedKeys.length > 0 && (
              <Tooltip 
                title={
                  <Box>
                    <Typography variant="body2">This API key is also used by:</Typography>
                    {relatedKeys.map(key => (
                      <Typography key={key} variant="body2">- {key}</Typography>
                    ))}
                  </Box>
                }
              >
                <InfoIcon color="warning" />
              </Tooltip>
            )}
          </Box>
          <TextField
            label="API Base URL"
            name="key_secrets_data.api_base_url"
            value={formData?.key_secrets_data?.api_base_url || ''}
            onChange={handleInputChange}
            fullWidth
            disabled={!isDevelopment}
            inputProps={{ 'data-testid': 'api-base-url-input' }}
          />
          <TextField
            label="API Version"
            name="key_secrets_data.api_version"
            value={formData?.key_secrets_data?.api_version || ''}
            onChange={handleInputChange}
            fullWidth
            disabled={!isDevelopment}
            inputProps={{ 'data-testid': 'api-version-input' }}
          />
          <TextField
            label="API Key"
            name="key_secrets_data.api_key"
            value={formData?.key_secrets_data?.api_key || ''}
            onChange={handleInputChange}
            fullWidth
            disabled={!isDevelopment}
            inputProps={{ 'data-testid': 'api-key-input' }}
          />
          <TextField
            label="API Type"
            name="key_secrets_data.api_type"
            value={formData?.key_secrets_data?.api_type || ''}
            onChange={handleInputChange}
            fullWidth
            disabled={!isDevelopment}
            inputProps={{ 'data-testid': 'api-type-input' }}
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
                disabled={!isDevelopment}
              />
              <IconButton 
                onClick={handleAddModel}
                color="primary"
                disabled={!isDevelopment || !newModel.trim()}
              >
                <AddIcon />
              </IconButton>
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {availableModels.map((model) => (
                <Chip
                  key={model}
                  label={model}
                  onDelete={isDevelopment ? () => handleRemoveModel(model) : undefined}
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
                disabled={!isDevelopment}
              />
              <IconButton 
                onClick={handleAddUseCase}
                color="primary"
                disabled={!isDevelopment || !newUseCase.trim()}
              >
                <AddIcon />
              </IconButton>
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {formData?.use_cases?.map((useCase) => (
                <Chip
                  key={useCase}
                  label={useCase}
                  onDelete={isDevelopment ? () => handleRemoveUseCase(useCase) : undefined}
                />
              ))}
            </Box>
          </Box>
          <FormControlLabel
            control={
              <Checkbox
                checked={formData?.is_work_with_embeddings || false}
                onChange={handleInputChange}
                name="is_work_with_embeddings"
                disabled={!isDevelopment}
                inputProps={{ 'data-testid': 'embeddings-checkbox' }}
              />
            }
            label="Works with Embeddings"
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{isDevelopment ? 'Cancel' : 'Close'}</Button>
        {isDevelopment && (
          <Button onClick={handleSave} variant="contained">Save</Button>
        )}
      </DialogActions>
    </Dialog>
  );
});

EditKeyDialog.displayName = 'EditKeyDialog';

export default EditKeyDialog; 