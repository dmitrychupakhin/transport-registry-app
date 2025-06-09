import {
  Dialog, DialogTitle, DialogContent, DialogContentText,
  DialogActions, Button
} from '@mui/material';

function ConfirmDeleteDialog({ open, onClose, onConfirm, title = 'Удаление', content = 'Вы уверены, что хотите удалить?' }) {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{content}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Отмена</Button>
        <Button onClick={onConfirm} color="error" variant="contained">
          Удалить
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default ConfirmDeleteDialog;
