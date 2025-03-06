import React, { useEffect } from 'react';
import { 
  Paper, 
  Typography, 
  Box, 
  IconButton, 
  Chip,
  Divider,
  Tooltip
} from '@mui/material';
import { 
  VolumeUp, 
  ThumbUp, 
  ThumbDown,
  Delete,
  InfoOutlined 
} from '@mui/icons-material';
import useAssistant from '../../hooks/useAssistant';
import useSpeech from '../../hooks/useSpeech';
import useAuth from '../../hooks/useAuth';

const Response = ({ conversation, autoSpeak = false }) => {
  // Obtengo funcionalidades del contexto del asistente
  const { provideFeedback, deleteKnowledge } = useAssistant();
  
  // Obtengo la funcionalidad de síntesis de voz
  const { speak, speaking } = useSpeech();
  
  // Verifico si el usuario está autenticado
  const { user } = useAuth();
  
  // Efecto para hablar automáticamente la respuesta si autoSpeak está activado
  useEffect(() => {
    if (autoSpeak && conversation && conversation.response) {
      speak(conversation.response);
    }
  }, [conversation, autoSpeak, speak]);
  
  // Si no hay conversación, no muestro nada
  if (!conversation) return null;
  
  // Función para manejar la reproducción de voz
  const handleSpeak = () => {
    speak(conversation.response);
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
          <Tooltip title="Escuchar respuesta">
            <IconButton onClick={handleSpeak} color={speaking ? "secondary" : "default"}>
              <VolumeUp />
            </IconButton>
          </Tooltip>
        </Box>
        
        {user && (
          <Box>
            <Tooltip title="Me gusta esta respuesta">
              <IconButton 
                onClick={handlePositiveFeedback}
                color={conversation.feedback === 1 ? "success" : "default"}
              >
                <ThumbUp />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="No me gusta esta respuesta">
              <IconButton 
                onClick={handleNegativeFeedback}
                color={conversation.feedback === -1 ? "error" : "default"}
              >
                <ThumbDown />
              </IconButton>
            </Tooltip>
            
            {conversation.knowledge_id && (
              <Tooltip title="Eliminar esta respuesta de la base de conocimiento">
                <IconButton onClick={handleDeleteKnowledge} color="warning">
                  <Delete />
                </IconButton>
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