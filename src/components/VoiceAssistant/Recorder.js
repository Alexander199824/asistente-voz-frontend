import React, { useState, useEffect } from 'react';
import { 
  Button, 
  CircularProgress, 
  Typography, 
  Box, 
  Alert,
  IconButton,
  Tooltip
} from '@mui/material';
import { 
  Mic, 
  MicOff, 
  VolumeUp, 
  VolumeOff 
} from '@mui/icons-material';
import useAuth from '../../hooks/useAuth';
import { 
  isSpeechRecognitionSupported, 
  createSpeechRecognition,
  detectWakeWord,
  removeWakeWord
} from '../../utils/speech';

const Recorder = ({ onQueryDetected }) => {
  // Estados para el grabador
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState(null);
  const [recognition, setRecognition] = useState(null);
  const [supportsSpeech, setSupportsSpeech] = useState(true);
  
  // Obtengo las preferencias del usuario
  const { user } = useAuth();
  const wakeWord = user?.preferences?.wake_word || 'asistente';
  
  // Efecto para inicializar el reconocimiento de voz
  useEffect(() => {
    if (isSpeechRecognitionSupported()) {
      const recognitionInstance = createSpeechRecognition();
      
      // Configuro eventos del reconocimiento
      recognitionInstance.onstart = () => {
        setListening(true);
        setError(null);
      };
      
      recognitionInstance.onend = () => {
        setListening(false);
      };
      
      recognitionInstance.onerror = (event) => {
        setError(`Error en reconocimiento: ${event.error}`);
        setListening(false);
      };
      
      recognitionInstance.onresult = (event) => {
        const result = event.results[0][0];
        const detectedText = result.transcript;
        
        // Actualizo la transcripción
        setTranscript(detectedText);
        
        // Verifico si se ha mencionado la palabra de activación
        if (detectWakeWord(detectedText, wakeWord)) {
          // Elimino la palabra de activación y envío la consulta
          const query = removeWakeWord(detectedText, wakeWord);
          if (query.length > 0) {
            onQueryDetected(query);
          }
        }
      };
      
      setRecognition(recognitionInstance);
    } else {
      setSupportsSpeech(false);
      setError('Tu navegador no soporta reconocimiento de voz');
    }
    
    // Limpio el reconocimiento cuando el componente se desmonta
    return () => {
      if (recognition) {
        recognition.abort();
      }
    };
  }, [wakeWord, onQueryDetected]);
  
  // Función para iniciar la grabación
  const startListening = () => {
    if (recognition && !listening) {
      try {
        recognition.start();
        setTranscript('');
      } catch (err) {
        console.error('Error al iniciar reconocimiento:', err);
      }
    }
  };
  
  // Función para detener la grabación
  const stopListening = () => {
    if (recognition && listening) {
      recognition.stop();
    }
  };
  
  // Si el navegador no soporta reconocimiento de voz
  if (!supportsSpeech) {
    return (
      <Alert severity="warning" sx={{ mt: 2, mb: 2 }}>
        Tu navegador no soporta reconocimiento de voz. Por favor, escribe tu consulta manualmente.
      </Alert>
    );
  }
  
  return (
    <Box sx={{ mt: 3, mb: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <IconButton 
          color={listening ? "error" : "primary"}
          onClick={listening ? stopListening : startListening}
          sx={{ mr: 2 }}
        >
          {listening ? <MicOff fontSize="large" /> : <Mic fontSize="large" />}
        </IconButton>
        
        <Typography variant="body1">
          {listening 
            ? 'Escuchando... Di "' + wakeWord + '" seguido de tu pregunta' 
            : 'Haz clic para hablar'}
        </Typography>
      </Box>
      
      {listening && (
        <CircularProgress 
          size={24} 
          thickness={5} 
          sx={{ mb: 2 }} 
        />
      )}
      
      {transcript && (
        <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1, width: '100%' }}>
          <Typography variant="body1">
            <strong>Texto detectado:</strong> {transcript}
          </Typography>
        </Box>
      )}
      
      {error && (
        <Alert severity="error" sx={{ mt: 2, width: '100%' }}>
          {error}
        </Alert>
      )}
      
      <Tooltip title={`La palabra de activación es: "${wakeWord}"`}>
        <Typography variant="caption" sx={{ mt: 2, color: 'text.secondary' }}>
          Comienza tu consulta con "{wakeWord}" para activar el asistente.
        </Typography>
      </Tooltip>
    </Box>
  );
}

export default Recorder;