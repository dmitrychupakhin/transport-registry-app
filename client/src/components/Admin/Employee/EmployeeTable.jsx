import {
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, IconButton, TextField, CircularProgress
} from '@mui/material';
import { Edit, Delete } from '@mui/icons-material';
import { useState } from 'react';

function EmployeeTable({
  employees,
  loading,
  onEdit,
  onDelete,
  onPatch,
  sortField,
  sortOrder,
  onSort
}) {
  const [editingCell, setEditingCell] = useState(null);

  const handleKeyDown = (e, badgeNumber, field, value) => {
    if (e.key === 'Enter') {
      onPatch(badgeNumber, field, value);
      setEditingCell(null);
    }
  };

  if (loading) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <CircularProgress />
      </Paper>
    );
  }

  const renderHeaderCell = (label, fieldKey) => (
    <TableCell
      sx={{ cursor: 'pointer', whiteSpace: 'nowrap' }}
      onClick={() => onSort(fieldKey)}
    >
      {label} {sortField === fieldKey ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
    </TableCell>
  );

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            {renderHeaderCell('Номер значка', 'badgeNumber')}
            {renderHeaderCell('Код подразделения', 'unitCode')}
            {renderHeaderCell('Фамилия', 'lastName')}
            {renderHeaderCell('Имя', 'firstName')}
            {renderHeaderCell('Отчество', 'patronymic')}
            {renderHeaderCell('Звание', 'rank')}
            <TableCell align="right">Действия</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {employees.map((emp) => (
            <TableRow key={emp.badgeNumber}>
              {['badgeNumber', 'unitCode', 'lastName', 'firstName', 'patronymic', 'rank'].map((field) => (
                <TableCell
                  key={field}
                  onDoubleClick={() => {
                    if (field !== 'badgeNumber') {
                      setEditingCell({ badgeNumber: emp.badgeNumber, field, value: emp[field] });
                    }
                  }}
                >
                  {editingCell?.badgeNumber === emp.badgeNumber && editingCell?.field === field ? (
                    <TextField
                      size="small"
                      value={editingCell.value}
                      autoFocus
                      onChange={(e) => setEditingCell((prev) => ({ ...prev, value: e.target.value }))}
                      onBlur={() => {
                        onPatch(emp.badgeNumber, field, editingCell.value);
                        setEditingCell(null);
                      }}
                      onKeyDown={(e) => handleKeyDown(e, emp.badgeNumber, field, editingCell.value)}
                    />
                  ) : (
                    emp[field]
                  )}
                </TableCell>
              ))}
              <TableCell align="right">
                <IconButton onClick={() => onEdit(emp)}><Edit /></IconButton>
                <IconButton color="error" onClick={() => onDelete(emp)}><Delete /></IconButton>
              </TableCell>
            </TableRow>
          ))}
          {employees.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} align="center">Нет данных</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default EmployeeTable;
