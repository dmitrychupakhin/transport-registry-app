import { useEffect, useState } from 'react';
import { Container, Typography, Button } from '@mui/material';
import DepartmentTable from './DepartmentTable';
import { fetchDepartments } from './DepartmentService';

function RegistrationDepartmentsPage() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadDepartments = async () => {
    setLoading(true);
    try {
      const { data } = await fetchDepartments();
      setDepartments(data.data); // из API: { total, pages, currentPage, data }
    } catch (e) {
      console.error('Ошибка загрузки отделов:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDepartments();
  }, []);

  return (
    <Container>
      <Typography variant="h4" sx={{ my: 3 }}>
        Регистрационные отделы
      </Typography>

      <Button variant="contained" sx={{ mb: 2 }}>
        Добавить отдел
      </Button>

      <DepartmentTable departments={departments} loading={loading} onReload={loadDepartments} />
    </Container>
  );
}

export default RegistrationDepartmentsPage;
