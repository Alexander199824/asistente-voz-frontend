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
import { Login as LoginIcon } from '@mui/icons-material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';

const Login = () => {
  // Estados locales
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  // Obtengo funcionalidades del contexto de autenticación
  const { login, loading, error } = useAuth();
  
  // Hook para navegación
  const navigate = useNavigate();
  
  // Función para manejar el envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    
    // Validaciones básicas
    if (!username.trim() || !password.trim()) {
      setErrorMessage('Por favor, completa todos los campos');
      return;
    }
    
    try {
      // Intento iniciar sesión
      await login(username, password);
      
      // Si el login es exitoso, redirijo al asistente
      navigate('/assistant');
    } catch (error) {
      console.error('Error en inicio de sesión:', error);
      setErrorMessage(error.response?.data?.message || 'Error al iniciar sesión');
    }
  };
  
  return (
    <Container maxWidth="sm" sx={{ mt: 8, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Typography variant="h4" component="h1" align="center" gutterBottom>
          Iniciar Sesión
        </Typography>
        
        <Typography variant="body1" align="center" sx={{ mb: 3 }}>
          Accede a tu cuenta para usar el asistente de voz inteligente
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
            label="Nombre de usuario o Email"
            name="username"
            autoComplete="username"
            autoFocus
            value={username}
            onChange={(e) => setUsername(e.target.value)}
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
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
          
          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            sx={{ mt: 3, mb: 2 }}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <LoginIcon />}
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </Button>
          
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="body2">
              ¿No tienes una cuenta?{' '}
              <Link component={RouterLink} to="/register" variant="body2">
                Regístrate aquí
              </Link>
            </Typography>
          </Box>
          
          <Box sx={{ mt: 1, textAlign: 'center' }}>
            <Link component={RouterLink} to="/assistant" variant="body2">
              Continuar sin iniciar sesión
            </Link>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default Login;