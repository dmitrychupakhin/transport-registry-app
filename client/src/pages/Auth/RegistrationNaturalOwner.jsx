import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import http from '../../http';
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
import { LOGIN_ROUTE, REGISTER_LEGAL_ROUTE } from "../../utils/consts";
import { Context } from '../../index';

export default function RegisterNaturalOwner() {
  const { user } = useContext(Context);
  const [form, setForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    passportData: "",
    address: "",
    lastName: "",
    firstName: "",
    patronymic: ""
  });  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (user.isAuth) {
      navigate('/');
    }
  }, [user.isAuth]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const validateForm = () => {
    if (!form.email || !form.password) {
      setError('Email и пароль обязательны');
      return false;
    }

    if (form.password !== form.confirmPassword) {
      setError('Пароли не совпадают');
      return false;
    }

    if (!form.passportData || !/^\d{4} \d{6}$/.test(form.passportData)) {
      setError('Неверный формат паспорта (XXXX XXXXXX)');
      return false;
    }

    if (!form.lastName || !form.firstName) {
      setError('ФИО обязательно');
      return false;
    }

    if (!form.address) {
      setError('Адрес обязателен');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError(null);

    try {
      await http.post("/auth/register/natural-person", {
        isNaturalPerson: true,
        passportData: form.passportData,
        address: form.address,
        lastName: form.lastName,
        firstName: form.firstName,
        patronymic: form.patronymic,
      });

      try {
        await http.post("/auth/register/owner", {
          email: form.email,
          password: form.password,
          role: "OWNER",
          passportData: form.passportData,
          isNaturalPerson: true
        });
        
        navigate(LOGIN_ROUTE, { state: { registrationSuccess: true } });
      } catch (userError) {
        await http.delete(`/auth/natural-persons/${form.passportData}`);
        throw userError;
      }
    } catch (e) {
      console.error("Registration error:", e);
      setError(
        e.response?.data?.message || 
        e.response?.data?.error?.details?.[0]?.message || 
        "Ошибка регистрации"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 4, display: "flex", flexDirection: "column", gap: 2 }}>
        <Typography variant="h5" component="h1" align="center">
          Регистрация физического лица
        </Typography>
        
        {error && <Alert severity="error">{error}</Alert>}

        <TextField
          label="Паспортные данные (XXXX XXXXXX)"
          name="passportData"
          value={form.passportData}
          onChange={handleChange}
          fullWidth
          required
          placeholder="1234 567890"
        />
        <TextField
          label="Фамилия"
          name="lastName"
          value={form.lastName}
          onChange={handleChange}
          fullWidth
          required
        />
        <TextField
          label="Имя"
          name="firstName"
          value={form.firstName}
          onChange={handleChange}
          fullWidth
          required
        />
        <TextField
          label="Отчество"
          name="patronymic"
          value={form.patronymic}
          onChange={handleChange}
          fullWidth
          required
        />
        <TextField
          label="Адрес"
          name="address"
          value={form.address}
          onChange={handleChange}
          fullWidth
          required
        />
        <TextField
          label="Email"
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          fullWidth
          required
        />
        <TextField
          label="Пароль"
          name="password"
          type="password"
          value={form.password}
          onChange={handleChange}
          fullWidth
          required
        />
        <TextField
          label="Подтвердите пароль"
          name="confirmPassword"
          type="password"
          value={form.confirmPassword}
          onChange={handleChange}
          fullWidth
          required
        />

        <Button 
          variant="contained" 
          onClick={handleSubmit}
          disabled={loading}
          fullWidth
        >
          {loading ? <CircularProgress size={24} /> : 'Зарегистрироваться'}
        </Button>

        <Typography align="center">
          Вы юридическое лицо?{' '}
          <Link href={REGISTER_LEGAL_ROUTE}>Зарегистрироваться как юр. лицо</Link>
        </Typography>

        <Typography align="center">
          Уже зарегистрированы?{' '}
          <Link href={LOGIN_ROUTE}>Войти</Link>
        </Typography>
      </Box>
    </Container>
  );
}