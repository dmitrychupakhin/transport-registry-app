import { useContext, useEffect, useState } from 'react';
import { Context } from '../index';
import { Container, Typography, Box, CircularProgress, Alert } from '@mui/material';
import { observer } from 'mobx-react-lite';
import http from '../http';
import axios from 'axios';

const ProfilePage = observer(() => {
  const { user } = useContext(Context);
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchProfileData = async () => {
    try {
      let res = null;

      if (user.user.role === 'OWNER') {
        if (user.user.passportData) {
          res = await http.get(`/employee/natural-persons/${user.user.passportData}`);
        } else if (user.user.taxNumber) {
          res = await http.get(`/employee/legal-entities/${user.user.taxNumber}`);
        }
      } else if (user.user.role === 'EMPLOYEE' && user.user.badgeNumber) {
        res = await http.get(`/admin/employees/search?badgeNumber=${user.user.badgeNumber}`);
      }

      if (res?.data) {
        setProfileData(res.data);
      }
    } catch (err) {
      console.error(err);
      setError('Ошибка загрузки данных профиля');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, []);

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Профиль пользователя
      </Typography>

      <Typography>Email: {user.user.email}</Typography>

      {user.user.role === 'ADMIN' && (
        <Alert severity="info" sx={{ mt: 2 }}>
          Администратор ИС
        </Alert>
      )}

      {loading && <CircularProgress sx={{ mt: 2 }} />}
      {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}

      {!loading && profileData && (
        <Box sx={{ mt: 3 }}>
          {user.user.role === 'EMPLOYEE' && (
            <>
              <Typography>ФИО: {profileData.lastName} {profileData.firstName} {profileData.patronymic}</Typography>
              <Typography>Номер жетона: {profileData.badgeNumber}</Typography>
              <Typography>Код подразделения: {profileData.unitCode}</Typography>
              <Typography>Звание: {profileData.rank}</Typography>
            </>
          )}

          {user.user.passportData && (
            <>
              <Typography>ФИО: {profileData.lastName} {profileData.firstName} {profileData.patronymic}</Typography>
              <Typography>Паспортные данные: {profileData.passportData}</Typography>
              <Typography>Адрес: {profileData.address}</Typography>
            </>
          )}

          {user.user.taxNumber && (
            <>
              <Typography>Название компании: {profileData.companyName}</Typography>
              <Typography>ИНН: {profileData.taxNumber}</Typography>
              <Typography>Адрес: {profileData.address}</Typography>
            </>
          )}
        </Box>
      )}
    </Container>
  );
});

export default ProfilePage;
