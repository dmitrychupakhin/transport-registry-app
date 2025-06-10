import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Link
} from "@mui/material";
import http from '../../http';
import { LOGIN_ROUTE } from "../../utils/consts";
import { Context } from "../../index";

function RegisterEmployee() {
  const { user } = useContext(Context);
  const [badgeNumber, setBadgeNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (user.isAuth) {
      navigate('/');
    }
  }, [user.isAuth]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!badgeNumber || !/^\d{2}-\d{4}$/.test(badgeNumber)) {
      setError('Неверный формат номера значка (XX-XXXX)');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await http.post("/auth/register/employee", { badgeNumber });
      setSuccess(true);
    } catch (e) {
      console.error("Registration error:", e);
      setError(e.response?.data?.message || "Ошибка регистрации");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Container maxWidth="sm">
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="h5" gutterBottom>
            Регистрация успешна!
          </Typography>
          <Typography>
            Сотрудник с номером значка {badgeNumber} зарегистрирован.
            Пожалуйста, обратитесь к руководителю для получения учетных данных.
          </Typography>
          <Button 
            variant="contained" 
            sx={{ mt: 3 }}
            onClick={() => navigate('/')}
          >
            На главную
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm">
      <Box 
        component="form" 
        onSubmit={handleSubmit}
        sx={{ mt: 4, display: "flex", flexDirection: "column", gap: 2 }}
      >
        <Typography variant="h5" component="h1" align="center">
          Регистрация сотрудника
        </Typography>
        
        {error && <Alert severity="error">{error}</Alert>}

        <TextField
          label="Номер значка (XX-XXXX)"
          value={badgeNumber}
          onChange={(e) => setBadgeNumber(e.target.value)}
          fullWidth
          required
          placeholder="12-3456"
        />

        <Button 
          type="submit"
          variant="contained" 
          disabled={loading}
          fullWidth
        >
          {loading ? <CircularProgress size={24} /> : 'Зарегистрировать'}
        </Button>

        <Typography align="center">
          Уже зарегистрированы?{' '}
          <Link href={LOGIN_ROUTE}>
            Войти
          </Link>
        </Typography>
      </Box>
    </Container>
  );
}

export default RegisterEmployee;