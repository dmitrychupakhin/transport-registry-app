import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Context } from '../index';
import { observer } from 'mobx-react-lite';

const Header = observer(() => {
  const { user } = useContext(Context);
  const navigate = useNavigate();

  const handleLogout = () => {
    user.logout();
    navigate('/login');
  };

  return (
    <AppBar position="static" color="default" sx={{ mb: 3 }}>
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1, cursor: 'pointer' }} onClick={() => navigate('/')}>
          Transport Registry
        </Typography>
        {user.isAuth && user.user.role === 'ADMIN' && (
          <Box>
            <Button color="inherit" onClick={() => navigate('/admin/employees')}>Сотрудники</Button>
            <Button color="inherit" onClick={() => navigate('/admin/departments')}>Отделы</Button>
          </Box>
        )}
        {user.isAuth && (
          <Box>
            <Button color="inherit" onClick={() => navigate('/profile')}>Профиль</Button>
            <Button color="inherit" onClick={handleLogout}>Выйти</Button>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
});

export default Header;
