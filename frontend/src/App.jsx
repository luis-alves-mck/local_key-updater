import { useState, useEffect, useCallback } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  List,
  ListItem,
  ListItemText,
  Divider,
  Collapse,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress,
  Menu,
  IconButton,
  Tabs,
  Tab,
} from '@mui/material';
import { ExpandLess, ExpandMore, Warning, MoreVert } from '@mui/icons-material';
import axios from 'axios';
import EditKeyDialog from './components/EditKeyDialog';
import CopyKeyDialog from './components/CopyKeyDialog';
import CreateKeyDialog from './components/CreateKeyDialog';
import ServiceAccountDialog from './components/ServiceAccountDialog';
import UseCasesScreen from './components/UseCasesScreen';

function App() {
  const [keys, setKeys] = useState([]);
  const [useCases, setUseCases] = useState([]);
  const [environments, setEnvironments] = useState([]);
  const [currentEnvironment, setCurrentEnvironment] = useState('development');
  const [currentTab, setCurrentTab] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [openExpirationDialog, setOpenExpirationDialog] = useState(false);
  const [selectedKey, setSelectedKey] = useState(null);
  const [expirationDays, setExpirationDays] = useState('');
  const [logs, setLogs] = useState([]);
  const [showLogs, setShowLogs] = useState(false);
  const [isBackendAvailable, setIsBackendAvailable] = useState(true);
  const [isSwitchingEnvironment, setIsSwitchingEnvironment] = useState(false);
  const [isValidatingEnvironment, setIsValidatingEnvironment] = useState(false);
  const [openCopyDialog, setOpenCopyDialog] = useState(false);
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openServiceAccountDialog, setOpenServiceAccountDialog] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuKeyId, setMenuKeyId] = useState(null);

  const checkBackendHealth = async () => {
    try {
      await axios.get('http://localhost:5000/health');
      setIsBackendAvailable(true);
    } catch (err) {
      setIsBackendAvailable(false);
    }
  };

  useEffect(() => {
    checkBackendHealth();
    if (isBackendAvailable) {
      fetchEnvironments();
      fetchData();
      loadLogs();
    }
  }, [isBackendAvailable]);

  useEffect(() => {
    loadLogs();
  }, [currentEnvironment]);

  const fetchEnvironments = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/environments');
      setEnvironments(response.data);
    } catch (error) {
      console.error('Error fetching environments:', error);
    }
  };

  const handleEnvironmentChange = async (event) => {
    const newEnvironment = event.target.value;
    try {
      setIsSwitchingEnvironment(true);
      await axios.post(`http://localhost:5000/api/environments/switch/${newEnvironment}`);
      setCurrentEnvironment(newEnvironment);
      await fetchData();
    } catch (error) {
      console.error('Error switching environment:', error);
    } finally {
      setIsSwitchingEnvironment(false);
    }
  };

  const loadLogs = () => {
    try {
      const storedLogs = localStorage.getItem(`keyUpdateLogs_${currentEnvironment}`);
      if (storedLogs) {
        setLogs(JSON.parse(storedLogs));
      } else {
        setLogs([]);
      }
    } catch (error) {
      console.error('Error loading logs:', error);
      setLogs([]);
    }
  };

  const addLog = (log) => {
    try {
      const newLog = {
        ...log,
        environment: currentEnvironment,
        timestamp: new Date().toISOString()
      };
      const newLogs = [newLog, ...logs];
      setLogs(newLogs);
      localStorage.setItem(`keyUpdateLogs_${currentEnvironment}`, JSON.stringify(newLogs));
    } catch (error) {
      console.error('Error saving log:', error);
    }
  };

  const validateEnvironment = async () => {
    if (isValidatingEnvironment) return true;
    
    try {
      setIsValidatingEnvironment(true);
      const response = await axios.get('http://localhost:5000/api/environments/current');
      if (response.data.name !== currentEnvironment) {
        // Environment mismatch, update frontend state
        setCurrentEnvironment(response.data.name);
        // Refresh data for the correct environment
        await fetchData(true); // Pass true to skip validation
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error validating environment:', error);
      return false;
    } finally {
      setIsValidatingEnvironment(false);
    }
  };

  const fetchData = async (skipValidation = false) => {
    try {
      // Validate environment before fetching, unless explicitly skipped
      if (!skipValidation) {
        const isValid = await validateEnvironment();
        if (!isValid) {
          return;
        }
      }

      const [keysResponse, useCasesResponse] = await Promise.all([
        axios.get('http://localhost:5000/api/keys'),
        axios.get('http://localhost:5000/api/use-cases')
      ]);
      setKeys(keysResponse.data);
      setUseCases(useCasesResponse.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleOpenDialog = async (key) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/keys/${key._id}`);
      setSelectedKey(response.data);
      setOpenDialog(true);
    } catch (error) {
      console.error('Error fetching key details:', error);
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedKey(null);
  };

  const handleSubmit = async (formData) => {
    try {
      // Validate environment before updating
      const isValid = await validateEnvironment();
      if (!isValid) {
        return;
      }

      const changes = [];
      
      // Check for changes in key_secrets_data
      Object.keys(formData.key_secrets_data).forEach(field => {
        if (formData.key_secrets_data[field] !== selectedKey.key_secrets_data[field]) {
          changes.push(`API ${field.replace('_', ' ')}`);
        }
      });

      // Check for changes in other fields
      if (formData.is_work_with_embeddings !== selectedKey.is_work_with_embeddings) {
        changes.push('Embeddings status');
      }

      if (JSON.stringify(formData.available_models) !== JSON.stringify(selectedKey.available_models)) {
        changes.push('Available models');
      }

      // Handle use cases changes
      const currentUseCases = getUseCasesForKey(selectedKey.key_name).map(uc => uc.use_case_name);
      const newUseCases = formData.use_cases || [];
      
      // Find use cases to add and remove
      const useCasesToAdd = newUseCases.filter(uc => !currentUseCases.includes(uc));
      const useCasesToRemove = currentUseCases.filter(uc => !newUseCases.includes(uc));

      if (useCasesToAdd.length > 0 || useCasesToRemove.length > 0) {
        changes.push('Use cases');
      }

      if (changes.length > 0) {
        // Update the key
        await axios.put(`http://localhost:5000/api/keys/${selectedKey.key_name}`, formData);

        // Handle use case updates
        if (useCasesToAdd.length > 0 || useCasesToRemove.length > 0) {
          // Remove key from use cases that are being removed
          for (const useCaseName of useCasesToRemove) {
            const useCase = useCases.find(uc => uc.use_case_name === useCaseName);
            if (useCase) {
              await axios.put(`http://localhost:5000/api/use-cases/${useCaseName}`, {
                openai_keys: useCase.openai_keys.filter(key => key.key_name !== selectedKey.key_name)
              });
            }
          }

          // Add key to new use cases
          for (const useCaseName of useCasesToAdd) {
            const useCase = useCases.find(uc => uc.use_case_name === useCaseName);
            if (useCase) {
              // Add key to existing use case
              await axios.put(`http://localhost:5000/api/use-cases/${useCaseName}`, {
                openai_keys: [
                  ...useCase.openai_keys,
                  {
                    key_name: selectedKey.key_name,
                    model_name: formData.available_models[0],
                    key_priority: 1
                  }
                ]
              });
            } else {
              // Create new use case
              await axios.post('http://localhost:5000/api/use-cases', {
                use_case_name: useCaseName,
                openai_keys: [{
                  key_name: selectedKey.key_name,
                  model_name: formData.available_models[0],
                  key_priority: 1
                }]
              });
            }
          }
        }
        
        addLog({
          type: 'update',
          keyName: selectedKey.key_name,
          changes: changes,
          timestamp: new Date().toISOString()
        });

        fetchData();
      }
      
      handleCloseDialog();
    } catch (error) {
      console.error('Error updating key:', error);
      throw error;
    }
  };

  const getUseCasesForKey = (keyName) => {
    return useCases.filter(useCase => 
      useCase.openai_keys.some(key => key.key_name === keyName)
    );
  };

  const handleOpenExpirationDialog = (key) => {
    setSelectedKey(key);
    setOpenExpirationDialog(true);
  };

  const handleCloseExpirationDialog = () => {
    setOpenExpirationDialog(false);
    setSelectedKey(null);
    setExpirationDays('');
  };

  const handleUpdateExpiration = async () => {
    try {
      // Validate environment before updating
      const isValid = await validateEnvironment();
      if (!isValid) {
        return;
      }

      const days = parseInt(expirationDays);
      if (isNaN(days) || days < 0) {
        alert('Please enter a valid number of days');
        return;
      }

      await axios.put(`http://localhost:5000/api/keys/${selectedKey._id}/expiration`, { days });
      
      addLog({
        type: 'expiration',
        keyName: selectedKey.key_name,
        days: days,
        timestamp: new Date().toISOString()
      });

      fetchData();
      handleCloseExpirationDialog();
    } catch (error) {
      console.error('Error updating expiration:', error);
    }
  };

  const isExpiringSoon = (expiresAt) => {
    if (!expiresAt) return false;
    const expirationDate = new Date(expiresAt);
    const today = new Date();
    const daysUntilExpiration = Math.ceil((expirationDate - today) / (1000 * 60 * 60 * 24));
    return daysUntilExpiration <= 14 && daysUntilExpiration >= 0;
  };

  const clearHistory = () => {
    try {
      localStorage.removeItem(`keyUpdateLogs_${currentEnvironment}`);
      setLogs([]);
    } catch (error) {
      console.error('Error clearing logs:', error);
    }
  };

  const getKeysWithSameApiKey = (apiKey, currentKeyName) => {
    return keys.filter(key => 
      key.key_secrets_data?.api_key === apiKey && 
      key.key_name !== currentKeyName
    ).map(key => key.key_name);
  };

  const getEnvironmentColor = (envName) => {
    switch (envName) {
      case 'development':
        return {
          bgcolor: '#e3f2fd', // Light blue
          textColor: '#1976d2' // Blue
        };
      case 'staging':
        return {
          bgcolor: '#fff3e0', // Light orange
          textColor: '#f57c00' // Orange
        };
      case 'production':
        return {
          bgcolor: '#fbe9e7', // Light red
          textColor: '#d32f2f' // Red
        };
      default:
        return {
          bgcolor: '#f5f5f5', // Light grey
          textColor: '#757575' // Grey
        };
    }
  };

  const handleOpenCopyDialog = (key) => {
    setSelectedKey(key);
    setOpenCopyDialog(true);
  };

  const handleCloseCopyDialog = () => {
    setOpenCopyDialog(false);
    setSelectedKey(null);
  };

  const handleCopyKey = async (keyName, targetEnvironment) => {
    try {
      if (targetEnvironment === 'both') {
        // Use the new API endpoint for copying to both environments
        const response = await axios.post(`http://localhost:5000/api/keys/copy/${keyName}/both`);
        
        // Handle different response statuses
        if (response.status === 201) {
          // Complete success
          addLog({
            type: 'copy',
            keyName: keyName,
            targetEnvironment: 'both (Beta & Production)',
            timestamp: new Date().toISOString(),
            status: 'success'
          });
        } else if (response.status === 207) {
          // Partial success
          const results = response.data.results;
          const successEnvs = results.filter(r => r.success).map(r => r.environment);
          const failedEnvs = results.filter(r => !r.success).map(r => r.environment);
          
          addLog({
            type: 'copy',
            keyName: keyName,
            targetEnvironment: `Partial: ${successEnvs.join(', ')} (Failed: ${failedEnvs.join(', ')})`,
            timestamp: new Date().toISOString(),
            status: 'partial'
          });
          
          // Show warning for partial success
          console.warn(`Key copied to ${successEnvs.length}/2 environments. Failed: ${failedEnvs.join(', ')}`);
        }

        // Refresh data for both environments
        const currentEnv = currentEnvironment;
        setCurrentEnvironment('staging');
        await fetchData(true);
        setCurrentEnvironment('production');
        await fetchData(true);
        setCurrentEnvironment(currentEnv);
        await fetchData(true);
      } else {
        // Use the existing API endpoint for single environment
        await axios.post(`http://localhost:5000/api/keys/copy/${keyName}`, {
          targetEnvironment
        });
        
        addLog({
          type: 'copy',
          keyName: keyName,
          targetEnvironment: targetEnvironment,
          timestamp: new Date().toISOString(),
          status: 'success'
        });

        // Refresh data in the target environment
        const currentEnv = currentEnvironment;
        setCurrentEnvironment(targetEnvironment);
        await fetchData(true);
        setCurrentEnvironment(currentEnv);
        await fetchData(true);
      }
      
      handleCloseCopyDialog();
    } catch (error) {
      // Enhanced error handling
      if (error.response?.status === 500 && targetEnvironment === 'both') {
        // Complete failure for both environments
        addLog({
          type: 'copy',
          keyName: keyName,
          targetEnvironment: 'both (Beta & Production)',
          timestamp: new Date().toISOString(),
          status: 'failed',
          error: error.response?.data?.message || 'Failed to copy to any environment'
        });
      }
      throw error;
    }
  };

  const handleCopyUseCase = async (useCaseName, targetEnvironment) => {
    try {
      if (targetEnvironment === 'both') {
        // Use the new API endpoint for copying to both environments
        const response = await axios.post(`http://localhost:5000/api/use-cases/copy/${useCaseName}/both`);
        
        // Handle different response statuses
        if (response.status === 201) {
          // Complete success
          addLog({
            type: 'copy',
            keyName: useCaseName, // Using keyName field for consistency with existing logs
            targetEnvironment: 'both (Beta & Production)',
            timestamp: new Date().toISOString(),
            status: 'success'
          });
        } else if (response.status === 207) {
          // Partial success
          const results = response.data.results;
          const successEnvs = results.filter(r => r.success).map(r => r.environment);
          const failedEnvs = results.filter(r => !r.success).map(r => r.environment);
          
          addLog({
            type: 'copy',
            keyName: useCaseName,
            targetEnvironment: `Partial: ${successEnvs.join(', ')} (Failed: ${failedEnvs.join(', ')})`,
            timestamp: new Date().toISOString(),
            status: 'partial'
          });
          
          // Show warning for partial success
          console.warn(`Use case copied to ${successEnvs.length}/2 environments. Failed: ${failedEnvs.join(', ')}`);
        }

        // Refresh data for both environments
        const currentEnv = currentEnvironment;
        setCurrentEnvironment('staging');
        await fetchData(true);
        setCurrentEnvironment('production');
        await fetchData(true);
        setCurrentEnvironment(currentEnv);
        await fetchData(true);
      } else {
        // Use the existing API endpoint for single environment
        await axios.post(`http://localhost:5000/api/use-cases/copy/${useCaseName}`, {
          targetEnvironment
        });
        
        addLog({
          type: 'copy',
          keyName: useCaseName,
          targetEnvironment: targetEnvironment,
          timestamp: new Date().toISOString(),
          status: 'success'
        });

        // Refresh data in the target environment
        const currentEnv = currentEnvironment;
        setCurrentEnvironment(targetEnvironment);
        await fetchData(true);
        setCurrentEnvironment(currentEnv);
        await fetchData(true);
      }
    } catch (error) {
      // Enhanced error handling
      if (error.response?.status === 500 && targetEnvironment === 'both') {
        // Complete failure for both environments
        addLog({
          type: 'copy',
          keyName: useCaseName,
          targetEnvironment: 'both (Beta & Production)',
          timestamp: new Date().toISOString(),
          status: 'failed',
          error: error.response?.data?.message || 'Failed to copy to any environment'
        });
      }
      throw error;
    }
  };

  const handleOpenCreateDialog = () => {
    setOpenCreateDialog(true);
  };

  const handleCloseCreateDialog = () => {
    setOpenCreateDialog(false);
  };

  const handleCreateKey = async (formData) => {
    if (currentEnvironment !== 'development') {
      throw new Error('Keys can only be created in the development environment');
    }

    try {
      // First create the key to get its ID
      const keyResponse = await fetch('http://localhost:5000/api/keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          environment: currentEnvironment,
        }),
      });

      if (!keyResponse.ok) {
        const error = await keyResponse.json();
        if (error.message?.includes('duplicate key error')) {
          throw new Error('A key with this name already exists');
        }
        throw new Error(error.message || 'Failed to create key');
      }

      const newKey = await keyResponse.json();

      // Then create or update use cases with the key information
      await Promise.all(
        formData.use_cases.map(async (useCaseName) => {
          try {
            // First try to get the existing use case
            const getResponse = await fetch(`http://localhost:5000/api/use-cases?name=${encodeURIComponent(useCaseName)}`);
            let useCaseId;
            
            if (getResponse.ok) {
              const existingUseCase = await getResponse.json();
              if (existingUseCase) {
                useCaseId = existingUseCase._id;
                // Update existing use case with new key
                await fetch(`http://localhost:5000/api/use-cases/${useCaseId}`, {
                  method: 'PUT',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    openai_keys: [
                      ...(existingUseCase.openai_keys || []),
                      {
                        key_name: newKey.key_name,
                        model_name: formData.available_models[0], // Using first model as default
                        key_priority: 1
                      }
                    ]
                  }),
                });
              }
            }
            
            if (!useCaseId) {
              // If not found, create new use case with key information
              const createResponse = await fetch('http://localhost:5000/api/use-cases', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  use_case_name: useCaseName,
                  openai_keys: [{
                    key_name: newKey.key_name,
                    model_name: formData.available_models[0], // Using first model as default
                    key_priority: 1
                  }]
                }),
              });

              if (!createResponse.ok) {
                throw new Error(`Failed to create use case: ${useCaseName}`);
              }
            }
          } catch (error) {
            console.error(`Error handling use case ${useCaseName}:`, error);
            throw error;
          }
        })
      );

      // Refresh both keys and use cases data
      await fetchData();
      setOpenCreateDialog(false);
      console.log('Created key:', newKey);
    } catch (error) {
      console.error('Error creating key:', error);
      throw error;
    }
  };

  const handleMenuClick = (event, keyId) => {
    setAnchorEl(event.currentTarget);
    setMenuKeyId(keyId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuKeyId(null);
  };

  const handleMenuAction = (action, key) => {
    handleMenuClose();
    switch (action) {
      case 'edit':
        handleOpenDialog(key);
        break;
      case 'updateExpiration':
        handleOpenExpirationDialog(key);
        break;
      case 'copy':
        handleOpenCopyDialog(key);
        break;
      case 'serviceAccount':
        handleOpenServiceAccountDialog(key);
        break;
      default:
        break;
    }
  };

  const handleOpenServiceAccountDialog = (key) => {
    setSelectedKey(key);
    setOpenServiceAccountDialog(true);
  };

  const handleCloseServiceAccountDialog = () => {
    setOpenServiceAccountDialog(false);
    setSelectedKey(null);
  };

  const handleUpdateApiKeyFromServiceAccount = async (keyName, newApiKey, remainingDays) => {
    try {
      // Validate environment before updating
      const isValid = await validateEnvironment();
      if (!isValid) {
        return;
      }

      // Get the current key data to preserve other fields
      const currentKey = keys.find(k => k.key_name === keyName);
      if (!currentKey) {
        throw new Error('Key not found');
      }

      // Calculate new expiration date based on remaining days
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + remainingDays);

      // Update the api_key field and expiration date
      const updatedKeyData = {
        ...currentKey,
        key_secrets_data: {
          ...currentKey.key_secrets_data,
          api_key: newApiKey
        },
        expires_at: expirationDate.toISOString()
      };

      await axios.put(`http://localhost:5000/api/keys/${keyName}`, updatedKeyData);
      
      addLog({
        type: 'serviceAccountUpdate',
        keyName: keyName,
        changes: ['API Key (via Service Account)', 'Expiration Date'],
        timestamp: new Date().toISOString()
      });

      fetchData();
    } catch (error) {
      console.error('Error updating API key from service account:', error);
      throw error;
    }
  };

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  if (!isBackendAvailable) {
    return (
      <Container maxWidth={false} sx={{ px: 0 }}>
        <Box sx={{ 
          height: '100vh', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 2
        }}>
          <Typography variant="h4" color="error">
            ⚠️ Backend not initialized!
          </Typography>
          <Button 
            variant="contained" 
            onClick={checkBackendHealth}
            sx={{ mt: 2 }}
          >
            Retry Connection
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ 
        borderRadius: 2,
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        bgcolor: getEnvironmentColor(currentEnvironment).bgcolor,
        borderBottom: '1px solid',
        borderColor: 'divider',
        py: 0.5,
        px: 2,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Typography 
          variant="caption" 
          sx={{ 
            color: getEnvironmentColor(currentEnvironment).textColor,
            fontWeight: 500
          }}
        >
          Environment: {environments.find(env => env.name === currentEnvironment)?.displayName || currentEnvironment}
        </Typography>
        {currentEnvironment === 'production' && (
          <Typography 
            variant="caption" 
            sx={{ 
              color: '#d32f2f',
              fontWeight: 600
            }}
          >
            ⚠️ PRODUCTION ENVIRONMENT
          </Typography>
        )}
      </Box>

      <Box sx={{ my: 4 }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 3 
        }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
            🔑 Key Updater
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            {currentEnvironment === 'development' && (
              <Button
                variant="contained"
                color="primary"
                onClick={handleOpenCreateDialog}
              >
                Create New Key
              </Button>
            )}
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Environment</InputLabel>
              <Select
                value={currentEnvironment}
                label="Environment"
                onChange={handleEnvironmentChange}
                disabled={isSwitchingEnvironment}
              >
                {environments.map((env) => (
                  <MenuItem key={env.name} value={env.name}>
                    {env.displayName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Box>

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={currentTab} onChange={handleTabChange} aria-label="navigation tabs">
            <Tab label="Key Management" />
            <Tab label="Use Cases" />
          </Tabs>
        </Box>

        {isSwitchingEnvironment && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <CircularProgress size={20} />
            <Typography variant="body2" color="text.secondary">
              Switching environment...
            </Typography>
          </Box>
        )}

        {currentEnvironment === 'production' && !isSwitchingEnvironment && (
          <Alert 
            severity="warning" 
            icon={<Warning />}
            sx={{ mb: 3 }}
          >
            You are currently in the PRODUCTION environment. Any changes made here will affect live data.
          </Alert>
        )}

        <Box sx={{ my: 4, px: 2, minHeight: 'calc(100vh - 8rem)', display: 'flex', flexDirection: 'column' }}>
          {currentTab === 0 && (
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h5" component="h3">
                  Data ({keys.length} keys)
                </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button 
                  variant="outlined" 
                  onClick={() => setShowLogs(!showLogs)}
                  endIcon={showLogs ? <ExpandLess /> : <ExpandMore />}
                >
                  View History
                </Button>
                {logs.length > 0 && (
                  <Button 
                    variant="outlined" 
                    color="error"
                    onClick={clearHistory}
                  >
                    Clear History
                  </Button>
                )}
              </Box>
            </Box>

            <Collapse in={showLogs}>
              <Paper sx={{ mb: 2, p: 2 }}>
                <Typography variant="h6" gutterBottom>Update History</Typography>
                {logs.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                    No history available for this environment
                  </Typography>
                ) : (
                  <List>
                    {logs.map((log, index) => (
                      <Box key={index}>
                        <ListItem>
                          <ListItemText
                            primary={
                              log.type === 'update' 
                                ? `Updated ${log.keyName}`
                                : log.type === 'serviceAccountUpdate'
                                ? `Updated ${log.keyName} via Service Account`
                                : log.type === 'copy'
                                ? `Copied ${log.keyName} to ${log.targetEnvironment}`
                                : `Set expiration for ${log.keyName} to ${log.days} days`
                            }
                            secondary={
                              log.type === 'update' || log.type === 'serviceAccountUpdate'
                                ? `Changed: ${log.changes.join(', ')}`
                                : log.type === 'copy'
                                ? `Copied to: ${log.targetEnvironment}`
                                : `Expiration updated`
                            }
                          />
                          <Typography variant="caption" color="text.secondary">
                            {new Date(log.timestamp).toLocaleString()}
                          </Typography>
                        </ListItem>
                        {index < logs.length - 1 && <Divider />}
                      </Box>
                    ))}
                  </List>
                )}
              </Paper>
            </Collapse>

            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Key Name</TableCell>
                    <TableCell>API Key</TableCell>
                    <TableCell>API Base URL</TableCell>
                    <TableCell>Available Models</TableCell>
                    <TableCell>Use Cases</TableCell>
                    <TableCell>Expires At</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {keys.sort((a, b) => a.key_name > b.key_name ? 1 : -1).map((key) => {
                    const relatedKeys = getKeysWithSameApiKey(key.key_secrets_data?.api_key, key.key_name);
                    return (
                      <TableRow 
                        key={key.key_name}
                        sx={{
                          backgroundColor: isExpiringSoon(key.expires_at) ? '#ffebee' : 'inherit',
                          '&:hover': {
                            backgroundColor: isExpiringSoon(key.expires_at) ? '#ffcdd2' : 'inherit'
                          }
                        }}
                      >
                        <TableCell>
                          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                            {key.key_name}
                            {relatedKeys.length > 0 && (
                              <Typography 
                                variant="body2" 
                                color="text.secondary"
                                sx={{ fontSize: '0.75rem' }}
                              >
                                ({relatedKeys.join(', ')})
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>{key.key_secrets_data?.api_key || 'N/A'}</TableCell>
                        <TableCell>{key.key_secrets_data?.api_base_url || 'N/A'}</TableCell>
                        <TableCell>
                          {key.available_models?.map(model => (
                            <Chip key={model} label={model} sx={{ mr: 1, mb: 1 }} />
                          )) || 'N/A'}
                        </TableCell>
                        <TableCell>
                          {getUseCasesForKey(key.key_name).map(useCase => (
                            <Chip 
                              key={useCase._id} 
                              label={useCase.use_case_name} 
                              sx={{ mr: 1, mb: 1 }} 
                            />
                          ))}
                        </TableCell>
                        <TableCell>
                          {key.expires_at ? new Date(key.expires_at).toLocaleDateString() : 'Never'}
                        </TableCell>
                        <TableCell>
                          <IconButton
                            onClick={(event) => handleMenuClick(event, key._id)}
                            size="small"
                          >
                            <MoreVert />
                          </IconButton>
                          <Menu
                            anchorEl={anchorEl}
                            open={Boolean(anchorEl && menuKeyId === key._id)}
                            onClose={handleMenuClose}
                            anchorOrigin={{
                              vertical: 'bottom',
                              horizontal: 'right',
                            }}
                            transformOrigin={{
                              vertical: 'top',
                              horizontal: 'right',
                            }}
                          >
                            <MenuItem onClick={() => handleMenuAction('edit', key)}>
                              {currentEnvironment === 'development' ? 'Edit' : 'View'}
                            </MenuItem>
                            <MenuItem 
                              onClick={() => handleMenuAction('updateExpiration', key)}
                              disabled={currentEnvironment !== 'development'}
                            >
                              Update Expiration
                            </MenuItem>
                            <MenuItem 
                              onClick={() => handleMenuAction('serviceAccount', key)}
                              disabled={currentEnvironment !== 'development'}
                            >
                              Check Service Account
                            </MenuItem>
                            <MenuItem 
                              onClick={() => handleMenuAction('copy', key)}
                              disabled={currentEnvironment !== 'development'}
                            >
                              Copy
                            </MenuItem>
                          </Menu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>

            <EditKeyDialog
              open={openDialog}
              onClose={handleCloseDialog}
              keyData={selectedKey}
              handleSubmit={handleSubmit}
              getKeysWithSameApiKey={getKeysWithSameApiKey}
              useCases={useCases}
              getUseCasesForKey={getUseCasesForKey}
              isDevelopment={currentEnvironment === 'development'}
            />

            <Dialog open={openExpirationDialog} onClose={handleCloseExpirationDialog}>
              <DialogTitle>Update Key Expiration</DialogTitle>
              <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2, minWidth: 300 }}>
                  <TextField
                    label="Days until expiration"
                    type="number"
                    value={expirationDays}
                    onChange={(e) => setExpirationDays(e.target.value)}
                    fullWidth
                    inputProps={{ min: 0 }}
                  />
                </Box>
              </DialogContent>
              <DialogActions>
                <Button onClick={handleCloseExpirationDialog}>Cancel</Button>
                <Button onClick={handleUpdateExpiration} variant="contained">Save</Button>
              </DialogActions>
            </Dialog>
            </Box>
          )}

          {currentTab === 1 && (
            <UseCasesScreen 
              currentEnvironment={currentEnvironment} 
              environments={environments}
              onCopyUseCase={handleCopyUseCase}
            />
          )}

          <Box sx={{ 
            mt: 4, 
            py: 1, 
            textAlign: 'center', 
            borderTop: '1px solid',
            borderColor: 'divider'
          }}>
            <Typography variant="caption" color="text.secondary">
              v1.0
            </Typography>
          </Box>
        </Box>
      </Box>

      <CopyKeyDialog
        open={openCopyDialog}
        onClose={handleCloseCopyDialog}
        keyData={selectedKey}
        environments={environments}
        onCopy={handleCopyKey}
      />

      <CreateKeyDialog
        open={openCreateDialog}
        onClose={handleCloseCreateDialog}
        onSubmit={handleCreateKey}
        useCases={useCases}
      />

      <ServiceAccountDialog
        open={openServiceAccountDialog}
        onClose={handleCloseServiceAccountDialog}
        keyData={selectedKey}
        onUpdateApiKey={handleUpdateApiKeyFromServiceAccount}
      />
    </Container>
  );
}

export default App;
