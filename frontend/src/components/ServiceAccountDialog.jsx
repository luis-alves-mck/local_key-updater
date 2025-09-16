import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Alert,
  CircularProgress,
  Box,
  Typography,
  Divider,
} from '@mui/material';

const ServiceAccountDialog = ({ open, onClose, keyData, onUpdateApiKey }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [serviceAccountData, setServiceAccountData] = useState(null);

  const extractInstanceId = (apiBaseUrl) => {
    try {
      // Extract the last segment after the final slash, ignoring /v1 suffix
      let url = apiBaseUrl.endsWith('/') ? apiBaseUrl.slice(0, -1) : apiBaseUrl;
      
      // Remove /v1 suffix if present
      if (url.endsWith('/v1')) {
        url = url.slice(0, -3);
      }
      
      const segments = url.split('/');
      return segments[segments.length - 1];
    } catch (err) {
      throw new Error('Invalid API Base URL format');
    }
  };

  const handleFetchCredentials = async () => {
    if (!keyData) return;

    try {
      setLoading(true);
      setError('');

      // Call the backend proxy endpoint
      const response = await fetch(`http://localhost:5000/api/keys/${keyData.key_name}/service-account`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}: ${response.statusText}` }));
        throw new Error(errorData.error || errorData.message || 'Failed to fetch service account credentials');
      }

      const data = await response.json();
      setServiceAccountData(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch service account credentials');
    } finally {
      setLoading(false);
    }
  };

  // Automatically fetch credentials when dialog opens
  useEffect(() => {
    if (open && keyData && !loading && !serviceAccountData) {
      handleFetchCredentials();
    }
  }, [open, keyData]);

  const handleUpdateApiKey = async () => {
    if (!serviceAccountData || !keyData) return;

    try {
      setLoading(true);
      setError('');

      const newApiKey = `${serviceAccountData.service_account_credentials.client_id}:${serviceAccountData.service_account_credentials.client_secret}`;
      await onUpdateApiKey(keyData.key_name, newApiKey, serviceAccountData.remaining_days);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update API key');
    } finally {
      setLoading(false);
    }
  };

  // Reset state when dialog closes
  React.useEffect(() => {
    if (!open) {
      setError('');
      setServiceAccountData(null);
      setLoading(false);
    }
  }, [open]);

  if (!keyData) return null;

  const instanceId = keyData?.key_secrets_data?.api_base_url ? 
    extractInstanceId(keyData.key_secrets_data.api_base_url) : 'N/A';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Service Account Status</DialogTitle>
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

        <TextField
          fullWidth
          label="API Base URL"
          value={keyData.key_secrets_data?.api_base_url || 'N/A'}
          disabled
          margin="normal"
        />

        <TextField
          fullWidth
          label="Current API Key"
          value={keyData.key_secrets_data?.api_key || 'N/A'}
          disabled
          margin="normal"
        />

        <TextField
          fullWidth
          label="Extracted Instance ID"
          value={instanceId}
          disabled
          margin="normal"
        />

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', my: 3 }}>
            <CircularProgress size={40} />
            <Typography variant="body1" sx={{ ml: 2 }}>
              Fetching service account credentials...
            </Typography>
          </Box>
        )}

        {error && !loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
            <Button
              onClick={handleFetchCredentials}
              variant="outlined"
              disabled={loading}
            >
              Retry
            </Button>
          </Box>
        )}

        {serviceAccountData && (
          <>
            <Divider sx={{ my: 3 }} />
            <Typography variant="h6" gutterBottom>
              Service Account Information
            </Typography>
            
            <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, mb: 2 }}>
              <Typography variant="body2" gutterBottom>
                <strong>Instance:</strong> {serviceAccountData.instance_name} ({serviceAccountData.instance_id})
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Project:</strong> {serviceAccountData.project_name}
              </Typography>
              <Typography 
                variant="body2" 
                gutterBottom
                sx={{ 
                  color: serviceAccountData.remaining_days <= 14 ? 'error.main' : 'text.primary',
                  fontWeight: serviceAccountData.remaining_days <= 14 ? 'bold' : 'normal'
                }}
              >
                <strong>Days Remaining:</strong> {serviceAccountData.remaining_days} days
                {serviceAccountData.remaining_days <= 14 && ' ⚠️'}
              </Typography>
              <Typography variant="body2">
                <strong>New API Key:</strong> {serviceAccountData.service_account_credentials.client_id}:{serviceAccountData.service_account_credentials.client_secret}
              </Typography>
            </Box>

            <Alert 
              severity={serviceAccountData.remaining_days <= 14 ? 'warning' : 'info'} 
              sx={{ mb: 2 }}
            >
              {serviceAccountData.remaining_days <= 14 
                ? `This service account will expire in ${serviceAccountData.remaining_days} days. Consider renewing soon.`
                : `This service account is valid for ${serviceAccountData.remaining_days} more days.`
              }
            </Alert>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        {serviceAccountData && (
          <Button
            onClick={handleUpdateApiKey}
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? 'Updating...' : 'Update API Key'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ServiceAccountDialog;