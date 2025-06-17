import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Typography, CircularProgress,
  InputLabel, MenuItem, Select, FormControl, Autocomplete,
  Box
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import debounce from 'lodash.debounce';
import api from '../../http';

const driveOptions = ['FWD', 'RWD', 'AWD', '4WD'];
const transmissionOptions = ['MT', 'AT', 'AMT', 'CVT', 'DCT', 'DSG'];

function ChangeVehicleDataDialog({ open, onClose, vehicle, currentOwner, onSuccess }) {
  const [formData, setFormData] = useState({});
  const [unitCode, setUnitCode] = useState('');
  const [unitOptions, setUnitOptions] = useState([]);
  const [loadingUnit, setLoadingUnit] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (vehicle) {
      setFormData({
        typeOfDrive: vehicle.transportvehicle?.typeOfDrive || '',
        power: vehicle.transportvehicle?.power || '',
        bodyColor: vehicle.transportvehicle?.bodyColor || '',
        transmissionType: vehicle.transportvehicle?.transmissionType || '',
        engineModel: vehicle.transportvehicle?.engineModel || '',
        engineVolume: vehicle.transportvehicle?.engineVolume || '',
        futureOwner: '',
      });
      setUnitCode('');
      setErrors({});
    }
  }, [vehicle]);

  const fetchUnits = useMemo(() =>
    debounce(async (search) => {
      setLoadingUnit(true);
      try {
        const res = await api.get('/admin/reg-depart', {
          params: { search, limit: 10 }
        });
        const mapped = res.data.data.map(d => ({
          label: `${d.unitCode} — ${d.departmentName}`,
          value: d.unitCode
        }));
        setUnitOptions(mapped);
      } catch (e) {
        console.error('Ошибка загрузки подразделений:', e);
      } finally {
        setLoadingUnit(false);
      }
    }, 300), []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(p => ({ ...p, [name]: value }));
  };

  const validate = () => {
    const newErrors = {};
    if (!driveOptions.includes(formData.typeOfDrive)) newErrors.typeOfDrive = 'Обязательное поле';
    if (!formData.power.match(/^\d+\s*кВт\/\d+\s*л\.с\.$/)) newErrors.power = 'Формат: 123 кВт/167 л.с.';
    if (!formData.bodyColor) newErrors.bodyColor = 'Обязательное поле';
    if (!transmissionOptions.includes(formData.transmissionType)) newErrors.transmissionType = 'Обязательное поле';
    if (!formData.engineModel) newErrors.engineModel = 'Обязательное поле';
    if (!formData.engineVolume || isNaN(formData.engineVolume) || formData.engineVolume < 500 || formData.engineVolume > 7400)
      newErrors.engineVolume = 'Число от 500 до 7400';
    if (formData.futureOwner && !/^(\d{10}|\d{4}\s?\d{6})$/.test(formData.futureOwner)) {
      newErrors.futureOwner = 'Введите ИНН (10 цифр) или паспорт (XXXX XXXXXX)';}
    if (!unitCode.match(/^\d{6}$/)) newErrors.unitCode = 'Введите 6 цифр';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const generateOperationBase = () => {
    const changes = [];
    const orig = vehicle.transportvehicle || {};

    for (const key in formData) {
        if (
        key !== 'futureOwner' &&
        formData[key] !== '' &&
        String(formData[key]) !== String(orig[key])
        ) {
        changes.push(`${key}: "${orig[key]}" → "${formData[key]}"`);
        }
    }

    if (formData.futureOwner) {
        changes.push(`изменение данных владельца: текущий — ${currentOwner}, будущий — ${formData.futureOwner}`);
    }

    return changes.length
        ? 'Изменения: ' + changes.join(', ')
        : 'Нет изменений';
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const operationBase = generateOperationBase();
      const techChanged = operationBase.includes('→');
      const ownerChanged = !!formData.futureOwner;

      if (!techChanged && !ownerChanged) {
        onSuccess?.('Данные не изменились. Заявление не было сформировано.');
        setLoading(false);
        return;
      }

      await api.post('/owner/reg-op', {
        vin: vehicle.transportvehicle?.vin,
        unitCode,
        operationType: 'Внесение измененеий в регистрационные данные',
        operationBase,
        operationDate: new Date().toISOString().split('T')[0]
      });

      if (ownerChanged && vehicle.operationId) {
        await api.patch(`/employee/reg-op/${vehicle.operationId}`, {
          registrationNumber: null
        });
      }

      const successMessage = ownerChanged
        ? 'Заявление успешно отправлено. Новому владельцу необходимо обратиться в указанный Вами регистрационный отдел.'
        : 'Изменения успешно зарегистрированы. Обратитесь в указанный Вами регистрационный отдел.';

      onSuccess?.(successMessage);
      onClose();
    } catch (e) {
      console.error('Ошибка подачи заявления:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Внесение изменений в регистрационные данные</DialogTitle>
      <DialogContent dividers>
        <Box display="flex" flexWrap="wrap" gap={2} mt={1} sx={{ '& > *': { flex: '1 1 calc(50% - 16px)' } }}>
          <FormControl fullWidth error={!!errors.typeOfDrive}>
            <InputLabel>Тип привода</InputLabel>
            <Select
              name="typeOfDrive"
              value={formData.typeOfDrive}
              onChange={handleChange}
              label="Тип привода"
            >
              {driveOptions.map((option) => (
                <MenuItem key={option} value={option}>{option}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            name="power"
            label="Мощность кВт/л.с."
            value={formData.power}
            onChange={handleChange}
            error={!!errors.power}
            helperText={errors.power}
          />

          <TextField
            fullWidth
            name="bodyColor"
            label="Цвет кузова"
            value={formData.bodyColor}
            onChange={handleChange}
            error={!!errors.bodyColor}
            helperText={errors.bodyColor}
          />

          <FormControl fullWidth error={!!errors.transmissionType}>
            <InputLabel>Коробка передач</InputLabel>
            <Select
              name="transmissionType"
              value={formData.transmissionType}
              onChange={handleChange}
              label="Тип коробки передач"
            >
              {transmissionOptions.map((option) => (
                <MenuItem key={option} value={option}>{option}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            name="engineModel"
            label="Модель двигателя"
            value={formData.engineModel}
            onChange={handleChange}
            error={!!errors.engineModel}
            helperText={errors.engineModel}
          />

          <TextField
            fullWidth
            name="engineVolume"
            label="Объем двигателя, см³"
            value={formData.engineVolume}
            onChange={handleChange}
            error={!!errors.engineVolume}
            helperText={errors.engineVolume}
          />

          <TextField
            fullWidth
            name="futureOwner"
            label="Новый владелец (Паспорт / ИНН)"
            value={formData.futureOwner}
            onChange={handleChange}
            error={!!errors.futureOwner}
            helperText={errors.futureOwner}
          />

          <Autocomplete
            freeSolo
            fullWidth
            loading={loadingUnit}
            options={unitOptions}
            getOptionLabel={(option) =>
                typeof option === 'string' ? option : option.label
            }
            inputValue={unitCode}
            onInputChange={(_, value, reason) => {
                if (reason === 'input') {
                setUnitCode(value);
                if (value.length >= 2) fetchUnits(value);
                }
            }}
            onChange={(_, option) => {
                if (!option) {
                setUnitCode('');
                } else if (typeof option === 'string') {
                setUnitCode(option);
                } else {
                setUnitCode(option.value); 
                }
            }}
            isOptionEqualToValue={(option, value) =>
                typeof value === 'string'
                ? option.value === value
                : option.value === value.value
            }
            renderInput={(params) => (
                <TextField
                {...params}
                label="Код подразделения"
                error={!!errors.unitCode}
                helperText={errors.unitCode}
                />
            )}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Отмена</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={loading}>
          {loading ? <CircularProgress size={24} /> : 'Отправить заявление'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default ChangeVehicleDataDialog;
