import React from 'react';
import { Container, Paper, Typography, Box, Button } from '@mui/material';
import { Error as ErrorIcon, Home as HomeIcon } from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';

const NotFound = () => {
  return (
    <Container maxWidth="md" sx={{ mt: 8, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2, textAlign: 'center' }}>
        <ErrorIcon sx={{ fontSize: 80, color: 'error.main', mb: 2 }} />
        
        <Typography variant="h3" component="h1" gutterBottom>
          404
        </Typography>
        
        <Typography variant="h5" component="h2" gutterBottom>
          Página no encontrada
        </Typography>
        
        <Typography variant="body1" sx={{ mb: 4 }}>
          Lo sentimos, la página que estás buscando no existe o ha sido movida.
        </Typography>
        
        <Box sx={{ mt: 3 }}>
          <Button
            component={RouterLink}
            to="/"
            variant="contained"
            color="primary"
            startIcon={<HomeIcon />}
            size="large"
          >
            Volver al inicio
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default NotFound;