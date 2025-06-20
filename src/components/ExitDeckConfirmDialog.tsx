import { Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Button } from '@mui/material';
import React from 'react';

interface ExitDeckConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: React.ReactNode;
  confirmLabel?: string;
}

const ExitDeckConfirmDialog: React.FC<ExitDeckConfirmDialogProps> = ({
  open,
  onClose,
  onConfirm,
  title = 'Exit Deck?',
  description = (
    <>
      Are you sure you want to exit the deck? <br />
      <strong>Your progress is saved on this device.</strong> You can pick up where you left off if you resume this deck on the same device.
    </>
  ),
  confirmLabel = 'Exit Deck',
}) => (
  <Dialog
    open={open}
    onClose={onClose}
    aria-labelledby="exit-deck-dialog-title"
    aria-describedby="exit-deck-dialog-description"
  >
    <DialogTitle id="exit-deck-dialog-title">{title}</DialogTitle>
    <DialogContent>
      <DialogContentText id="exit-deck-dialog-description">
        {description}
      </DialogContentText>
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose} data-testid="cancel-exit-deck-button">
        Cancel
      </Button>
      <Button onClick={onConfirm} color="error" autoFocus data-testid="confirm-exit-deck-button">
        {confirmLabel}
      </Button>
    </DialogActions>
  </Dialog>
);

export default ExitDeckConfirmDialog; 