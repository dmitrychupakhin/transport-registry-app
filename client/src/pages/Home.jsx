import { useContext } from 'react';
import { Box, Typography, List, ListItem, ListItemText, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Context } from '../index'; 

function Home() {
  const { user } = useContext(Context);
  const navigate = useNavigate();

  return (
    <Box display="flex" height="100vh">
      <Box
        flex={1}
        sx={{
          backgroundImage: 'url(/images/transport-illustration.png)', 
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'contain', 
          backgroundPosition: 'center',
          backgroundColor: '#fff',
        }}
      />

      <Box
        flex={1}
        display="flex"
        flexDirection="column"
        justifyContent="center"
        px={6}
        py={4}
        sx={{ backgroundColor: '#f5f5f5' }}
      >
        <Typography variant="h3" gutterBottom>
          Добро пожаловать в транспортный портал
        </Typography>

        <Typography variant="h6" gutterBottom>
          Здесь вы можете:
        </Typography>

        <List>
          <ListItem disablePadding>
            <ListItemText primary="🔹 Подать заявление на регистрацию ТС" />
          </ListItem>
          <ListItem disablePadding>
            <ListItemText primary="🔹 Изменить данные владельца или автомобиля" />
          </ListItem>
          <ListItem disablePadding>
            <ListItemText primary="🔹 Снять транспорт с учета" />
          </ListItem>
          <ListItem disablePadding>
            <ListItemText primary="🔹 Просмотреть документы" />
          </ListItem>
        </List>

        {!user.isAuth && (
          <Box mt={4}>
            <Button variant="contained" onClick={() => navigate('/login')}>
              Войти
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  );
}

export default Home;
