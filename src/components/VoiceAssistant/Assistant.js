import React, { useState, useRef, useEffect } from 'react';
import { 
  Container, 
  Paper, 
  Typography, 
  TextField, 
  Button, 
  Box, 
  Divider, 
  Switch, 
  FormControlLabel,
  CircularProgress,
  Grid,
  Alert
} from '@mui/material';
import { Send, History } from '@mui/icons-material';
import Recorder from './Recorder';
import Response from './Response';
import useAssistant from '../../hooks/useAssistant';
import useSpeech from '../../hooks/useSpeech';
import useAuth from '../../hooks/useAuth';

const Assistant = () => {
  // Estados locales
  const [query, setQuery] = useState('');
  const [currentResponse, setCurrentResponse] = useState(null);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [error, setError] = useState(null);
  
  // Referencia al input de texto
  const inputRef = useRef(null);
  
  // Obtengo funcionalidades del contexto del asistente
  const { processQuery, conversations, loading, processing, error: assistantError } = useAssistant();
  
  // Obtengo funcionalidades de síntesis de voz
  const { speak } = useSpeech();
  
  // Obtengo información del usuario
  const { user } = useAuth();
  
  // Efecto para mostrar errores del contexto
  useEffect(() => {
    if (assistantError) {
      setError(assistantError);
    }
  }, [assistantError]);
  
  // Función para procesar una consulta de texto
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!query.trim()) return;
    
    // Limpiar errores anteriores
    setError(null);
    
    try {
      // No verificamos window.backendConnected, dejamos que la API maneje los errores
      const response = await processQuery(query);
      
      if (response) {
        // Extraer los datos de respuesta adaptándose a la estructura que envía el backend
        const responseData = response.response !== undefined ? response : response.data;
        
        setCurrentResponse({
          query,
          response: responseData.response,
          source: responseData.source,
          confidence: responseData.confidence,
          knowledgeId: responseData.knowledgeId
        });
        
        // Leer la respuesta si está habilitado
        if (autoSpeak) {
          speak(responseData.response);
        }
      } else {
        // Solo mostrar error en la consola, no mostrar notificación
        console.warn('Respuesta vacía del servidor');
        setError('No se pudo obtener una respuesta del servidor. Por favor, intenta de nuevo.');
      }
      
      // Limpio el input
      setQuery('');
      
      // Enfoco nuevamente el input
      if (inputRef.current) {
        inputRef.current.focus();
      }
    } catch (error) {
      console.error('Error al procesar consulta:', error);
      
      // Mostrar error solo en UI local, no en notificación global
      setError('Lo siento, ha ocurrido un error al procesar tu consulta. Por favor, intenta más tarde.');
    }
  };
  
  // Función para procesar una consulta de voz
  const handleVoiceQuery = async (detectedQuery) => {
    setQuery(detectedQuery);
    setError(null);
    
    try {
      console.log(`Procesando consulta por voz: "${detectedQuery}"`);
      
      const response = await processQuery(detectedQuery);
      
      if (response) {
        // Extraer los datos de respuesta adaptándose a la estructura que envía el backend
        const responseData = response.response !== undefined ? response : response.data;
        
        setCurrentResponse({
          query: detectedQuery,
          response: responseData.response,
          source: responseData.source,
          confidence: responseData.confidence,
          knowledgeId: responseData.knowledgeId
        });
        
        // Leer la respuesta siempre cuando viene de voz
        speak(responseData.response);
      } else {
        const message = 'Lo siento, no pude obtener una respuesta. ¿Puedes intentar de nuevo?';
        setError(message);
        speak(message);
      }
    } catch (error) {
      console.error('Error al procesar consulta de voz:', error);
      
      const message = 'Lo siento, ha ocurrido un error al procesar tu consulta. Por favor, intenta más tarde.';
      setError(message);
      speak(message);
    }
  };
  
  // Función para alternar la visualización del historial
  const toggleHistory = () => {
    setShowHistory(!showHistory);
  };
  
  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
        <Typography variant="h4" component="h1" align="center" gutterBottom sx={{ color: 'primary.main' }}>
          Asistente de Voz IA UMG Salamá
        </Typography>
        
        <Typography variant="body1" align="center" sx={{ mb: 3 }}>
          Puedes hablar o escribir tu consulta. Inicia con "asistente umg" para activarlo por voz. 
          {user ? 
            `\nHola ${user.username}, ¿en qué puedo ayudarte hoy?` : 
            '\nInicia sesión para guardar tu historial y personalizar el asistente.'}
        </Typography>
        
        <Divider sx={{ mb: 3 }} />
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        
        <Recorder onQueryDetected={handleVoiceQuery} />
        
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs>
              <TextField
                fullWidth
                label="Escribe tu consulta aquí"
                variant="outlined"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                inputRef={inputRef}
                disabled={processing}
              />
            </Grid>
            <Grid item>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                startIcon={processing ? <CircularProgress size={20} color="inherit" /> : <Send />}
                disabled={!query.trim() || processing}
              >
                Enviar
              </Button>
            </Grid>
          </Grid>
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3, mb: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={autoSpeak}
                onChange={(e) => setAutoSpeak(e.target.checked)}
                color="primary"
              />
            }
            label="Leer respuestas automáticamente"
          />
          
          <Button
            variant="outlined"
            startIcon={<History />}
            onClick={toggleHistory}
            disabled={!user || conversations.length === 0}
          >
            {showHistory ? 'Ocultar historial' : 'Mostrar historial'}
          </Button>
        </Box>
        
        <Divider sx={{ mt: 2, mb: 3 }} />
        
        {/* Muestro la respuesta actual */}
        {currentResponse && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Última respuesta:
            </Typography>
            <Response conversation={currentResponse} autoSpeak={autoSpeak} />
          </Box>
        )}
        
        {/* Muestro el historial si está habilitado */}
        {user && showHistory && (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom>
              Historial de conversaciones:
            </Typography>
            
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                <CircularProgress />
              </Box>
            ) : conversations.length > 0 ? (
              conversations.map((conv) => (
                <Response key={conv.id} conversation={conv} autoSpeak={false} />
              ))
            ) : (
              <Typography variant="body2" sx={{ textAlign: 'center', mt: 2, color: 'text.secondary' }}>
                No hay conversaciones en el historial.
              </Typography>
            )}
          </Box>
        )}
        
        {!user && (
          <Typography variant="body2" sx={{ textAlign: 'center', mt: 3, color: 'text.secondary' }}>
            Inicia sesión para guardar tus conversaciones y obtener respuestas personalizadas.
          </Typography>
        )}
      </Paper>
    </Container>
  );
};

export default Assistant;