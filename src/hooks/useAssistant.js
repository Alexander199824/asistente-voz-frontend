import React, { createContext, useState, useEffect, useCallback, useContext } from 'react';
import { assistantAPI } from '../api';
import { retryApiCall } from '../utils/apiUtils';
import useAuth from '../hooks/useAuth';

// Creo el contexto del asistente de voz
export const AssistantContext = createContext();

export const AssistantProvider = ({ children }) => {
  // Estados para el asistente
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);
  
  // Obtengo el usuario del contexto de autenticación
  const { user } = useAuth();

  // Método para obtener el historial de conversaciones (usando useCallback)
  const fetchHistory = useCallback(async (limit = 50, offset = 0) => {
    if (!user) return { data: [] };
    
    setLoading(true);
    setError(null);
    
    try {
      // Usar la función de reintento para mayor robustez
      const response = await retryApiCall(
        assistantAPI.getHistory,
        [limit, offset],
        2 // Máximo 2 intentos
      );
      
      if (response && response.data && response.data.data) {
        setConversations(response.data.data);
        return response.data;
      } else {
        console.warn('Formato de respuesta inesperado en fetchHistory:', response);
        setConversations([]);
        return { data: [] };
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Error al obtener historial');
      console.error('Error al obtener historial:', error);
      return { data: [] };
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Efecto para cargar el historial cuando el usuario inicia sesión
  useEffect(() => {
    if (user) {
      fetchHistory();
    } else {
      // Si no hay usuario, limpio el historial
      setConversations([]);
    }
  }, [user, fetchHistory]);

  // Método para procesar una consulta con opciones para confirmaciones
  const processQuery = async (query, options = {}) => {
    setProcessing(true);
    setError(null);
    
    try {
      // Verificar si es una respuesta de confirmación basada en las opciones
      const payload = { query };
      
      // Si hay opciones de confirmación, añadirlas al payload
      if (options.awaitingWebSearchConfirmation) {
        payload.options = {
          awaitingWebSearchConfirmation: true,
          originalQuery: options.originalQuery
        };
      } else if (options.awaitingUpdateConfirmation) {
        payload.options = {
          awaitingUpdateConfirmation: true,
          originalQuery: options.originalQuery,
          knowledgeId: options.knowledgeId
        };
      }
      
      // Usar la función de reintento
      const response = await retryApiCall(
        assistantAPI.processQuery,
        [payload],
        2 // Máximo 2 intentos
      );
      
      // Para depuración, inspeccionar la estructura real
      console.log("Respuesta del servidor:", response);
      
      // Extraer la respuesta según la estructura
      // La respuesta podría venir directamente o anidada en data
      const responseText = response?.response || response?.data?.response || 'No se pudo obtener una respuesta';
      
      // Crear la nueva conversación con la estructura correcta
      const newConversation = {
        id: response?.id || new Date().toISOString(), // Temporal hasta que se actualice con fetchHistory
        query,
        response: responseText,
        source: response?.source || response?.data?.source,
        confidence: response?.confidence || response?.data?.confidence,
        knowledgeId: response?.knowledgeId || response?.data?.knowledgeId,
        created_at: response?.created_at || new Date().toISOString(),
        
        // Nuevos campos para manejo de confirmaciones
        awaitingWebSearchConfirmation: response?.awaitingWebSearchConfirmation || response?.data?.awaitingWebSearchConfirmation,
        awaitingUpdateConfirmation: response?.awaitingUpdateConfirmation || response?.data?.awaitingUpdateConfirmation,
        originalQuery: response?.originalQuery || response?.data?.originalQuery
      };
      
      // Actualizar el estado de las conversaciones solo si no es una respuesta de confirmación
      if (!newConversation.awaitingWebSearchConfirmation && !newConversation.awaitingUpdateConfirmation) {
        setConversations(prev => [newConversation, ...prev]);
        
        // Si el usuario está autenticado, actualizar el historial
        if (user) {
          fetchHistory();
        }
      }
      
      // Devolver la respuesta procesada para que otros componentes la usen
      return response;
    } catch (error) {
      setError(error.response?.data?.message || 'Error al procesar consulta');
      console.error('Error al procesar consulta:', error);
      throw error; // Re-lanzar el error para que los componentes puedan manejarlo
    } finally {
      setProcessing(false);
    }
  };

  // Método para proporcionar feedback a una respuesta
  const provideFeedback = async (conversationId, feedback) => {
    try {
      // Usar la función de reintento
      const response = await retryApiCall(
        assistantAPI.provideFeedback,
        [conversationId, feedback],
        2
      );
      
      // Actualizo el estado de la conversación con el nuevo feedback
      setConversations(prev => 
        prev.map(conv => 
          conv.id === conversationId ? { ...conv, feedback } : conv
        )
      );
      
      return response.data;
    } catch (error) {
      setError(error.response?.data?.message || 'Error al proporcionar feedback');
      console.error('Error al proporcionar feedback:', error);
      return null;
    }
  };

  // Método para eliminar un conocimiento
  const deleteKnowledge = async (knowledgeId) => {
    try {
      // Usar la función de reintento
      const response = await retryApiCall(
        assistantAPI.deleteKnowledge,
        [knowledgeId],
        2
      );
      
      // Actualizo el historial después de eliminar
      if (response.data.success && user) {
        fetchHistory();
      }
      
      return response.data;
    } catch (error) {
      setError(error.response?.data?.message || 'Error al eliminar conocimiento');
      console.error('Error al eliminar conocimiento:', error);
      return null;
    }
  };

  // Proporciono los valores y métodos del contexto
  const value = {
    conversations,
    loading,
    error,
    processing,
    fetchHistory,
    processQuery,
    provideFeedback,
    deleteKnowledge
  };

  return (
    <AssistantContext.Provider value={value}>
      {children}
    </AssistantContext.Provider>
  );
};

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