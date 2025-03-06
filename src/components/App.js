import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Box } from '@mui/material';

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
import Assistant from './VoiceAssistant/Assistant';
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
  return (
    <AuthProvider>
      <AssistantProvider>
        <AppContent />
      </AssistantProvider>
    </AuthProvider>
  );
};

export default App;