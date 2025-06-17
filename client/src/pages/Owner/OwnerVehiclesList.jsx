import { useEffect, useState, useContext } from 'react';
import {
  Box, Typography, CircularProgress, Accordion,
  AccordionSummary, AccordionDetails, TextField,
  Pagination, Select, MenuItem, FormControl, InputLabel, Grid, Button
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import api from '../../http';
import { Context } from '../../index';
import ChangeVehicleDataDialog from './ChangeVehicleDataDialog';
import RemoveVehicleDialog from './RemoveVehicleDialog';

function OwnerVehiclesList({ onSuccess }) {
  const { user } = useContext(Context);

  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);
  const [totalPages, setTotalPages] = useState(1);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/owner/reg-op', {
        params: { limit, page }
      });
      setVehicles(res.data.data);
      setTotalPages(res.data.pages);
    } catch (e) {
      console.error('Ошибка при загрузке ТС:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, limit]);

  const filtered = vehicles.filter((v) => {
    const vin = v.transportvehicle?.vin?.toLowerCase() || '';
    const reg = v.registrationdoc?.registrationNumber?.toLowerCase() || '';
    const q = search.toLowerCase();
    return vin.includes(q) || reg.includes(q);
  });

  return (
    <Box mt={4}>
      <Typography variant="h5" gutterBottom>Зарегистрированные транспортные средства</Typography>

      <TextField
        label="Поиск по VIN или номеру регистрации"
        fullWidth
        margin="normal"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {loading ? (
        <Box display="flex" justifyContent="center" mt={4}><CircularProgress /></Box>
      ) : filtered.length === 0 ? (
        <Typography color="text.secondary" mt={3}>Ничего не найдено.</Typography>
      ) : (
        <>
          <Box display="flex" flexDirection="column" gap={2}>
            {filtered.map((v, idx) => {
              const tv = v.transportvehicle;
              const doc = v.registrationdoc;
              if (!tv) return null;

              return (
                <Accordion key={idx} sx={{ borderRadius: 1, boxShadow: 2 }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" width="100%">
                      <Box>
                        <Typography fontWeight={600}>{tv.makeAndModel}</Typography>
                        <Typography variant="body2" color="text.secondary">{tv.vin}</Typography>
                      </Box>
                      <Box textAlign="right">
                        <Typography variant="body2"><strong>Гос. номер:</strong> {doc?.registrationNumber || '—'}</Typography>
                        <Typography variant="body2"><strong>ПТС:</strong> {doc?.pts || '—'}</Typography>
                        <Typography variant="body2"><strong>СТС:</strong> {doc?.sts || '—'}</Typography>
                      </Box>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6} md={4}><Typography><strong>Год выпуска:</strong> {tv.releaseYear}</Typography></Grid>
                      <Grid item xs={12} sm={6} md={4}><Typography><strong>Дата регистрации:</strong> {doc?.registrationDate?.slice(0, 10) || '—'}</Typography></Grid>
                      <Grid item xs={12} sm={6} md={4}><Typography><strong>Изготовитель:</strong> {tv.manufacture}</Typography></Grid>
                      <Grid item xs={12} sm={6} md={4}><Typography><strong>Тип привода:</strong> {tv.typeOfDrive}</Typography></Grid>
                      <Grid item xs={12} sm={6} md={4}><Typography><strong>Мощность:</strong> {tv.power}</Typography></Grid>
                      <Grid item xs={12} sm={6} md={4}><Typography><strong>Номер шасси:</strong> {tv.chassisNumber || '—'}</Typography></Grid>
                      <Grid item xs={12} sm={6} md={4}><Typography><strong>Номер кузова:</strong> {tv.bodyNumber}</Typography></Grid>
                      <Grid item xs={12} sm={6} md={4}><Typography><strong>Цвет кузова:</strong> {tv.bodyColor}</Typography></Grid>
                      <Grid item xs={12} sm={6} md={4}><Typography><strong>Тип коробки передач:</strong> {tv.transmissionType}</Typography></Grid>
                      <Grid item xs={12} sm={6} md={4}><Typography><strong>Положение руля:</strong> {tv.steeringWheel}</Typography></Grid>
                      <Grid item xs={12} sm={6} md={4}><Typography><strong>Модель двигателя:</strong> {tv.engineModel}</Typography></Grid>
                      <Grid item xs={12} sm={6} md={4}><Typography><strong>Рабочий объем, см³:</strong> {tv.engineVolume}</Typography></Grid>
                    </Grid>
                    <Button
                        variant="outlined"
                        sx={{ mt: 2 }}
                        onClick={() => {
                            setSelectedVehicle(v); 
                            setDialogOpen(true);
                        }}
                        >
                        Внести изменения в регистрационные данные
                    </Button>
                    <Button
                        variant="outlined"
                        color="error"
                        sx={{ mt: 2, ml: 2 }}
                        onClick={() => {
                            setRemoveTarget(v);
                            setRemoveDialogOpen(true);
                        }}
                        >
                        Снять ТС с учета
                    </Button>
                  </AccordionDetails>
                </Accordion>
              );
            })}
          </Box>

          <Box display="flex" justifyContent="space-between" alignItems="center" mt={4}>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel id="limit-label">Показывать по</InputLabel>
              <Select
                labelId="limit-label"
                value={limit}
                label="Показывать по"
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
              >
                {[5, 10, 20, 50].map((num) => (
                  <MenuItem key={num} value={num}>{num}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <Pagination
              count={totalPages}
              page={page}
              onChange={(_, value) => setPage(value)}
              color="primary"
            />
          </Box>
          <ChangeVehicleDataDialog
            open={dialogOpen}
            onClose={() => setDialogOpen(false)}
            vehicle={selectedVehicle}
            currentOwner={user.user?.passportData || user.user?.taxNumber || 'Неизвестно'}
            onSuccess={(message) => {
                fetchData();
                if (onSuccess) onSuccess(message);
            }}
          />
          <RemoveVehicleDialog
            open={removeDialogOpen}
            onClose={() => setRemoveDialogOpen(false)}
            vehicle={removeTarget}
            onSuccess={(message) => {
                fetchData(); 
                setRemoveDialogOpen(false); 
                if (onSuccess) onSuccess(message);
            }}
          />
        </>
      )}
    </Box>
  );
}

export default OwnerVehiclesList;
