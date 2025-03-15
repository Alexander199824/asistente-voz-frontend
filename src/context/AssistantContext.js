import React, { createContext, useState, useEffect, useCallback } from 'react';
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

  // Método para procesar una consulta
  const processQuery = async (query, options = {}) => {
    setProcessing(true);
    setError(null);
    
    try {
      // Preparar el payload según el tipo de consulta
      let payload;
      
      if (typeof query === 'string') {
        // Consulta simple
        payload = { query };
      } else {
        // Es un objeto (caso menos común)
        payload = query;
      }
      
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
      const responseData = response?.data || response;
      
      // Extraer los valores relevantes
      const responseText = responseData.response || 'No se pudo obtener una respuesta';
      const source = responseData.source || 'desconocido';
      const confidence = responseData.confidence || 0.5;
      const knowledgeId = responseData.knowledgeId || null;
      const awaitingWebSearchConfirmation = responseData.awaitingWebSearchConfirmation || false;
      const awaitingUpdateConfirmation = responseData.awaitingUpdateConfirmation || false;
      const originalQuery = responseData.originalQuery || null;
      
      // Crear la nueva conversación con la estructura correcta
      const newConversation = {
        id: responseData.id || new Date().toISOString(), // Temporal hasta que se actualice con fetchHistory
        query: typeof query === 'string' ? query : query.query,
        response: responseText,
        source,
        confidence,
        knowledgeId,
        created_at: responseData.created_at || new Date().toISOString(),
        
        // Nuevos campos para manejo de confirmaciones
        awaitingWebSearchConfirmation,
        awaitingUpdateConfirmation,
        originalQuery
      };
      
      // Actualizar el estado de las conversaciones solo si no es una respuesta de confirmación
      // que requiere acción adicional del usuario
      if (!awaitingWebSearchConfirmation && !awaitingUpdateConfirmation) {
        setConversations(prev => [newConversation, ...prev]);
        
        // Si el usuario está autenticado, actualizar el historial
        if (user) {
          fetchHistory();
        }
      }
      
      // Devolver la respuesta procesada para que otros componentes la usen
      // En un formato consistente
      return {
        response: responseText,
        source,
        confidence,
        knowledgeId,
        awaitingWebSearchConfirmation,
        awaitingUpdateConfirmation,
        originalQuery
      };
    } catch (error) {
      setError(error.response?.data?.message || 'Error al procesar consulta');
      console.error('Error al procesar consulta:', error);
      throw error; // Re-lanzar el error para que los componentes puedan manejarlo
    } finally {
      setProcessing(false);
    }
  };

  // Método para proporcionar retroalimentación a una respuesta
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

// Hook personalizado para usar el contexto del asistente
const useAssistant = () => {
  const context = React.useContext(AssistantContext);
  if (!context) {
    throw new Error('useAssistant debe ser usado dentro de un AssistantProvider');
  }
  return context;
};

export default useAssistant;