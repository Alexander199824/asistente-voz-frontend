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
  Alert,
  IconButton,
  Chip
} from '@mui/material';
import { 
  Send, 
  History, 
  VolumeUp, 
  VolumeOff
} from '@mui/icons-material';
import Recorder from './Recorder';
import Response from './Response';
import ConfirmationPrompt from './ConfirmationPrompt';
import ProcessingIndicator from './ProcessingIndicator';
import useAssistant from '../../hooks/useAssistant';
import useSpeech from '../../hooks/useSpeech';
import useAuth from '../../hooks/useAuth';

const EnhancedAssistant = () => {
  // Estados locales
  const [query, setQuery] = useState('');
  const [currentResponse, setCurrentResponse] = useState(null);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [error, setError] = useState(null);
  const [isWaitingForConfirmation, setIsWaitingForConfirmation] = useState(false);
  const [originalQuery, setOriginalQuery] = useState('');
  const [confirmationType, setConfirmationType] = useState(null); // 'search' o 'update'
  const [knowledgeIdToUpdate, setKnowledgeIdToUpdate] = useState(null);
  
  // Referencia al input de texto
  const inputRef = useRef(null);
  
  // Obtengo funcionalidades del contexto del asistente
  const { 
    processQuery, 
    handleWebSearchConfirmation, 
    conversations, 
    loading, 
    processing, 
    error: assistantError 
  } = useAssistant();
  
  // Obtengo funcionalidades de síntesis de voz
  const { speak, speaking, stop, audioSupported } = useSpeech();
  
  // Obtengo información del usuario
  const { user } = useAuth();
  
  // Efecto para mostrar errores del contexto
  useEffect(() => {
    if (assistantError) {
      setError(assistantError);
    }
  }, [assistantError]);
  
  // Efecto para enfocar el input cuando sea posible
  useEffect(() => {
    if (inputRef.current && !processing && !isWaitingForConfirmation) {
      inputRef.current.focus();
    }
  }, [processing, isWaitingForConfirmation]);

  // Función para verificar si una respuesta es afirmativa
  const isAffirmativeResponse = (response) => {
    const affirmativePatterns = [
      /^s[ií]/i,             // "si", "sí"
      /^y[eo]s/i,            // "yes", "yep"
      /^claro/i,             // "claro"
      /^por supuesto/i,      // "por supuesto"
      /^ok/i,                // "ok"
      /^busc[ao]/i,          // "busca", "busco"
      /^actualiza/i,         // "actualiza", "actualizar"
      /^hazlo/i,             // "hazlo"
      /^adelante/i,          // "adelante"
      /^dale/i,              // "dale"
    ];
    
    return affirmativePatterns.some(pattern => pattern.test(response.trim().toLowerCase()));
  };

  // Función para procesar una consulta de texto
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!query.trim()) return;
    
    // Limpiar errores anteriores
    setError(null);

    // Si estamos esperando confirmación, manejar diferente
    if (isWaitingForConfirmation) {
      await handleConfirmationResponse();
      return;
    }
    
    try {
      // Procesar la consulta normal
      const response = await processQuery(query);
      
      if (response) {
        // Verificar si la respuesta está esperando una confirmación
        if (response.awaitingWebSearchConfirmation) {
          handleSearchConfirmation(response, query);
        } else if (response.awaitingUpdateConfirmation) {
          handleUpdateConfirmation(response, query);
        } else {
          // Respuesta normal
          setCurrentResponse({
            query,
            response: response.response,
            source: response.source,
            confidence: response.confidence,
            knowledgeId: response.knowledgeId
          });
          
          // Leer la respuesta si está habilitado
          if (autoSpeak) {
            speak(response.response);
          }
          
          // Resetear estados de confirmación
          resetConfirmationState();
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

  // Función para manejar confirmaciones de búsqueda
  const handleSearchConfirmation = (responseData, originalQueryText) => {
    setCurrentResponse({
      query: originalQueryText,
      response: responseData.response,
      source: responseData.source,
      confidence: responseData.confidence
    });
    
    // Establecer estado de espera de confirmación
    setIsWaitingForConfirmation(true);
    setConfirmationType('search');
    setOriginalQuery(responseData.originalQuery || originalQueryText);
    
    // Leer la respuesta que pide confirmación
    if (autoSpeak) {
      speak(responseData.response);
    }
  };

  // Función para manejar confirmaciones de actualización
  const handleUpdateConfirmation = (responseData, originalQueryText) => {
    setCurrentResponse({
      query: originalQueryText,
      response: responseData.response,
      source: responseData.source,
      confidence: responseData.confidence,
      knowledgeId: responseData.knowledgeId
    });
    
    // Establecer estado de espera de confirmación
    setIsWaitingForConfirmation(true);
    setConfirmationType('update');
    setOriginalQuery(responseData.originalQuery || originalQueryText);
    setKnowledgeIdToUpdate(responseData.knowledgeId);
    
    // Leer la respuesta que pide confirmación
    if (autoSpeak) {
      speak(responseData.response);
    }
  };

  // Función para manejar la respuesta a una confirmación
  const handleConfirmationResponse = async () => {
    // Detectar si es una respuesta afirmativa o negativa
    const isAffirmative = isAffirmativeResponse(query);
    
    try {
      // Usar el nuevo método de confirmación de búsqueda web
      const response = await handleWebSearchConfirmation(
        originalQuery,    // Consulta original
        isAffirmative     // Confirmación (sí/no)
      );
      
      if (response) {
        setCurrentResponse({
          query: originalQuery,
          response: response.response,
          source: response.source,
          confidence: response.confidence
        });
        
        // Leer la respuesta final
        if (autoSpeak) {
          speak(response.response);
        }
      }
      
      // Restablecer el estado de confirmación
      resetConfirmationState();
      
      // Limpiar el input y darle foco
      setQuery('');
      if (inputRef.current) {
        inputRef.current.focus();
      }
    } catch (error) {
      console.error('Error al procesar confirmación:', error);
      setError('Ocurrió un error al procesar tu respuesta. Por favor, intenta de nuevo.');
      resetConfirmationState();
    }
  };

  // Función para resetear el estado de confirmación
const resetConfirmationState = () => {
  setIsWaitingForConfirmation(false);
  setOriginalQuery('');
  setConfirmationType(null);
  setKnowledgeIdToUpdate(null);
  
  // Opcionalmente, puedes agregar un pequeño retraso antes de enfocar el input
  // para asegurar que la UI se haya actualizado correctamente
  setTimeout(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, 100);
};

  // Función para procesar una consulta de voz
  const handleVoiceQuery = async (detectedQuery) => {
    setQuery(detectedQuery);
    
    // Si estamos esperando confirmación, procesar como confirmación
    if (isWaitingForConfirmation) {
      const isAffirmative = isAffirmativeResponse(detectedQuery);
      
      try {
        const response = await handleWebSearchConfirmation(
          originalQuery,    // Consulta original
          isAffirmative     // Confirmación (sí/no)
        );
        
        if (response) {
          setCurrentResponse({
            query: originalQuery,
            response: response.response,
            source: response.source,
            confidence: response.confidence
          });
          
          // Leer la respuesta final
          speak(response.response);
        }
        
        // Restablecer el estado de confirmación
        resetConfirmationState();
        
        // Limpiar el input
        setQuery('');
      } catch (error) {
        console.error('Error al procesar confirmación por voz:', error);
        setError('Ocurrió un error al procesar tu respuesta. Por favor, intenta de nuevo.');
        resetConfirmationState();
      }
      
      return;
    }
    
    // Limpiar errores anteriores
    setError(null);
    
    try {
      console.log(`Procesando consulta por voz: "${detectedQuery}"`);
      
      const response = await processQuery(detectedQuery);
      
      if (response) {
        // Verificar si la respuesta está esperando una confirmación
        if (response.awaitingWebSearchConfirmation) {
          handleSearchConfirmation(response, detectedQuery);
        } else if (response.awaitingUpdateConfirmation) {
          handleUpdateConfirmation(response, detectedQuery);
        } else {
          // Respuesta normal
          setCurrentResponse({
            query: detectedQuery,
            response: response.response,
            source: response.source,
            confidence: response.confidence,
            knowledgeId: response.knowledgeId
          });
          
          // Leer la respuesta siempre cuando viene de voz
          speak(response.response);
        }
      } else {
        const message = 'Lo siento, no pude obtener una respuesta. ¿Puedes intentar de nuevo?';
        setError(message);
        speak(message);
      }
      
      // Limpiar input si no estamos esperando confirmación
      if (!response.awaitingWebSearchConfirmation && !response.awaitingUpdateConfirmation) {
        setQuery('');
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

 // Función para manejar click en botones de confirmación
// En src/components/VoiceAssistant/EnhancedAssistant.js
// Reemplaza la función handleConfirmationButtonClick por esta versión

// Función para manejar click en botones de confirmación
const handleConfirmationButtonClick = async (isConfirm) => {
  // Convertir explícitamente a booleano
  const confirmValue = Boolean(isConfirm);
  
  try {
    // Procesamiento directo con el contexto
    const response = await handleWebSearchConfirmation(
      originalQuery,   // Consulta original
      confirmValue     // Valor booleano de confirmación
    );
    
    if (response) {
      // Actualizar la UI inmediatamente con la respuesta
      setCurrentResponse({
        query: originalQuery,
        response: response.response,
        source: response.source,
        confidence: response.confidence,
        knowledgeId: response.knowledgeId
      });
      
      // Reproducir respuesta si es necesario
      if (autoSpeak) {
        speak(response.response);
      }
      
      // Limpiar UI y estado
      resetConfirmationState();
      setQuery('');
    }
  } catch (error) {
    console.error('Error en confirmación:', error);
    setError('Error al procesar la confirmación');
    resetConfirmationState();
  }
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
        
        {/* Si está procesando, mostrar indicador */}
        {processing && !isWaitingForConfirmation && (
          <ProcessingIndicator 
            query={originalQuery || query} 
            isSearching={confirmationType === 'search'}
          />
        )}
        
        {/* Si está esperando confirmación, mostrar un componente de confirmación */}
        {isWaitingForConfirmation && (
          <ConfirmationPrompt
            type={confirmationType}
            query={originalQuery}
            responseText={currentResponse?.response}
            onConfirm={() => handleConfirmationButtonClick(true)}
            onReject={() => handleConfirmationButtonClick(false)}
          />
        )}
        
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs>
              <TextField
                fullWidth
                label={isWaitingForConfirmation 
                  ? "Confirma si deseas continuar con la búsqueda..." 
                  : "Escribe tu consulta aquí"}
                variant="outlined"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                inputRef={inputRef}
                disabled={processing}
                placeholder={isWaitingForConfirmation 
                  ? "Responde 'sí' para continuar o 'no' para cancelar" 
                  : "¿Qué deseas saber?"}
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
        
        {/* Muestro la respuesta actual con indicadores de estado */}
        {currentResponse && (
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="h6">
                Última respuesta:
              </Typography>
              
              {/* Información adicional como fuente y confianza */}
              <Box sx={{ display: 'flex', gap: 1 }}>
                {currentResponse.source && (
                  <Chip 
                    size="small" 
                    label={currentResponse.source} 
                    color={currentResponse.source === 'user' ? 'primary' : 'default'}
                  />
                )}
                
                {audioSupported && (
                  <IconButton 
                    onClick={() => speaking ? stop() : speak(currentResponse.response)} 
                    size="small"
                    color={speaking ? "secondary" : "default"}
                  >
                    {speaking ? <VolumeOff /> : <VolumeUp />}
                  </IconButton>
                )}
              </Box>
            </Box>
            
            <Response 
              conversation={currentResponse} 
              autoSpeak={autoSpeak} 
            />
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

export default EnhancedAssistant;