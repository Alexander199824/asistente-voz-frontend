import React, { useEffect, useState } from 'react';
import { 
  Container, 
  Paper, 
  Typography, 
  Box, 
  CircularProgress, 
  Pagination,
  Alert,
  Divider,
  Button,
  IconButton,
  TextField,
  InputAdornment
} from '@mui/material';
import { 
  History as HistoryIcon, 
  Delete as DeleteIcon,
  Search as SearchIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import useAssistant from '../../hooks/useAssistant';
import Response from '../VoiceAssistant/Response';

const History = () => {
  // Estados locales
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredConversations, setFilteredConversations] = useState([]);
  
  // Obtengo información del usuario
  const { user } = useAuth();
  
  // Obtengo funcionalidades del contexto del asistente
  const { conversations, loading, fetchHistory } = useAssistant();
  
  // Hook para navegación
  const navigate = useNavigate();
  
  // Efecto para cargar el historial cuando se monta el componente
  useEffect(() => {
    if (user) {
      fetchHistory(50, 0); // Cargar un historial amplio para permitir filtrado local
    } else {
      // Si no hay usuario autenticado, redireccionar al login
      navigate('/login');
    }
  }, [user, fetchHistory, navigate]);
  
  // Efecto para filtrar conversaciones cuando cambia la búsqueda o las conversaciones
  useEffect(() => {
    if (conversations.length > 0) {
      let filtered = [...conversations];
      
      // Aplicar filtro de búsqueda si hay una consulta
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(
          conv => 
            conv.query.toLowerCase().includes(query) || 
            conv.response.toLowerCase().includes(query)
        );
      }
      
      // Actualizar las conversaciones filtradas
      setFilteredConversations(filtered);
      
      // Calcular el total de páginas
      setTotalPages(Math.ceil(filtered.length / limit));
    } else {
      setFilteredConversations([]);
      setTotalPages(1);
    }
  }, [conversations, searchQuery, limit]);
  
  // Función para manejar el cambio de página
  const handlePageChange = (event, value) => {
    setPage(value);
  };
  
  // Función para limpiar los filtros
  const handleClearFilter = () => {
    setSearchQuery('');
  };
  
  // Si el usuario no está autenticado, mostrar mensaje
  if (!user) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="warning">
          Debes iniciar sesión para acceder al historial de conversaciones.
        </Alert>
      </Container>
    );
  }
  
  // Calcular las conversaciones para la página actual
  const paginatedConversations = filteredConversations.slice(
    (page - 1) * limit,
    page * limit
  );
  
  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <HistoryIcon sx={{ mr: 2, color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            Historial de Conversaciones
          </Typography>
        </Box>
        
        <Typography variant="body1" sx={{ mb: 3 }}>
          Revisa tu historial de consultas y respuestas con el asistente.
        </Typography>
        
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            label="Buscar en el historial"
            variant="outlined"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: searchQuery && (
                <InputAdornment position="end">
                  <IconButton onClick={handleClearFilter} edge="end">
                    <DeleteIcon />
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
        </Box>
        
        <Divider sx={{ mb: 3 }} />
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : filteredConversations.length > 0 ? (
          <>
            {paginatedConversations.map((conversation) => (
              <Response key={conversation.id} conversation={conversation} />
            ))}
            
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={handlePageChange}
                color="primary"
              />
            </Box>
          </>
        ) : (
          <Alert severity="info" sx={{ my: 2 }}>
            No se encontraron conversaciones{searchQuery ? ' con el filtro aplicado' : ''}.
          </Alert>
        )}
      </Paper>
    </Container>
  );
};

export default History;