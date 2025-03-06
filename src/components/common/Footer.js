import React from 'react';
import { Box, Container, Typography, Divider } from '@mui/material';

const Footer = () => {
  // Obtengo el año actual para el copyright
  const currentYear = new Date().getFullYear();
  
  return (
    <Box
      component="footer"
      sx={{
        py: 3,
        px: 2,
        mt: 'auto',
        backgroundColor: (theme) =>
          theme.palette.mode === 'light' ? theme.palette.grey[200] : theme.palette.grey[800],
      }}
    >
      <Container maxWidth="lg">
        <Divider sx={{ mb: 3 }} />
        
        <Box 
          sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'center', sm: 'flex-start' }
          }}
        >
          <Box sx={{ mb: { xs: 2, sm: 0 } }}>
            <Typography variant="h6" color="text.primary" gutterBottom>
              IA de aprendizaje UMG Salamá
            </Typography>
          </Box>
          
          <Box 
            sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: { xs: 'center', sm: 'flex-end' }
            }}
          >
            <Typography variant="body2" color="text.secondary">
              IA de aprendizaje UMG Salamá {currentYear}
            </Typography>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;