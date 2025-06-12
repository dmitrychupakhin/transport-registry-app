import { useEffect, useState } from 'react';
import { Container, Typography, Button } from '@mui/material';
import EmployeeTable from './EmployeeTable';
import { fetchEmployees } from './EmployeeService';

function RegistrationEmployeesPage() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadEmployees = async () => {
    setLoading(true);
    try {
      const res = await fetchEmployees();
      setEmployees(res.data.data); 
    } catch (e) {
      console.error('Ошибка загрузки сотрудников:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  return (
    <Container>
      <Typography variant="h4" sx={{ my: 3 }}>
        Сотрудники
      </Typography>

      <Button variant="contained" sx={{ mb: 2 }}>
        Добавить сотрудника
      </Button>

      <EmployeeTable employees={employees} loading={loading} />
    </Container>
  );
}

export default RegistrationEmployeesPage;
