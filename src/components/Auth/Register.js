import React, { useState } from 'react';
import { 
  Container, 
  Paper, 
  Typography, 
  TextField, 
  Button, 
  Box, 
  Link, 
  CircularProgress,
  Alert
} from '@mui/material';
import { PersonAdd } from '@mui/icons-material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';

const Register = () => {
  // Estados locales
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errorMessage, setErrorMessage] = useState('');
  
  // Obtengo funcionalidades del contexto de autenticación
  const { register, loading, error } = useAuth();
  
  // Hook para navegación
  const navigate = useNavigate();
  
  // Función para manejar cambios en los inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Función para manejar el envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    
    // Extraigo los datos del formulario
    const { username, email, password, confirmPassword } = formData;
    
    // Validaciones básicas
    if (!username.trim() || !email.trim() || !password || !confirmPassword) {
      setErrorMessage('Por favor, completa todos los campos');
      return;
    }
    
    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorMessage('Por favor, ingresa un email válido');
      return;
    }
    
    // Validar que las contraseñas coincidan
    if (password !== confirmPassword) {
      setErrorMessage('Las contraseñas no coinciden');
      return;
    }
    
    // Validar longitud de contraseña
    if (password.length < 6) {
      setErrorMessage('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    
    try {
      // Intento registrar al usuario
      await register(username, email, password);
      
      // Si el registro es exitoso, redirijo al asistente
      navigate('/assistant');
    } catch (error) {
      console.error('Error en registro:', error);
      setErrorMessage(error.response?.data?.message || 'Error al registrarse');
    }
  };
  
  return (
    <Container maxWidth="sm" sx={{ mt: 8, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Typography variant="h4" component="h1" align="center" gutterBottom>
          Crear Cuenta
        </Typography>
        
        <Typography variant="body1" align="center" sx={{ mb: 3 }}>
          Regístrate para personalizar tu experiencia con el asistente de voz
        </Typography>
        
        {(errorMessage || error) && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {errorMessage || error}
          </Alert>
        )}
        
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="username"
            label="Nombre de usuario"
            name="username"
            autoComplete="username"
            autoFocus
            value={formData.username}
            onChange={handleChange}
            disabled={loading}
          />
          
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Correo electrónico"
            name="email"
            autoComplete="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            disabled={loading}
          />
          
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Contraseña"
            type="password"
            id="password"
            autoComplete="new-password"
            value={formData.password}
            onChange={handleChange}
            disabled={loading}
          />
          
          <TextField
            margin="normal"
            required
            fullWidth
            name="confirmPassword"
            label="Confirmar Contraseña"
            type="password"
            id="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            disabled={loading}
          />
          
          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            sx={{ mt: 3, mb: 2 }}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <PersonAdd />}
          >
            {loading ? 'Registrando...' : 'Registrarse'}
          </Button>
          
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="body2">
              ¿Ya tienes una cuenta?{' '}
              <Link component={RouterLink} to="/login" variant="body2">
                Inicia sesión aquí
              </Link>
            </Typography>
          </Box>
          
          <Box sx={{ mt: 1, textAlign: 'center' }}>
            <Link component={RouterLink} to="/assistant" variant="body2">
              Continuar sin registrarse
            </Link>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default Register;