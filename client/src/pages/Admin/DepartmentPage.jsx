import { useEffect, useState } from 'react';
import {
  Container, Typography, Button, Box, Snackbar, TextField, Pagination,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, 
  IconButton, FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import { Add, Delete, Edit } from '@mui/icons-material';
import DepartmentFormDialog from '../../components/Admin/RegistrationDepart/DepartmentFormDialog';
import ConfirmDeleteDialog from '../../components/Common/ConfirmDeleteDialog';
import {
  fetchDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  patchDepartment
} from '../../components/Admin/RegistrationDepart/DepartmentService';

function DepartmentPage() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openForm, setOpenForm] = useState(false);
  const [editData, setEditData] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [editingCell, setEditingCell] = useState(null);

  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [sortOrder, setSortOrder] = useState('asc');

  const loadDepartments = async () => {
    setLoading(true);
    try {
      const params = { page, limit, sortOrder };
      if (filter.trim()) {
        params.search = filter.trim(); 
      }

      const res = await fetchDepartments(params);
      setDepartments(res.data.data);
      setTotalPages(res.data.pages || 1);
    } catch (e) {
      console.error(e);
      showSnackbar('Ошибка загрузки данных', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDepartments();
  }, [page, filter, sortOrder, limit]);

  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCreate = () => {
    setEditData(null);
    setOpenForm(true);
  };

  const handleEdit = (dep) => {
    setEditData(dep);
    setOpenForm(true);
  };

  const handleDelete = async () => {
    try {
      await deleteDepartment(deleteTarget.unitCode);
      showSnackbar('Удалено успешно', 'success');
      loadDepartments();
    } catch (e) {
      console.error(e);
      showSnackbar(e.response?.data?.message || 'Ошибка удаления', 'error');
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleSubmit = async (formData, unitCode) => {
    try {
      if (editData) {
        await updateDepartment(unitCode, formData);
        showSnackbar('Данные обновлены', 'success');
      } else {
        await createDepartment(formData);
        showSnackbar('Отдел создан', 'success');
      }
      setOpenForm(false);
      loadDepartments();
    } catch (e) {
      console.error(e);
      showSnackbar(e.response?.data?.message || 'Ошибка сохранения', 'error');
    }
  };

  const handlePatch = async (unitCode, field, value) => {
    try {
      const data = { [field]: value };
      await patchDepartment(unitCode, data);
      loadDepartments();
    } catch (e) {
      console.error('PATCH ERROR:', e);
      showSnackbar('Ошибка обновления поля', 'error');
    }
  };


  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">Регистрационные отделы</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={handleCreate}>
          Добавить отдел
        </Button>
      </Box>

      <TextField
        fullWidth
        label="Поиск"
        value={filter}
        onChange={(e) => {
          setPage(1);
          setFilter(e.target.value);
        }}
        sx={{ mb: 2 }}
      />

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Код подразделения</TableCell>
              <TableCell
                sx={{ cursor: 'pointer' }}
                onClick={() => {
                  setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
                }}
              >
                Название отдела {sortOrder === 'asc' ? '↑' : '↓'}
              </TableCell>
              <TableCell>Адрес</TableCell>
              <TableCell align="right">Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {departments.map((dep) => (
              <TableRow key={dep.unitCode}>
                <TableCell>{dep.unitCode}</TableCell>

                <TableCell
                  onDoubleClick={() => setEditingCell({ unitCode: dep.unitCode, field: 'departmentName', value: dep.departmentName })}
                >
                  {editingCell?.unitCode === dep.unitCode && editingCell?.field === 'departmentName' ? (
                    <TextField
                      size="small"
                      value={editingCell.value}
                      autoFocus
                      onChange={(e) => setEditingCell((prev) => ({ ...prev, value: e.target.value }))}
                      onBlur={() => {
                        handlePatch(dep.unitCode, 'departmentName', editingCell.value);
                        setEditingCell(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handlePatch(dep.unitCode, 'departmentName', editingCell.value);
                          setEditingCell(null);
                        }
                      }}
                    />
                  ) : (
                    dep.departmentName
                  )}
                </TableCell>

                <TableCell
                  onDoubleClick={() => setEditingCell({ unitCode: dep.unitCode, field: 'address', value: dep.address })}
                >
                  {editingCell?.unitCode === dep.unitCode && editingCell?.field === 'address' ? (
                    <TextField
                      size="small"
                      value={editingCell.value}
                      autoFocus
                      onChange={(e) => setEditingCell((prev) => ({ ...prev, value: e.target.value }))}
                      onBlur={() => {
                        handlePatch(dep.unitCode, 'address', editingCell.value);
                        setEditingCell(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handlePatch(dep.unitCode, 'address', editingCell.value);
                          setEditingCell(null);
                        }
                      }}
                    />
                  ) : (
                    dep.address
                  )}
                </TableCell>

                <TableCell align="right">
                  <IconButton onClick={() => handleEdit(dep)}><Edit /></IconButton>
                  <IconButton color="error" onClick={() => setDeleteTarget(dep)}><Delete /></IconButton>
                </TableCell>
              </TableRow>
            ))}
            {departments.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={4} align="center">Нет данных</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel id="limit-select-label">Показывать по</InputLabel>
          <Select
            labelId="limit-select-label"
            value={limit}
            label="Показывать по"
            onChange={(e) => {
              setLimit(Number(e.target.value));
              setPage(1);
            }}
          >
            {[5, 10, 20, 50].map(n => (
              <MenuItem key={n} value={n}>{n}</MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <Pagination count={totalPages} page={page} onChange={(_, value) => setPage(value)} />
      </Box>

      <DepartmentFormDialog
        open={openForm}
        onClose={() => setOpenForm(false)}
        onSubmit={handleSubmit}
        editingData={editData}
      />

      <ConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        content={`Вы уверены, что хотите удалить отдел "${deleteTarget?.departmentName}"?`}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
      />
    </Container>
  );
}

export default DepartmentPage;
