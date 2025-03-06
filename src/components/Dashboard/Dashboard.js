import React, { useEffect } from 'react';
import { 
  Container, 
  Grid, 
  Paper, 
  Typography, 
  Box, 
  Button, 
  Card, 
  CardContent,
  CardActions,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  CircularProgress
} from '@mui/material';
import { 
  Dashboard as DashboardIcon,
  Mic as MicIcon,
  History as HistoryIcon,
  Settings as SettingsIcon,
  Person as PersonIcon,
  Chat as ChatIcon,
  Lightbulb as LightbulbIcon,
  VolumeUp as VolumeUpIcon
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import useAssistant from '../../hooks/useAssistant';

const Dashboard = () => {
  // Obtengo información del usuario
  const { user } = useAuth();
  
  // Obtengo funcionalidades del contexto del asistente
  const { conversations, loading, fetchHistory } = useAssistant();
  
  // Efecto para cargar el historial cuando se monta el componente
  useEffect(() => {
    if (user) {
      console.log("🔄 Cargando historial...");
      fetchHistory(5, 0) // Solo las 5 conversaciones más recientes
        .then(() => console.log("✅ Historial cargado correctamente"))
        .catch((error) => console.error("❌ Error al obtener historial:", error));
    }
  }, [user, fetchHistory]);
  
  // Formato de fecha para mostrar
  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <DashboardIcon sx={{ mr: 2, color: 'primary.main' }} />
        <Typography variant="h4" component="h1">
          Panel de Control
        </Typography>
      </Box>
      
      <Grid container spacing={3}>
        {/* Información del usuario */}
        <Grid item xs={12} md={4}>
          <Paper 
            elevation={3} 
            sx={{ p: 3, borderRadius: 2, height: '100%', display: 'flex', flexDirection: 'column' }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <PersonIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6">
                Perfil de Usuario
              </Typography>
            </Box>
            
            <Divider sx={{ mb: 2 }} />
            
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="body1" gutterBottom>
                <strong>Usuario:</strong> {user?.username || 'No disponible'}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Email:</strong> {user?.email || 'No disponible'}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Palabra de activación:</strong> {user?.preferences?.wake_word || 'asistente'}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Velocidad de voz:</strong> {user?.preferences?.voice_speed || '1.0'}x
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Tema:</strong> {user?.preferences?.theme === 'dark' ? 'Oscuro' : 'Claro'}
              </Typography>
            </Box>
            
            <Button 
              component={RouterLink} 
              to="/settings"
              variant="outlined" 
              startIcon={<SettingsIcon />}
              fullWidth
              sx={{ mt: 2 }}
            >
              Editar Configuración
            </Button>
          </Paper>
        </Grid>
        
        {/* Conversaciones recientes */}
        <Grid item xs={12}>
          <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <ChatIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">
                  Conversaciones Recientes
                </Typography>
              </Box>
              
              <Button 
                component={RouterLink} 
                to="/history" 
                size="small" 
                startIcon={<HistoryIcon />}
              >
                Ver Todo
              </Button>
            </Box>
            
            <Divider sx={{ mb: 2 }} />
            
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                <CircularProgress />
              </Box>
            ) : conversations.length > 0 ? (
              <List>
                {conversations.slice(0, 5).map((conv) => (
                  <React.Fragment key={conv.id}>
                    <ListItem alignItems="flex-start">
                      <ListItemIcon>
                        <ChatIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary={conv.query}
                        secondary={
                          <>
                            <Typography
                              component="span"
                              variant="body2"
                              color="text.primary"
                            >
                              {conv.response.substring(0, 100)}
                              {conv.response.length > 100 ? '...' : ''}
                            </Typography>
                            <br />
                            <Typography
                              component="span"
                              variant="caption"
                              color="text.secondary"
                            >
                              {formatDate(conv.created_at)}
                            </Typography>
                          </>
                        }
                      />
                    </ListItem>
                    <Divider variant="inset" component="li" />
                  </React.Fragment>
                ))}
              </List>
            ) : (
              <Typography variant="body1" sx={{ textAlign: 'center', py: 3 }}>
                No hay conversaciones recientes. Comienza a hablar con tu asistente.
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;
