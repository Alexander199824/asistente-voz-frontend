// Recorder.js - Corregido para evitar errores de "aborted" en reconocimiento de voz
import React, { useState, useEffect, useRef } from 'react';
import { Typography, Box, Alert, IconButton, Tooltip, CircularProgress } from '@mui/material';
import { Mic, MicOff } from '@mui/icons-material';
import useAuth from '../../hooks/useAuth';
import { isSpeechRecognitionSupported, createSpeechRecognition, detectWakeWord, removeWakeWord } from '../../utils/speech';

const Recorder = ({ onQueryDetected }) => {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState(null);
  const [supportsSpeech, setSupportsSpeech] = useState(true);
  const recognitionRef = useRef(null);
  const { user } = useAuth();
  const wakeWord = user?.preferences?.wake_word || 'asistente';

  useEffect(() => {
    if (isSpeechRecognitionSupported()) {
      const recognitionInstance = createSpeechRecognition();
      if (recognitionInstance) {
        recognitionInstance.onstart = () => {
          console.log('Reconocimiento de voz iniciado');
          setListening(true);
          setError(null);
        };
        recognitionInstance.onend = () => {
          console.log('Reconocimiento de voz finalizado');
          setListening(false);
        };
        recognitionInstance.onerror = (event) => {
          if (event.error === 'aborted') {
            console.warn('⚠️ Reconocimiento interrumpido. Reiniciando...');
            return;
          }
          console.error(`❌ Error en reconocimiento: ${event.error}`);
          setError(`Error en reconocimiento: ${event.error}`);
          setListening(false);
        };
        recognitionInstance.onresult = (event) => {
          if (event.results.length > 0) {
            const result = event.results[0][0];
            const detectedText = result.transcript;
            console.log('Texto detectado:', detectedText);
            setTranscript(detectedText);
            if (detectWakeWord(detectedText, wakeWord)) {
              console.log('Palabra de activación detectada:', wakeWord);
              const query = removeWakeWord(detectedText, wakeWord);
              if (query.length > 0) {
                console.log('Consulta procesada:', query);
                onQueryDetected(query);
              }
            }
          }
        };
        recognitionRef.current = recognitionInstance;
      } else {
        console.error('No se pudo crear instancia de reconocimiento de voz');
        setSupportsSpeech(false);
        setError('No se pudo inicializar el reconocimiento de voz');
      }
    } else {
      console.warn('El navegador no soporta reconocimiento de voz');
      setSupportsSpeech(false);
      setError('Tu navegador no soporta reconocimiento de voz');
    }
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (err) {
          console.error('Error al abortar reconocimiento:', err);
        }
      }
    };
  }, [wakeWord, onQueryDetected]);

  const startListening = () => {
    if (recognitionRef.current && !listening) {
      try {
        recognitionRef.current.start();
        setTranscript('');
      } catch (err) {
        console.error('Error al iniciar reconocimiento:', err);
        setError(`Error al iniciar grabación: ${err.message}`);
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && listening) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.error('Error al detener reconocimiento:', err);
      }
    }
  };

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
        <IconButton color={listening ? "error" : "primary"} onClick={listening ? stopListening : startListening} sx={{ mr: 2 }}>
          {listening ? <MicOff fontSize="large" /> : <Mic fontSize="large" />}
        </IconButton>
        <Typography variant="body1">
          {listening ? 'Escuchando... Di "' + wakeWord + '" seguido de tu pregunta' : 'Haz clic para hablar'}
        </Typography>
      </Box>
      {listening && <CircularProgress size={24} thickness={5} sx={{ mb: 2 }} />}
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
    </Box>
  );
};

export default Recorder;
