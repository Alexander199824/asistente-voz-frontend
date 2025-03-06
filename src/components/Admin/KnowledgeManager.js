import React, { useState, useEffect, useCallback } from 'react';
import { 
  Container, 
  Paper, 
  Typography, 
  Box, 
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Pagination,
  CircularProgress,
  Alert,
  TextField,
  InputAdornment,
  Divider,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle
} from '@mui/material';
import { 
  Storage as StorageIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Add as AddIcon
} from '@mui/icons-material';
import API from '../../api';

const KnowledgeManager = () => {
  // Estados
  const [knowledgeItems, setKnowledgeItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmDelete, setConfirmDelete] = useState({
    open: false,
    id: null
  });
  
  // Función para obtener la lista de conocimientos
  const fetchKnowledge = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await API.get(`/admin/knowledge?page=${page}&limit=10`);
      setKnowledgeItems(response.data.data);
      setTotalPages(Math.ceil(response.data.total / response.data.limit));
    } catch (error) {
      console.error('Error al obtener conocimientos:', error);
      setError('No se pudieron cargar los conocimientos. Intenta de nuevo más tarde.');
    } finally {
      setLoading(false);
    }
  }, [page]);
  
  // Efecto para cargar los datos inicialmente
  useEffect(() => {
    fetchKnowledge();
  }, [fetchKnowledge]);
  
  // Función para actualizar un conocimiento específico
  const handleUpdateItem = async (knowledgeId) => {
    setLoading(true);
    
    try {
      await API.post(`/admin/update-knowledge/${knowledgeId}`);
      fetchKnowledge(); // Recargo la lista después de actualizar
    } catch (error) {
      console.error('Error al actualizar conocimiento:', error);
      setError('Error al actualizar el conocimiento');
    } finally {
      setLoading(false);
    }
  };
  
  // Función para abrir diálogo de confirmación de eliminación
  const openDeleteConfirm = (id) => {
    setConfirmDelete({
      open: true,
      id
    });
  };
  
  // Función para cerrar diálogo de confirmación de eliminación
  const closeDeleteConfirm = () => {
    setConfirmDelete({
      open: false,
      id: null
    });
  };
  
  // Función para eliminar un conocimiento
  const handleDeleteItem = async () => {
    if (!confirmDelete.id) return;
    
    setLoading(true);
    
    try {
      // Implementación del backend para eliminar conocimiento
      await API.delete(`/assistant/knowledge/${confirmDelete.id}`);
      
      closeDeleteConfirm();
      fetchKnowledge();
    } catch (error) {
      console.error('Error al eliminar conocimiento:', error);
      setError('Error al eliminar el conocimiento');
      closeDeleteConfirm();
    } finally {
      setLoading(false);
    }
  };
  
  // Función para buscar
  const handleSearch = (e) => {
    e.preventDefault();
    // Idealmente, deberíamos tener una API para buscar en el backend
    // Por ahora, solo actualizamos el estado de búsqueda y volvemos a la página 1
    setPage(1);
    fetchKnowledge();
  };
  
  // Función para cambiar de página
  const handlePageChange = (event, value) => {
    setPage(value);
  };
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <StorageIcon sx={{ mr: 2, color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            Gestor de Conocimientos
          </Typography>
        </Box>
        
        <Typography variant="body1" paragraph>
          Administra los conocimientos disponibles para el asistente de voz. Puedes actualizar, editar o eliminar elementos.
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Box component="form" onSubmit={handleSearch} sx={{ display: 'flex', gap: 2 }}>
            <TextField
              size="small"
              placeholder="Buscar conocimiento..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
            <Button type="submit" variant="outlined">
              Buscar
            </Button>
          </Box>
          
          <Box>
            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={() => fetchKnowledge()}
              disabled={loading}
              sx={{ mr: 1 }}
            >
              Actualizar
            </Button>
            
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              disabled={loading}
            >
              Nuevo
            </Button>
          </Box>
        </Box>
        
        <Divider sx={{ mb: 3 }} />
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : knowledgeItems.length > 0 ? (
          <>
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Consulta</TableCell>
                    <TableCell>Fuente</TableCell>
                    <TableCell>Fecha</TableCell>
                    <TableCell>Confianza</TableCell>
                    <TableCell align="center">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {knowledgeItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.id}</TableCell>
                      <TableCell>{item.query}</TableCell>
                      <TableCell>
                        <Chip 
                          label={item.source || 'Desconocida'} 
                          size="small"
                          color={item.source === 'user' ? 'primary' : 'default'}
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(item.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {item.confidence ? `${Math.round(item.confidence * 100)}%` : 'N/A'}
                      </TableCell>
                      <TableCell align="center">
                        <IconButton 
                          color="primary"
                          onClick={() => handleUpdateItem(item.id)}
                          title="Actualizar"
                        >
                          <RefreshIcon />
                        </IconButton>
                        <IconButton 
                          color="secondary"
                          title="Editar"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton 
                          color="error"
                          onClick={() => openDeleteConfirm(item.id)}
                          title="Eliminar"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={handlePageChange}
                color="primary"
              />
            </Box>
          </>
        ) : (
          <Alert severity="info">
            No hay conocimientos disponibles. Intenta añadir nuevos elementos o actualizar la base de conocimientos.
          </Alert>
        )}
      </Paper>
      
      {/* Diálogo de confirmación de eliminación */}
      <Dialog
        open={confirmDelete.open}
        onClose={closeDeleteConfirm}
      >
        <DialogTitle>Confirmar eliminación</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Estás seguro de que deseas eliminar este conocimiento? Esta acción no se puede deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteConfirm} color="primary">
            Cancelar
          </Button>
          <Button onClick={handleDeleteItem} color="error" autoFocus>
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default KnowledgeManager;