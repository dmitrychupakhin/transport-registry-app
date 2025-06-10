import { useState, useContext, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  Container, 
  Typography, 
  TextField, 
  Button, 
  Box, 
  Alert,
  CircularProgress,
  Link
} from "@mui/material";
import { 
  LOGIN_ROUTE, 
  REGISTER_NATURAL_ROUTE, 
  REGISTER_LEGAL_ROUTE,
  REGISTRATION_EMPLOYEE_ROUTE 
} from "../../utils/consts";
import { Context } from "../../index";

function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useContext(Context);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (user.isAuth) {
      navigate('/');
    }
  }, [user.isAuth]);

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Email и пароль обязательны');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await user.login(email, password);
      if (result.success) {
        navigate('/');
      } else {
        setError(result.message || 'Ошибка входа');
      }
    } catch (e) {
      console.error(e);
      setError('Произошла ошибка при входе');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box 
        component="form"
        onSubmit={handleLogin}
        sx={{ 
          mt: 8, 
          display: "flex", 
          flexDirection: "column", 
          gap: 2 
        }}
      >
        {location.state?.registrationSuccess && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Регистрация прошла успешно! Теперь вы можете войти.
          </Alert>
        )}

        <Typography variant="h4" component="h1" align="center">
          Вход в систему
        </Typography>
        
        {error && <Alert severity="error">{error}</Alert>}

        <TextField 
          label="Email" 
          variant="outlined" 
          fullWidth
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <TextField 
          label="Пароль" 
          type="password" 
          variant="outlined" 
          fullWidth
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <Button 
          type="submit"
          variant="contained" 
          color="primary" 
          fullWidth
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : 'Войти'}
        </Button>

        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          gap: 1,
          mt: 2,
          alignItems: 'center'
        }}>
          <Typography variant="body2">
            Нет аккаунта? Выберите тип регистрации:
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button 
              variant="outlined" 
              size="small"
              onClick={() => navigate(REGISTER_NATURAL_ROUTE)}
            >
              Физ. лицо
            </Button>
            <Button 
              variant="outlined" 
              size="small"
              onClick={() => navigate(REGISTER_LEGAL_ROUTE)}
            >
              Юр. лицо
            </Button>
            <Button 
              variant="outlined" 
              size="small"
              onClick={() => navigate(REGISTRATION_EMPLOYEE_ROUTE)}
            >
              Сотрудник
            </Button>
          </Box>
        </Box>
      </Box>
    </Container>
  );
}

export default Auth;