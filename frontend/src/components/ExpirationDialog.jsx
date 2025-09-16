import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box
} from '@mui/material';

const ExpirationDialog = ({
  open,
  onClose,
  expirationForm,
  handleInputChange,
  handleSubmit
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Update Expiration Date</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
          <TextField
            label="Days Until Expiration"
            name="days"
            type="number"
            value={expirationForm.days}
            onChange={handleInputChange}
            fullWidth
            inputProps={{ min: 1 }}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained">Update</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ExpirationDialog; 