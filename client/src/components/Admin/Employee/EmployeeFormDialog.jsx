import { useEffect, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Box
} from '@mui/material';

const initialForm = {
  badgeNumber: '',
  unitCode: '',
  lastName: '',
  firstName: '',
  patronymic: '',
  rank: ''
};

function EmployeeFormDialog({ open, onClose, onSubmit, editingData }) {
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
    if (!form.badgeNumber.match(/^\d{2}-\d{4}$/)) {
      newErrors.badgeNumber = 'Формат: 00-0000';
    }
    if (!form.unitCode || form.unitCode.length !== 6) {
      newErrors.unitCode = '6 символов';
    }
    ['lastName', 'firstName', 'patronymic', 'rank'].forEach(field => {
      if (!form[field] || form[field].length < 2) {
        newErrors[field] = 'Мин. 2 символа';
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      const data = {
        unitCode: form.unitCode,
        lastName: form.lastName,
        firstName: form.firstName,
        patronymic: form.patronymic,
        rank: form.rank
      };

      if (!editingData) {
        data.badgeNumber = form.badgeNumber;
      }

      const id = form.badgeNumber;
      onSubmit(data, id);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth>
      <DialogTitle>{editingData ? 'Редактировать сотрудника' : 'Создать сотрудника'}</DialogTitle>
      <DialogContent>
        <Box mt={1} display="flex" flexDirection="column" gap={2}>
          <TextField
            label="Номер значка"
            name="badgeNumber"
            value={form.badgeNumber}
            onChange={handleChange}
            error={!!errors.badgeNumber}
            helperText={errors.badgeNumber}
            disabled={!!editingData}
          />
          <TextField label="Код подразделения" name="unitCode" value={form.unitCode} onChange={handleChange} error={!!errors.unitCode} helperText={errors.unitCode} />
          <TextField label="Фамилия" name="lastName" value={form.lastName} onChange={handleChange} error={!!errors.lastName} helperText={errors.lastName} />
          <TextField label="Имя" name="firstName" value={form.firstName} onChange={handleChange} error={!!errors.firstName} helperText={errors.firstName} />
          <TextField label="Отчество" name="patronymic" value={form.patronymic} onChange={handleChange} error={!!errors.patronymic} helperText={errors.patronymic} />
          <TextField label="Звание" name="rank" value={form.rank} onChange={handleChange} error={!!errors.rank} helperText={errors.rank} />
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

export default EmployeeFormDialog;
