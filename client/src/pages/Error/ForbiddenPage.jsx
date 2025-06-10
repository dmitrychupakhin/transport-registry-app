import { Container, Typography } from '@mui/material';

const ForbiddenPage = () => (
  <Container sx={{ mt: 4 }}>
    <Typography variant="h4" color="error" gutterBottom>
      403 - Доступ запрещён
    </Typography>
    <Typography>У вас нет прав для доступа к этой странице.</Typography>
  </Container>
);

export default ForbiddenPage;
