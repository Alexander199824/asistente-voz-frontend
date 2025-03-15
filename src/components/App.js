import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Box, Alert, Snackbar } from '@mui/material';

// Contextos
import { AuthProvider } from '../context/AuthContext';
import { AssistantProvider } from '../context/AssistantContext';
import useAuth from '../hooks/useAuth';

// Componentes comunes (carpeta common)
import Header from './common/Header';
import Footer from './common/Footer';
import Loading from './common/Loading';
import NotFound from './common/NotFound';

// Páginas de autenticación
import Login from './Auth/Login';
import Register from './Auth/Register';

// Páginas del asistente
import Assistant from './VoiceAssistant/EnhancedAssistant';
import Dashboard from './Dashboard/Dashboard';
import History from './Dashboard/History';
import Settings from './Settings/Settings';

// Páginas de administrador
import AdminPanel from './Admin/AdminPanel';
import KnowledgeManager from './Admin/KnowledgeManager';

// Componente para rutas protegidas
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  // Mientras se está verificando la autenticación, mostrar pantalla de carga
  if (loading) {
    return <Loading message="Verificando autenticación..." />;
  }
  
  // Si no hay usuario autenticado, redirigir al login
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // Si hay usuario autenticado, mostrar el contenido protegido
  return children;
};

// Rutas que requieren rol de administrador
const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  // Mientras se verifica la autenticación, mostrar pantalla de carga
  if (loading) {
    return <Loading message="Verificando permisos..." />;
  }
  
  // Si no hay usuario o no es admin, redireccionar
  if (!user || !user.isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

const AppContent = () => {
  // Estado para el tema (claro/oscuro)
  const [darkMode, setDarkMode] = useState(false);
  // Estado para notificaciones de conectividad
  const [connectionAlert, setConnectionAlert] = useState({
    open: false,
    message: '',
    severity: 'info'
  });
  
  // Ref para mantener el estado de conexión anterior
  const prevConnectionState = useRef(undefined);
  // Ref para el timeout de cierre automático
  const alertTimeoutRef = useRef(null);
  
  // Obtengo el usuario y sus preferencias
  const { user } = useAuth();
  
  // Efecto para aplicar el tema según las preferencias del usuario
  useEffect(() => {
    if (user?.preferences?.theme === 'dark') {
      setDarkMode(true);
    } else if (user?.preferences?.theme === 'light') {
      setDarkMode(false);
    } else if (user?.preferences?.theme === 'system') {
      // Detectar preferencia del sistema
      const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setDarkMode(prefersDarkMode);
    }
  }, [user]);
  
  // Efecto para monitorear la conectividad con el backend
  useEffect(() => {
    const checkConnection = () => {
      const currentState = window.backendConnected;
      
      // Solo mostrar alertas si hay un cambio en el estado de conexión
      if (currentState !== prevConnectionState.current) {
        // Limpiar cualquier timeout existente
        if (alertTimeoutRef.current) {
          clearTimeout(alertTimeoutRef.current);
        }
        
        if (currentState === false) {
          setConnectionAlert({
            open: true,
            message: "No hay conexión con el servidor. Algunas funciones pueden no estar disponibles.",
            severity: "warning"
          });
        } else if (currentState === true && prevConnectionState.current === false) {
          // Solo mostrar "conexión restablecida" si antes estaba desconectado
          setConnectionAlert({
            open: true,
            message: "Conexión al servidor restablecida.",
            severity: "success"
          });
          
          // Cerrar automáticamente después de 3 segundos
          alertTimeoutRef.current = setTimeout(() => {
            setConnectionAlert(prev => ({...prev, open: false}));
            alertTimeoutRef.current = null;
          }, 3000);
        }
        
        // Actualizar el estado anterior
        prevConnectionState.current = currentState;
      }
    };
    
    // Verificar el estado inicial (pero no mostrar nada si es la primera carga)
    const initialState = window.backendConnected;
    if (initialState !== undefined) {
      prevConnectionState.current = initialState;
      
      // Solo mostrar alerta de error si no hay conexión inicial
      if (initialState === false) {
        setConnectionAlert({
          open: true,
          message: "No hay conexión con el servidor. Algunas funciones pueden no estar disponibles.",
          severity: "warning"
        });
      }
    }
    
    // Crear un observador para cambios en el estado de conexión
    const intervalId = setInterval(checkConnection, 5000);
    
    return () => {
      clearInterval(intervalId);
      if (alertTimeoutRef.current) {
        clearTimeout(alertTimeoutRef.current);
      }
    };
  }, []);
  
  // Creo el tema basado en el modo actual
  const theme = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: {
        main: '#2196f3', // Azul
      },
      secondary: {
        main: '#f50057', // Rosa
      },
    },
    typography: {
      fontFamily: [
        'Roboto',
        'Arial',
        'sans-serif',
      ].join(','),
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: 8,
          },
        },
      },
    },
  });
  
  // Función para cerrar alerta de conexión
  const handleCloseConnectionAlert = () => {
    setConnectionAlert(prev => ({...prev, open: false}));
    // Limpiar el timeout si se cierra manualmente
    if (alertTimeoutRef.current) {
      clearTimeout(alertTimeoutRef.current);
      alertTimeoutRef.current = null;
    }
  };
  
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            minHeight: '100vh',
          }}
        >
          <Header />
          
          <Box component="main" sx={{ flexGrow: 1, pt: 2, pb: 4 }}>
            {/* Alerta de conexión */}
            <Snackbar
              open={connectionAlert.open}
              autoHideDuration={connectionAlert.severity === 'success' ? 3000 : null}
              onClose={handleCloseConnectionAlert}
              anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
              <Alert 
                onClose={handleCloseConnectionAlert} 
                severity={connectionAlert.severity}
                variant="filled"
                sx={{ width: '100%' }}
              >
                {connectionAlert.message}
              </Alert>
            </Snackbar>
            
            <Routes>
              {/* Ruta principal redirige al asistente */}
              <Route path="/" element={<Navigate to="/assistant" replace />} />
              
              {/* Rutas públicas */}
              <Route path="/assistant" element={<Assistant />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              {/* Rutas protegidas (requieren autenticación) */}
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/history" 
                element={
                  <ProtectedRoute>
                    <History />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/settings" 
                element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                } 
              />
              
              {/* Rutas de administración */}
              <Route 
                path="/admin" 
                element={
                  <AdminRoute>
                    <AdminPanel />
                  </AdminRoute>
                } 
              />
              <Route 
                path="/admin/knowledge" 
                element={
                  <AdminRoute>
                    <KnowledgeManager />
                  </AdminRoute>
                } 
              />
              
              {/* Ruta para páginas no encontradas */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Box>
          
          <Footer />
        </Box>
      </Router>
    </ThemeProvider>
  );
};

const App = () => {
  // Mostrar información de API en consola
  console.log('API URL:', process.env.REACT_APP_API_URL || 'https://asistente-voz-backend.onrender.com/api');
  
  return (
    <AuthProvider>
      <AssistantProvider>
        <AppContent />
      </AssistantProvider>
    </AuthProvider>
  );
};

export default App;