import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button, Typography, CircularProgress } from '@mui/material';

interface TermBankDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  deckName: string;
  isSaving: boolean;
  progress: number;
  error: string | null;
}

export const TermBankDialog = ({
  open,
  onClose,
  onConfirm,
  deckName,
  isSaving,
  progress,
  error
}: TermBankDialogProps) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="save-all-dialog-title"
      aria-describedby="save-all-dialog-description"
    >
      <DialogTitle id="save-all-dialog-title">
        Save All Terms to Word Bank?
      </DialogTitle>
      <DialogContent>
        <DialogContentText id="save-all-dialog-description">
          This will save all terms from "{deckName}" to your personal word bank.
          {isSaving && (
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <CircularProgress size={24} variant="determinate" value={progress} />
              <Typography variant="body2" color="textSecondary" style={{ marginTop: 8 }}>
                {progress === 100 ? 'Complete!' : 'Saving terms...'}
              </Typography>
            </div>
          )}
          {error && (
            <Typography color="error" sx={{ mt: 2 }}>
              Error: {error}
            </Typography>
          )}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isSaving}>
          Cancel
        </Button>
        <Button 
          onClick={onConfirm} 
          color="primary" 
          autoFocus
          disabled={isSaving || Boolean(error)}
        >
          Save All Terms
        </Button>
      </DialogActions>
    </Dialog>
  );
}; 