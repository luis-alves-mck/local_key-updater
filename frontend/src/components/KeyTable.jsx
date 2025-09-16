import { useState } from 'react';
import { 
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Box,
  Chip,
  Menu,
  MenuItem,
  IconButton
} from '@mui/material';
import { MoreVert } from '@mui/icons-material';

const KeyTable = ({ 
  keys, 
  useCases, 
  handleOpenDialog, 
  handleOpenExpirationDialog,
  handleOpenCopyDialog,
  handleOpenServiceAccountDialog,
  isExpiringSoon,
  getUseCasesForKey,
  currentEnvironment 
}) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuKeyId, setMenuKeyId] = useState(null);

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
  return (
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
          {keys.map((key) => (
            <TableRow 
              key={key.key_name}
              sx={{
                backgroundColor: isExpiringSoon(key.expires_at) ? '#ffebee' : 'inherit',
                '&:hover': {
                  backgroundColor: isExpiringSoon(key.expires_at) ? '#ffcdd2' : 'inherit'
                }
              }}
            >
              <TableCell>{key.key_name}</TableCell>
              <TableCell>{key.key_secrets_data.api_key}</TableCell>
              <TableCell>{key.key_secrets_data.api_base_url}</TableCell>
              <TableCell>
                {key.available_models.map(model => (
                  <Chip key={model} label={model} sx={{ mr: 1, mb: 1 }} />
                ))}
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
                    onClick={() => handleMenuAction('copy', key)}
                    disabled={currentEnvironment !== 'development'}
                  >
                    Copy
                  </MenuItem>
                  <MenuItem 
                    onClick={() => handleMenuAction('serviceAccount', key)}
                    disabled={currentEnvironment !== 'development'}
                  >
                    Check Service Account
                  </MenuItem>
                </Menu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default KeyTable; 