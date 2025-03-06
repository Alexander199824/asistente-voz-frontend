import React, { useState } from 'react';
import { 
  Container, 
  Grid, 
  Paper, 
  Typography, 
  Box, 
  Button, 
  Divider,
  Alert,
  Card,
  CardContent,
  CardActions,
  CircularProgress,
  Snackbar
} from '@mui/material';
import { 
  AdminPanelSettings as AdminIcon,
  Engineering as EngineeringIcon,
  Update as UpdateIcon,
  Delete as DeleteIcon,
  DataObject as DataObjectIcon,
  Storage as StorageIcon
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import API from '../../api';

const AdminPanel = () => {
  // Estados para manejar las operaciones
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  
  // Función para actualizar la base de conocimientos
  const handleUpdateKnowledge = async () => {
    setLoading(true);
    try {
      await API.post('/admin/update-knowledge', { limit: 5 });
      
      setNotification({
        open: true,
        message: 'Base de conocimiento actualizada correctamente',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error al actualizar conocimiento:', error);
      
      setNotification({
        open: true,
        message: 'Error al actualizar la base de conocimiento',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Función para limpiar la base de conocimientos
  const handleClearKnowledge = async () => {
    if (!window.confirm('¿Estás seguro de que deseas limpiar toda la base de conocimientos? Esta acción no se puede deshacer.')) {
      return;
    }
    
    setLoading(true);
    try {
      await API.post('/admin/clear-knowledge');
      
      setNotification({
        open: true,
        message: 'Base de conocimiento limpiada correctamente',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error al limpiar base de conocimientos:', error);
      
      setNotification({
        open: true,
        message: 'Error al limpiar la base de conocimiento',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Función para cerrar la notificación
  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <AdminIcon sx={{ mr: 2, color: 'primary.main' }} />
        <Typography variant="h4" component="h1">
          Panel de Administración
        </Typography>
      </Box>
      
      <Alert severity="info" sx={{ mb: 4 }}>
        Bienvenido al panel de administración. Desde aquí puedes gestionar la base de conocimientos
        y realizar operaciones avanzadas del sistema.
      </Alert>
      
      <Grid container spacing={3}>
        {/* Administración de conocimientos */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3, borderRadius: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <DataObjectIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h5">
                Base de Conocimientos
              </Typography>
            </Box>
            
            <Divider sx={{ mb: 3 }} />
            
            <Typography variant="body1" paragraph>
              Gestiona la base de conocimientos que utiliza el asistente para responder a las consultas.
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={loading ? <CircularProgress size={24} color="inherit" /> : <UpdateIcon />}
                onClick={handleUpdateKnowledge}
                disabled={loading}
              >
                Actualizar conocimientos
              </Button>
              
              <Button
                variant="outlined"
                color="error"
                startIcon={loading ? <CircularProgress size={24} color="error" /> : <DeleteIcon />}
                onClick={handleClearKnowledge}
                disabled={loading}
              >
                Limpiar base de conocimientos
              </Button>
              
              <Button
                variant="outlined"
                color="primary"
                component={RouterLink}
                to="/admin/knowledge"
                startIcon={<StorageIcon />}
              >
                Gestionar conocimientos
              </Button>
            </Box>
          </Paper>
        </Grid>
        
        {/* Operaciones del sistema */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3, borderRadius: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <EngineeringIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h5">
                Operaciones del Sistema
              </Typography>
            </Box>
            
            <Divider sx={{ mb: 3 }} />
            
            <Typography variant="body1" paragraph>
              Realiza operaciones avanzadas del sistema y monitorea su funcionamiento.
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Estado del Sistema
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Monitorea el estado actual del sistema y sus componentes.
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button size="small" color="primary">
                      Ver estado
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Logs del Sistema
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Visualiza los registros de actividad del sistema.
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button size="small" color="primary">
                      Ver logs
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
      
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={notification.severity}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default AdminPanel;