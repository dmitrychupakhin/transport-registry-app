import { Button, Container, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { HOME_ROUTE } from '../../utils/consts';

function NotFound() {
  const navigate = useNavigate();

  return (
    <Container maxWidth="sm" sx={{ textAlign: 'center', mt: 10 }}>
      <Typography variant="h3" gutterBottom>
        404 - Страница не найдена
      </Typography>
      <Typography variant="body1" sx={{ mb: 4 }}>
        Запрошенная страница не существует.
      </Typography>
      <Button 
        variant="contained" 
        onClick={() => navigate(HOME_ROUTE)}
      >
        На главную
      </Button>
    </Container>
  );
}

export default NotFound;