import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  IconButton,
  Tooltip,
  Divider,
  Paper
} from '@mui/material';
import {
  Search,
  Update,
  CloudOff,
  Info
} from '@mui/icons-material';

/**
 * Componente para mostrar solicitudes de confirmación al usuario
 * @param {Object} props - Propiedades del componente
 * @param {string} props.type - Tipo de confirmación ('search' o 'update')
 * @param {string} props.query - Consulta original que generó la solicitud
 * @param {function} props.onConfirm - Función para manejar confirmación
 * @param {function} props.onReject - Función para manejar rechazo
 * @param {string} props.responseText - Texto de la respuesta que solicita confirmación
 */
const ConfirmationPrompt = ({ 
  type = 'search', 
  query, 
  onConfirm, 
  onReject, 
  responseText 
}) => {
  // Determinar el icono y el mensaje adecuados según el tipo de confirmación
  const getIconAndTitle = () => {
    switch (type) {
      case 'search':
        return {
          icon: <Search color="primary" />,
          title: '¿Deseas buscar esta información en fuentes externas?',
          subtitle: 'El asistente puede buscar en Internet o usar inteligencia artificial para encontrar una respuesta.'
        };
      case 'update':
        return {
          icon: <Update color="primary" />,
          title: '¿Deseas actualizar esta información?',
          subtitle: 'El asistente intentará obtener datos más recientes sobre este tema.'
        };
      default:
        return {
          icon: <Info color="primary" />,
          title: '¿Deseas continuar?',
          subtitle: 'El asistente necesita tu confirmación para proceder.'
        };
    }
  };

  const { icon, title, subtitle } = getIconAndTitle();

  return (
    <Paper
      elevation={2}
      sx={{
        mb: 3,
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        overflow: 'hidden'
      }}
    >
      <Box sx={{ bgcolor: 'background.default', p: 2, display: 'flex', alignItems: 'center' }}>
        <Box sx={{ mr: 2 }}>
          {icon}
        </Box>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h6">{title}</Typography>
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        </Box>
      </Box>
      
      <Divider />
      
      <CardContent>
        {responseText && (
          <Typography variant="body2" paragraph>
            {responseText}
          </Typography>
        )}
        
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          mt: 2, 
          flexWrap: 'wrap',
          gap: 1 
        }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={type === 'search' ? <Search /> : <Update />}
            onClick={onConfirm}
          >
            {type === 'search' ? 'Sí, buscar' : 'Sí, actualizar'}
          </Button>
          
          <Button
            variant="outlined"
            color="inherit"
            startIcon={<CloudOff />}
            onClick={onReject}
          >
            No, gracias
          </Button>
        </Box>
        
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
          Consulta original: "{query}"
        </Typography>
      </CardContent>
    </Paper>
  );
};

export default ConfirmationPrompt;