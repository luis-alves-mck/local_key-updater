import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Collapse,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Divider,
  Alert,
  Button
} from '@mui/material';
import { ExpandLess, ExpandMore, Download, Edit, FileCopy } from '@mui/icons-material';
import axios from 'axios';
import EditUseCaseDialog from './EditUseCaseDialog';
import CopyUseCaseDialog from './CopyUseCaseDialog';

function UseCasesScreen({ currentEnvironment, environments, onCopyUseCase }) {
  const [useCases, setUseCases] = useState([]);
  const [keys, setKeys] = useState([]);
  const [expandedRows, setExpandedRows] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedUseCase, setSelectedUseCase] = useState(null);
  const [copyDialogOpen, setCopyDialogOpen] = useState(false);
  const [selectedUseCaseForCopy, setSelectedUseCaseForCopy] = useState(null);

  useEffect(() => {
    fetchData();
  }, [currentEnvironment]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [useCasesResponse, keysResponse] = await Promise.all([
        axios.get('http://localhost:5000/api/use-cases'),
        axios.get('http://localhost:5000/api/keys')
      ]);
      
      setUseCases(useCasesResponse.data);
      setKeys(keysResponse.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load use cases and keys data');
    } finally {
      setLoading(false);
    }
  };

  const handleRowClick = (useCaseId) => {
    setExpandedRows(prev => ({
      ...prev,
      [useCaseId]: !prev[useCaseId]
    }));
  };

  const handleEditClick = (e, useCase) => {
    e.stopPropagation();
    setSelectedUseCase(useCase);
    setEditDialogOpen(true);
  };

  const handleEditClose = () => {
    setEditDialogOpen(false);
    setSelectedUseCase(null);
  };

  const handleUseCaseUpdate = (updatedUseCase) => {
    setUseCases(prev => prev.map(uc => 
      uc._id === updatedUseCase._id ? updatedUseCase : uc
    ));
  };

  const handleCopyClick = (e, useCase) => {
    e.stopPropagation();
    setSelectedUseCaseForCopy(useCase);
    setCopyDialogOpen(true);
  };

  const handleCopyClose = () => {
    setCopyDialogOpen(false);
    setSelectedUseCaseForCopy(null);
  };

  const handleCopyUseCase = async (useCaseName, targetEnvironment) => {
    if (onCopyUseCase) {
      await onCopyUseCase(useCaseName, targetEnvironment);
    }
  };

  const getKeyDetails = (keyName) => {
    return keys.find(key => key.key_name === keyName);
  };

  const getKeysByUseCase = (useCase) => {
    return useCase.openai_keys || [];
  };

  const getEnvironmentColor = (envName) => {
    switch (envName) {
      case 'development':
        return { bgcolor: '#e3f2fd', textColor: '#1976d2' };
      case 'staging':
        return { bgcolor: '#fff3e0', textColor: '#f57c00' };
      case 'production':
        return { bgcolor: '#fbe9e7', textColor: '#d32f2f' };
      default:
        return { bgcolor: '#f5f5f5', textColor: '#757575' };
    }
  };

  const extractInstanceId = (apiBaseUrl) => {
    if (!apiBaseUrl) return '';
    
    // Common patterns for instance IDs in API URLs
    // Pattern 1: /instances/{guid}/ or /instances/{guid}
    const instanceMatch = apiBaseUrl.match(/\/instances\/([a-f0-9-]{36})/i);
    if (instanceMatch) return instanceMatch[1];
    
    // Pattern 2: /{guid}/ or /{guid} in path
    const guidMatch = apiBaseUrl.match(/\/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i);
    if (guidMatch) return guidMatch[1];
    
    // Pattern 3: subdomain with guid (e.g., {guid}.openai.azure.com)
    const subdomainMatch = apiBaseUrl.match(/^https?:\/\/([a-f0-9-]{36})\./i);
    if (subdomainMatch) return subdomainMatch[1];
    
    // Pattern 4: query parameter instanceId
    const queryMatch = apiBaseUrl.match(/[?&]instanceId=([a-f0-9-]{36})/i);
    if (queryMatch) return queryMatch[1];
    
    return '';
  };

  const downloadCSV = () => {
    const csvData = [];
    
    // Add header row
    csvData.push([
      'Use Case Name',
      'Key Name',
      'Key Priority',
      'Model Name',
      'API Type',
      'API Base URL',
      'Instance ID',
      'Available Models',
      'Expires At',
      'Embeddings Support',
      'Environment'
    ]);

    // Add data rows
    useCases.forEach(useCase => {
      const associatedKeys = getKeysByUseCase(useCase);
      
      if (associatedKeys.length === 0) {
        // Add row for use case with no keys
        csvData.push([
          useCase.use_case_name,
          'No keys associated',
          '',
          '',
          '',
          '',
          '',
          '',
          '',
          '',
          currentEnvironment
        ]);
      } else {
        associatedKeys.forEach(keyAssociation => {
          const keyDetails = getKeyDetails(keyAssociation.key_name);
          const apiBaseUrl = keyDetails?.key_secrets_data?.api_base_url || '';
          
          csvData.push([
            useCase.use_case_name,
            keyAssociation.key_name,
            keyAssociation.key_priority,
            keyAssociation.model_name,
            keyDetails?.key_secrets_data?.api_type || '',
            apiBaseUrl,
            extractInstanceId(apiBaseUrl),
            keyDetails?.available_models?.join('; ') || '',
            keyDetails?.expires_at ? new Date(keyDetails.expires_at).toLocaleDateString() : 'Never',
            keyDetails?.is_work_with_embeddings ? 'Yes' : 'No',
            currentEnvironment
          ]);
        });
      }
    });

    // Convert to CSV string
    const csvContent = csvData.map(row => 
      row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ).join('\n');

    // Create and download file
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `use-cases-${currentEnvironment}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <Typography>Loading use cases...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
          📋 Use Cases & Associated Keys
        </Typography>
        <Button
          variant="outlined"
          startIcon={<Download />}
          onClick={downloadCSV}
          sx={{ minWidth: 140 }}
        >
          Download CSV
        </Button>
      </Box>

      <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
        Use Cases ({useCases.length})
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Use Case Name</TableCell>
              <TableCell>Associated Keys</TableCell>
              <TableCell>Total Keys</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {useCases.map((useCase) => {
              const associatedKeys = getKeysByUseCase(useCase);
              const isExpanded = expandedRows[useCase._id];
              
              return (
                <>
                  <TableRow 
                    key={useCase._id}
                    sx={{ 
                      '&:hover': { backgroundColor: '#f5f5f5' },
                      cursor: 'pointer'
                    }}
                    onClick={() => handleRowClick(useCase._id)}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {useCase.use_case_name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {associatedKeys.slice(0, 3).map((keyAssociation) => (
                          <Chip 
                            key={keyAssociation.key_name}
                            label={keyAssociation.key_name}
                            size="small"
                            sx={{ 
                              bgcolor: '#e3f2fd',
                              color: '#1976d2'
                            }}
                          />
                        ))}
                        {associatedKeys.length > 3 && (
                          <Chip 
                            label={`+${associatedKeys.length - 3} more`}
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {associatedKeys.length}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <IconButton
                          onClick={(e) => handleEditClick(e, useCase)}
                          size="small"
                          color="primary"
                          title="Edit use case"
                        >
                          <Edit />
                        </IconButton>
                        {currentEnvironment === 'development' && (
                          <IconButton
                            onClick={(e) => handleCopyClick(e, useCase)}
                            size="small"
                            color="secondary"
                            title="Copy to other environments"
                          >
                            <FileCopy />
                          </IconButton>
                        )}
                        <IconButton
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRowClick(useCase._id);
                          }}
                          size="small"
                          title={isExpanded ? "Collapse" : "Expand"}
                        >
                          {isExpanded ? <ExpandLess /> : <ExpandMore />}
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell 
                      colSpan={4} 
                      sx={{ 
                        paddingTop: 0, 
                        paddingBottom: 0,
                        borderBottom: isExpanded ? '1px solid rgba(224, 224, 224, 1)' : 'none'
                      }}
                    >
                      <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                        <Box sx={{ py: 2 }}>
                          <Typography variant="h6" gutterBottom>
                            Keys associated with "{useCase.use_case_name}"
                          </Typography>
                          {associatedKeys.length === 0 ? (
                            <Typography variant="body2" color="text.secondary">
                              No keys associated with this use case
                            </Typography>
                          ) : (
                            <List>
                              {associatedKeys.map((keyAssociation, index) => {
                                const keyDetails = getKeyDetails(keyAssociation.key_name);
                                return (
                                  <Box key={keyAssociation.key_name}>
                                    <ListItem sx={{ px: 0 }}>
                                      <ListItemText
                                        primary={
                                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                            <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                              {keyAssociation.key_name}
                                            </Typography>
                                            <Chip 
                                              label={`Priority: ${keyAssociation.key_priority}`}
                                              size="small"
                                              color="primary"
                                              variant="outlined"
                                            />
                                            <Chip 
                                              label={keyAssociation.model_name}
                                              size="small"
                                              color="secondary"
                                              variant="outlined"
                                            />
                                          </Box>
                                        }
                                        secondary={
                                          keyDetails && (
                                            <Box sx={{ mt: 1 }}>
                                              <Typography variant="body2" color="text.secondary">
                                                API Type: {keyDetails.key_secrets_data?.api_type || 'N/A'}
                                              </Typography>
                                              <Typography variant="body2" color="text.secondary">
                                                API Base URL: {keyDetails.key_secrets_data?.api_base_url || 'N/A'}
                                              </Typography>
                                              <Typography variant="body2" color="text.secondary">
                                                Available Models: {keyDetails.available_models?.join(', ') || 'N/A'}
                                              </Typography>
                                              <Typography variant="body2" color="text.secondary">
                                                Expires: {keyDetails.expires_at ? new Date(keyDetails.expires_at).toLocaleDateString() : 'Never'}
                                              </Typography>
                                            </Box>
                                          )
                                        }
                                      />
                                    </ListItem>
                                    {index < associatedKeys.length - 1 && <Divider />}
                                  </Box>
                                );
                              })}
                            </List>
                          )}
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {useCases.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h6" color="text.secondary">
            No use cases found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Create some keys with associated use cases to see them here.
          </Typography>
        </Box>
      )}

      <EditUseCaseDialog
        open={editDialogOpen}
        onClose={handleEditClose}
        useCase={selectedUseCase}
        keys={keys}
        onUpdate={handleUseCaseUpdate}
      />
      
      <CopyUseCaseDialog
        open={copyDialogOpen}
        onClose={handleCopyClose}
        useCaseData={selectedUseCaseForCopy}
        environments={environments || []}
        onCopy={handleCopyUseCase}
      />
    </Box>
  );
}

export default UseCasesScreen;