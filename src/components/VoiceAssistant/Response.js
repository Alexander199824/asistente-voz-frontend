import React, { useEffect, useState, useRef } from 'react';
import { 
  Paper, 
  Typography, 
  Box, 
  IconButton, 
  Chip,
  Divider,
  Tooltip,
  CircularProgress
} from '@mui/material';
import { 
  VolumeUp, 
  VolumeOff,
  ThumbUp, 
  ThumbDown,
  Delete,
  InfoOutlined 
} from '@mui/icons-material';
import useAssistant from '../../hooks/useAssistant';
import useSpeech from '../../hooks/useSpeech';
import useAuth from '../../hooks/useAuth';

const Response = ({ conversation, autoSpeak = false }) => {
  // Estado para controlar errores de voz
  const [voiceError, setVoiceError] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  
  // Ref para evitar reproducción duplicada
  const hasAutoplayedRef = useRef(false);
  const conversationIdRef = useRef(null);
  
  // Obtengo funcionalidades del contexto del asistente
  const { provideFeedback, deleteKnowledge } = useAssistant();
  
  // Obtengo la funcionalidad de síntesis de voz
  const { speak, stop, speaking, audioSupported } = useSpeech();
  
  // Verifico si el usuario está autenticado
  const { user } = useAuth();
  
  // Efecto para actualizar el ID de referencia cuando cambia la conversación
  // Esto ayuda a evitar intentos duplicados de reproducción
  useEffect(() => {
    if (conversation?.id !== conversationIdRef.current) {
      conversationIdRef.current = conversation?.id;
      hasAutoplayedRef.current = false;
    }
  }, [conversation?.id]);
  
  // Efecto para hablar automáticamente la respuesta si autoSpeak está activado
  useEffect(() => {
    let isMounted = true;
    
    const playAudio = async () => {
      // Solo reproducir automáticamente si:
      // 1. autoSpeak está activado
      // 2. Hay una conversación con respuesta
      // 3. No ha habido un error previo
      // 4. El audio está soportado
      // 5. No se ha reproducido ya este mismo texto (usando ID como referencia)
      // 6. La conversación tiene un ID (para evitar respuestas temporales)
      if (autoSpeak && 
          conversation && 
          conversation.response && 
          !voiceError && 
          audioSupported && 
          !hasAutoplayedRef.current &&
          conversation.id) {
        
        // Marcamos que ya intentamos reproducir esta respuesta
        hasAutoplayedRef.current = true;
        
        try {
          setIsPlayingAudio(true);
          console.log("Reproduciendo automáticamente respuesta:", 
                     conversation.response.substring(0, 30) + "...");
          await speak(conversation.response);
        } catch (error) {
          if (isMounted) {
            setVoiceError(true);
            console.error("Error al reproducir respuesta automáticamente:", error);
          }
        } finally {
          if (isMounted) {
            setIsPlayingAudio(false);
          }
        }
      }
    };
    
    playAudio();
    
    return () => {
      isMounted = false;
      // Detener el audio si se desmonta el componente
      stop();
    };
  }, [conversation?.id]); // Dependencia específica al ID
  
  // Si no hay conversación, no muestro nada
  if (!conversation) return null;
  
  // Función para manejar la reproducción de voz
  const handleSpeak = async () => {
    setVoiceError(false);
    
    if (speaking) {
      stop();
      setIsPlayingAudio(false);
    } else {
      try {
        setIsPlayingAudio(true);
        await speak(conversation.response);
      } catch (error) {
        setVoiceError(true);
        console.error("Error al reproducir respuesta:", error);
      } finally {
        setIsPlayingAudio(false);
      }
    }
  };
  
  // Función para manejar el feedback positivo
  const handlePositiveFeedback = () => {
    if (user && conversation.id) {
      provideFeedback(conversation.id, 1);
    }
  };
  
  // Función para manejar el feedback negativo
  const handleNegativeFeedback = () => {
    if (user && conversation.id) {
      provideFeedback(conversation.id, -1);
    }
  };
  
  // Función para eliminar un conocimiento
  const handleDeleteKnowledge = () => {
    if (user && conversation.knowledge_id) {
      deleteKnowledge(conversation.knowledge_id);
    }
  };
  
  // Determino el color del chip según la fuente de la respuesta
  const getSourceColor = (source) => {
    switch (source) {
      case 'user':
        return 'primary';
      case 'web':
        return 'secondary';
      case 'system':
        return 'default';
      default:
        return 'default';
    }
  };
  
  return (
    <Paper 
      elevation={3} 
      sx={{ 
        p: 2, 
        mb: 3, 
        borderRadius: 2,
        borderLeft: '4px solid',
        borderColor: 'primary.main',
        position: 'relative'
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
        <Typography 
          variant="subtitle1" 
          component="div" 
          sx={{ fontWeight: 'bold', flexGrow: 1 }}
        >
          Tu consulta:
        </Typography>
        
        <Box>
          {conversation.source && (
            <Tooltip title={`Fuente: ${conversation.source}`}>
              <Chip 
                size="small"
                label={conversation.source}
                color={getSourceColor(conversation.source)}
                sx={{ mr: 1 }}
              />
            </Tooltip>
          )}
          
          {conversation.confidence && (
            <Tooltip title="Nivel de confianza">
              <Chip 
                size="small"
                label={`${Math.round(conversation.confidence * 100)}%`}
                variant="outlined"
              />
            </Tooltip>
          )}
        </Box>
      </Box>
      
      <Typography variant="body1" sx={{ ml: 2, mb: 2 }}>
        {conversation.query}
      </Typography>
      
      <Divider sx={{ my: 1 }} />
      
      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mt: 2 }}>
        Respuesta:
      </Typography>
      
      <Typography variant="body1" sx={{ ml: 2, mt: 1 }}>
        {conversation.response}
      </Typography>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2, pt: 1 }}>
        <Box>
          {audioSupported ? (
            <Tooltip title={speaking ? "Detener reproducción" : "Escuchar respuesta"}>
              {isPlayingAudio && !speaking ? (
                <span>
                  <IconButton disabled>
                    <CircularProgress size={24} />
                  </IconButton>
                </span>
              ) : (
                <IconButton 
                  onClick={handleSpeak} 
                  color={speaking ? "secondary" : "default"}
                >
                  {speaking ? <VolumeOff /> : <VolumeUp />}
                </IconButton>
              )}
            </Tooltip>
          ) : (
            <Tooltip title="Síntesis de voz no disponible en este navegador">
              <span>
                <IconButton disabled>
                  <VolumeOff />
                </IconButton>
              </span>
            </Tooltip>
          )}
        </Box>
        
        {user && (
          <Box>
            <Tooltip title="Me gusta esta respuesta">
              <span>
                <IconButton 
                  onClick={handlePositiveFeedback}
                  color={conversation.feedback === 1 ? "success" : "default"}
                >
                  <ThumbUp />
                </IconButton>
              </span>
            </Tooltip>
            
            <Tooltip title="No me gusta esta respuesta">
              <span>
                <IconButton 
                  onClick={handleNegativeFeedback}
                  color={conversation.feedback === -1 ? "error" : "default"}
                >
                  <ThumbDown />
                </IconButton>
              </span>
            </Tooltip>
            
            {conversation.knowledge_id && (
              <Tooltip title="Eliminar esta respuesta de la base de conocimiento">
                <span>
                  <IconButton onClick={handleDeleteKnowledge} color="warning">
                    <Delete />
                  </IconButton>
                </span>
              </Tooltip>
            )}
          </Box>
        )}
      </Box>
      
      {conversation.created_at && (
        <Typography 
          variant="caption" 
          sx={{ 
            display: 'block', 
            textAlign: 'right', 
            mt: 1, 
            color: 'text.secondary' 
          }}
        >
          {new Date(conversation.created_at).toLocaleString()}
        </Typography>
      )}
    </Paper>
  );
};

export default Response;