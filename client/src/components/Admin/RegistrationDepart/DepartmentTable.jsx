import { useState } from 'react';
import {
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, IconButton, CircularProgress
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

function DepartmentTable({ departments, loading, onEdit, onDelete }) {
  const [selected, setSelected] = useState(null);

  if (loading) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <CircularProgress />
      </Paper>
    );
  }

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Код подразделения</TableCell>
            <TableCell>Название отдела</TableCell>
            <TableCell>Адрес</TableCell>
            <TableCell align="right">Действия</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {departments.map((dept) => (
            <TableRow key={dept.unitCode} hover>
              <TableCell>{dept.unitCode}</TableCell>
              <TableCell>{dept.departmentName}</TableCell>
              <TableCell>{dept.address}</TableCell>
              <TableCell align="right">
                <IconButton onClick={() => onEdit(dept)} size="small">
                  <EditIcon />
                </IconButton>
                <IconButton onClick={() => onDelete(dept)} size="small">
                  <DeleteIcon color="error" />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
          {departments.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} align="center">
                Нет доступных отделов
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default DepartmentTable;
