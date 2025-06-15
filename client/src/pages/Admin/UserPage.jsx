import { useEffect, useState } from 'react';
import {
  Container, Typography, Button, Box, Snackbar, TextField, Pagination,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  IconButton, MenuItem, Select, FormControl, InputLabel
} from '@mui/material';
import { Add, Delete, Edit, Lock } from '@mui/icons-material';
import UserFormDialog from '../../components/Admin/User/UserFormDialog';
import ChangePasswordDialog from '../../components/Admin/User/ChangePasswordDialog';
import ConfirmDeleteDialog from '../../components/Common/ConfirmDeleteDialog';
import {
  getUsers,
  createUser,
  patchUser,
  deleteUser
} from '../../components/Admin/User/UserService';

function UserPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openForm, setOpenForm] = useState(false);
  const [editData, setEditData] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  const [filter, setFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  const [editingCell, setEditingCell] = useState(null);
  const [openPasswordDialog, setOpenPasswordDialog] = useState(false);
  const [selectedUserForPassword, setSelectedUserForPassword] = useState(null);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const params = { page, limit };
      if (filter.trim()) params.search = filter.trim();
      if (roleFilter) params.role = roleFilter;

      const res = await getUsers(params);
      setUsers(res.data.data);
      setTotalPages(res.data.pages || 1);
    } catch (e) {
      console.error(e);
      showSnackbar('Ошибка загрузки пользователей', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [page, filter, roleFilter, limit]);

  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCreate = () => {
    setEditData(null);
    setOpenForm(true);
  };

  const handleEdit = (user) => {
    setEditData(user);
    setOpenForm(true);
  };

  const handleDelete = async () => {
    try {
      await deleteUser(deleteTarget.id);
      showSnackbar('Пользователь удалён', 'success');
      loadUsers();
    } catch (e) {
      console.error(e);
      showSnackbar(e.response?.data?.message || 'Ошибка удаления', 'error');
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleSubmit = async (formData) => {
    try {
      if (editData) {
        await patchUser(editData.id, formData);
        showSnackbar('Данные обновлены', 'success');
      } else {
        await createUser(formData);
        showSnackbar('Пользователь создан', 'success');
      }
      setOpenForm(false);
      loadUsers();
    } catch (e) {
      console.error(e);
      showSnackbar(e.response?.data?.message || 'Ошибка сохранения', 'error');
    }
  };

  const handlePatchField = async (id, field, value) => {
    try {
      await patchUser(id, { [field]: value });
      showSnackbar('Изменения сохранены', 'success');
      loadUsers();
    } catch (e) {
      console.error(e);
      showSnackbar('Ошибка при обновлении', 'error');
    } finally {
      setEditingCell(null);
    }
  };

  const openChangePassword = (user) => {
    setSelectedUserForPassword(user);
    setOpenPasswordDialog(true);
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">Пользователи</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={handleCreate}>
          Добавить пользователя
        </Button>
      </Box>

      <Box display="flex" gap={2} mb={2}>
        <TextField
          fullWidth
          label="Поиск"
          value={filter}
          onChange={(e) => {
            setPage(1);
            setFilter(e.target.value);
          }}
        />
        <Select
          displayEmpty
          value={roleFilter}
          onChange={(e) => {
            setPage(1);
            setRoleFilter(e.target.value);
          }}
          sx={{ width: 200 }}
        >
          <MenuItem value="">Все роли</MenuItem>
          <MenuItem value="ADMIN">Админ</MenuItem>
          <MenuItem value="EMPLOYEE">Сотрудник</MenuItem>
          <MenuItem value="OWNER">Владелец</MenuItem>
        </Select>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Email</TableCell>
              <TableCell>Роль</TableCell>
              <TableCell>Идентификатор</TableCell>
              <TableCell align="right">Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell
                  onDoubleClick={() => setEditingCell({ id: user.id, field: 'email', value: user.email })}
                >
                  {editingCell?.id === user.id && editingCell?.field === 'email' ? (
                    <TextField
                      value={editingCell.value}
                      size="small"
                      autoFocus
                      onChange={(e) => setEditingCell((prev) => ({ ...prev, value: e.target.value }))}
                      onBlur={() => handlePatchField(user.id, 'email', editingCell.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handlePatchField(user.id, 'email', editingCell.value);
                      }}
                    />
                  ) : (
                    user.email
                  )}
                </TableCell>

                <TableCell>
                  {user.role}
                </TableCell>

                <TableCell>{user.passportData || user.taxNumber || user.badgeNumber || '—'}</TableCell>

                <TableCell align="right">
                  <IconButton onClick={() => handleEdit(user)}><Edit /></IconButton>
                  <IconButton color="error" onClick={() => setDeleteTarget(user)}><Delete /></IconButton>
                  <IconButton color="primary" onClick={() => openChangePassword(user)}><Lock /></IconButton>
                </TableCell>
              </TableRow>
            ))}
            {users.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={4} align="center">Нет данных</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
        <FormControl sx={{ minWidth: 120 }}>
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
            {[5, 10, 20, 50].map((n) => (
              <MenuItem key={n} value={n}>{n}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <Pagination count={totalPages} page={page} onChange={(_, value) => setPage(value)} />
      </Box>

      <UserFormDialog
        open={openForm}
        onClose={() => setOpenForm(false)}
        onSubmit={handleSubmit}
        editingData={editData}
      />

      <ChangePasswordDialog
        open={openPasswordDialog}
        onClose={() => setOpenPasswordDialog(false)}
        user={selectedUserForPassword}
        onPasswordChanged={() => {
          showSnackbar('Пароль изменён', 'success');
          setOpenPasswordDialog(false);
        }}
      />

      <ConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        content={`Удалить пользователя ${deleteTarget?.email}?`}
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

export default UserPage;
