import { useContext } from 'react';
import { AssistantContext } from '../context/AssistantContext';

// Creo un hook personalizado para acceder fácilmente al contexto del asistente
const useAssistant = () => {
  const context = useContext(AssistantContext);
  
  // Si no existe el contexto, significa que se está usando fuera del AssistantProvider
  if (!context) {
    throw new Error('useAssistant debe ser usado dentro de un AssistantProvider');
  }
  
  return context;
};

export default useAssistant;