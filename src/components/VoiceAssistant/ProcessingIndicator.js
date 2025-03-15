import React from 'react';
import { 
  Box, 
  Typography, 
  CircularProgress, 
  Paper,
  LinearProgress
} from '@mui/material';

/**
 * Componente para mostrar un indicador visualmente atractivo cuando el asistente está procesando
 * @param {Object} props - Propiedades del componente
 * @param {string} props.query - Consulta que se está procesando
 * @param {boolean} props.isSearching - Si está realizando una búsqueda externa (opcional)
 */
const ProcessingIndicator = ({ query, isSearching = false }) => {
  // Mensajes para diferentes estados de procesamiento
  const messages = isSearching ? [
    "Buscando información en fuentes externas...",
    "Consultando bases de datos...",
    "Analizando resultados de búsqueda...",
    "Procesando la información encontrada...",
    "Preparando respuesta detallada..."
  ] : [
    "Procesando tu consulta...",
    "Analizando la pregunta...",
    "Buscando en la base de conocimientos...",
    "Preparando respuesta..."
  ];

  // Seleccionar un mensaje aleatorio pero consistente para esta consulta
  // Usamos una función hash simple basada en la consulta
  const getHashCode = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0; // Convertir a entero de 32 bits
    }
    return Math.abs(hash);
  };

  const messageIndex = getHashCode(query) % messages.length;
  const message = messages[messageIndex];

  return (
    <Paper 
      elevation={1}
      sx={{ 
        p: 2, 
        display: 'flex', 
        alignItems: 'center', 
        mb: 3,
        borderRadius: 2,
        bgcolor: 'background.paper'
      }}
    >
      <CircularProgress size={24} thickness={4} sx={{ mr: 2 }} />
      <Box sx={{ width: '100%' }}>
        <Typography variant="body1">{message}</Typography>
        <LinearProgress sx={{ mt: 1, borderRadius: 1 }} />
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          Procesando: "{query.length > 50 ? query.substring(0, 50) + '...' : query}"
        </Typography>
      </Box>
    </Paper>
  );
};

export default ProcessingIndicator;