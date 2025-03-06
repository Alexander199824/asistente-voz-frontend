import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

// Creo un hook personalizado para acceder fácilmente al contexto de autenticación
const useAuth = () => {
  const context = useContext(AuthContext);
  
  // Si no existe el contexto, significa que se está usando fuera del AuthProvider
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  
  return context;
};

export default useAuth;