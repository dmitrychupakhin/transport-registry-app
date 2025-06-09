import { useEffect, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Box
} from '@mui/material';

const initialForm = {
  unitCode: '',
  departmentName: '',
  address: ''
};

function DepartmentFormDialog({ open, onClose, onSubmit, editingData }) {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (editingData) {
      setForm(editingData);
    } else {
      setForm(initialForm);
    }
    setErrors({});
  }, [editingData, open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    const newErrors = {};
    if (!form.unitCode || form.unitCode.length !== 6) {
      newErrors.unitCode = 'Код должен содержать 6 символов';
    }
    if (!form.departmentName || form.departmentName.length < 8) {
      newErrors.departmentName = 'Название минимум 8 символов';
    }
    if (!form.address || form.address.length < 8) {
      newErrors.address = 'Адрес минимум 8 символов';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      const dataToSend = editingData
        ? { departmentName: form.departmentName, address: form.address }
        : form;

      onSubmit(dataToSend, form.unitCode);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth>
      <DialogTitle>{editingData ? 'Редактировать отдел' : 'Создать отдел'}</DialogTitle>
      <DialogContent>
        <Box mt={1} display="flex" flexDirection="column" gap={2}>
          <TextField
            label="Код подразделения"
            name="unitCode"
            value={form.unitCode}
            onChange={handleChange}
            error={!!errors.unitCode}
            helperText={errors.unitCode}
            disabled={!!editingData}
          />
          <TextField
            label="Название отдела"
            name="departmentName"
            value={form.departmentName}
            onChange={handleChange}
            error={!!errors.departmentName}
            helperText={errors.departmentName}
          />
          <TextField
            label="Адрес"
            name="address"
            value={form.address}
            onChange={handleChange}
            error={!!errors.address}
            helperText={errors.address}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Отмена</Button>
        <Button onClick={handleSubmit} variant="contained">
          {editingData ? 'Сохранить' : 'Создать'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default DepartmentFormDialog;
