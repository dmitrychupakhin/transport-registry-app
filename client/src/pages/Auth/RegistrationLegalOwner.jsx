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
import { LOGIN_ROUTE, REGISTER_NATURAL_ROUTE } from "../../utils/consts";
import { Context } from '../../index';

export default function RegisterLegalOwner() {
  const { user } = useContext(Context);
  const [form, setForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    taxNumber: "",
    address: "",
    companyName: ""
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

    if (!form.taxNumber || !/^\d{10}$/.test(form.taxNumber)) {
      setError('ИНН должен содержать 10 цифр');
      return false;
    }

    if (!form.companyName) {
      setError('Название организации обязательно');
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
        await http.post("/auth/register/legal-entity", {
        isNaturalPerson: false,
        taxNumber: form.taxNumber,
        address: form.address,
        companyName: form.companyName,
        });

        try {
        await http.post("/auth/register/owner", {
            email: form.email,
            password: form.password,
            role: "OWNER",
            taxNumber: form.taxNumber,
            isNaturalPerson: false
        });
        
        navigate(LOGIN_ROUTE, { state: { registrationSuccess: true } });
        } catch (userError) {
        await http.delete(`/auth/legal-entities/${form.taxNumber}`);
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
          Регистрация юридического лица
        </Typography>
        
        {error && <Alert severity="error">{error}</Alert>}

        <TextField
          label="ИНН (10 цифр)"
          name="taxNumber"
          value={form.taxNumber}
          onChange={handleChange}
          fullWidth
          required
          placeholder="1234567890"
        />
        <TextField
          label="Название организации"
          name="companyName"
          value={form.companyName}
          onChange={handleChange}
          fullWidth
          required
        />
        <TextField
          label="Юридический адрес"
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
          Вы физическое лицо?{' '}
          <Link href={REGISTER_NATURAL_ROUTE}>Зарегистрироваться как физ. лицо</Link>
        </Typography>

        <Typography align="center">
          Уже зарегистрированы?{' '}
          <Link href={LOGIN_ROUTE}>Войти</Link>
        </Typography>

      </Box>
    </Container>
  );
}