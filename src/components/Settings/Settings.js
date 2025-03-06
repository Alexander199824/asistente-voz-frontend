import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Paper, 
  Typography, 
  TextField, 
  Button, 
  Box, 
  Slider, 
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Divider
} from '@mui/material';
import { Save, VolumeUp, Settings as SettingsIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import useSpeech from '../../hooks/useSpeech';

const Settings = () => {
  // Estados para las configuraciones
  const [preferences, setPreferences] = useState({
    wake_word: 'asistente',
    voice_type: 'standard',
    voice_speed: 1.0,
    theme: 'light'
  });
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [testText, setTestText] = useState('Hola, soy tu asistente de voz');
  
  // Obtengo funcionalidades del contexto de autenticación
  const { user, updatePreferences, loading } = useAuth();
  
  // Obtengo funcionalidades de síntesis de voz
  const { speak, voices, selectedVoice, changeVoice } = useSpeech();
  
  // Hook para navegación
  const navigate = useNavigate();
  
  // Efecto para cargar las preferencias actuales del usuario
  useEffect(() => {
    if (user?.preferences) {
      setPreferences({
        wake_word: user.preferences.wake_word || 'asistente',
        voice_type: user.preferences.voice_type || 'standard',
        voice_speed: user.preferences.voice_speed || 1.0,
        theme: user.preferences.theme || 'light'
      });
    } else if (!user) {
      // Si no hay usuario autenticado, redireccionar al login
      navigate('/login');
    }
  }, [user, navigate]);
  
  // Función para manejar cambios en los inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setPreferences(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Función para manejar cambios en el slider de velocidad
  const handleSpeedChange = (event, newValue) => {
    setPreferences(prev => ({
      ...prev,
      voice_speed: newValue
    }));
  };
  
  // Función para probar la voz
  const handleTestVoice = () => {
    speak(testText);
  };
  
  // Función para guardar las preferencias
  const handleSave = async () => {
    setSuccess(false);
    setError('');
    
    try {
      await updatePreferences(preferences);
      setSuccess(true);
      
      // Mostrar mensaje de éxito durante 3 segundos
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Error al guardar preferencias:', error);
      setError('Error al guardar las preferencias');
    }
  };
  
  // Si el usuario no está autenticado, mostrar mensaje
  if (!user) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="warning">
          Debes iniciar sesión para acceder a las configuraciones.
        </Alert>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <SettingsIcon sx={{ mr: 2, color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            Configuración
          </Typography>
        </Box>
        
        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            ¡Configuración guardada correctamente!
          </Alert>
        )}
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        <Box component="form" sx={{ mt: 2 }}>
          <Typography variant="h6" gutterBottom>
            Configuración del Asistente
          </Typography>
          
          <TextField
            margin="normal"
            fullWidth
            id="wake_word"
            label="Palabra de activación"
            name="wake_word"
            value={preferences.wake_word}
            onChange={handleChange}
            helperText="Palabra que activará el asistente al hablar"
            disabled={loading}
          />
          
          <FormControl fullWidth margin="normal">
            <InputLabel id="voice-type-label">Tipo de voz</InputLabel>
            <Select
              labelId="voice-type-label"
              id="voice_type"
              name="voice_type"
              value={preferences.voice_type}
              onChange={handleChange}
              disabled={loading}
            >
              <MenuItem value="standard">Estándar</MenuItem>
              <MenuItem value="soft">Suave</MenuItem>
              <MenuItem value="serious">Seria</MenuItem>
              <MenuItem value="friendly">Amigable</MenuItem>
            </Select>
          </FormControl>
          
          <Box sx={{ mt: 4, mb: 2 }}>
            <Typography id="voice-speed-slider" gutterBottom>
              Velocidad de voz: {preferences.voice_speed}x
            </Typography>
            <Slider
              aria-labelledby="voice-speed-slider"
              value={preferences.voice_speed}
              onChange={handleSpeedChange}
              step={0.1}
              marks
              min={0.5}
              max={2}
              valueLabelDisplay="auto"
              disabled={loading}
            />
          </Box>
          
          <FormControl fullWidth margin="normal">
            <InputLabel id="theme-label">Tema</InputLabel>
            <Select
              labelId="theme-label"
              id="theme"
              name="theme"
              value={preferences.theme}
              onChange={handleChange}
              disabled={loading}
            >
              <MenuItem value="light">Claro</MenuItem>
              <MenuItem value="dark">Oscuro</MenuItem>
              <MenuItem value="system">Sistema</MenuItem>
            </Select>
          </FormControl>
          
          <Divider sx={{ my: 3 }} />
          
          <Typography variant="h6" gutterBottom>
            Probar síntesis de voz
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <TextField
              fullWidth
              label="Texto de prueba"
              value={testText}
              onChange={(e) => setTestText(e.target.value)}
              sx={{ mr: 2 }}
            />
            <Button
              variant="outlined"
              onClick={handleTestVoice}
              startIcon={<VolumeUp />}
            >
              Probar
            </Button>
          </Box>
          
          {voices.length > 0 && (
            <FormControl fullWidth margin="normal">
              <InputLabel id="browser-voice-label">Voz del navegador</InputLabel>
              <Select
                labelId="browser-voice-label"
                value={selectedVoice ? selectedVoice.name : ''}
                onChange={(e) => {
                  const selected = voices.find(v => v.name === e.target.value);
                  if (selected) changeVoice(selected);
                }}
              >
                {voices.map((voice) => (
                  <MenuItem key={voice.name} value={voice.name}>
                    {voice.name} ({voice.lang})
                  </MenuItem>
                ))}
              </Select>
              <Typography variant="caption" sx={{ mt: 1, color: 'text.secondary' }}>
                Esta configuración solo afecta a la voz utilizada en tu navegador actual.
              </Typography>
            </FormControl>
          )}
          
          <Button
            fullWidth
            variant="contained"
            color="primary"
            onClick={handleSave}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <Save />}
            sx={{ mt: 4 }}
          >
            {loading ? 'Guardando...' : 'Guardar configuración'}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default Settings;