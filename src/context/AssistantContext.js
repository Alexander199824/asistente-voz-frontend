import React, { createContext, useState, useEffect, useCallback } from 'react';
import { assistantAPI } from '../api';
import useAuth from '../hooks/useAuth';

export const AssistantContext = createContext();

export const AssistantProvider = ({ children }) => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);
  
  const { user } = useAuth();

  const fetchHistory = useCallback(async (limit = 50, offset = 0) => {
    if (!user) return { data: { data: [], total: 0 } };
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await assistantAPI.getHistory(limit, offset);
      
      if (response && response.data) {
        setConversations(response.data.data || []);
        return response.data;
      } else {
        console.warn('Formato de respuesta inesperado en fetchHistory:', response);
        setConversations([]);
        return { data: { data: [], total: 0 } };
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Error al obtener historial');
      console.error('Error al obtener historial:', error);
      return { data: { data: [], total: 0 } };
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchHistory();
    } else {
      setConversations([]);
    }
  }, [user, fetchHistory]);

  const processQuery = async (query, options = {}) => {
    setProcessing(true);
    setError(null);
    
    try {
      // Preparar payload
      const payload = typeof query === 'string' 
        ? { query, options } 
        : { ...query, options };
      
      console.log('Payload completo:', payload);
      
      // Llamar a la API
      const response = await assistantAPI.processQuery(payload);
      
      console.log('Respuesta del servidor:', JSON.stringify(response, null, 2));
      
      // Extraer datos de la respuesta de manera robusta
      const responseData = response.success ? response.data : response;
      
      const newConversation = {
        id: responseData.id || Date.now().toString(),
        query: typeof query === 'string' ? query : query.query,
        response: responseData.response || 'No se pudo obtener una respuesta',
        source: responseData.source || 'desconocido',
        confidence: responseData.confidence || 0.5,
        awaitingWebSearchConfirmation: responseData.awaitingWebSearchConfirmation || false,
        awaitingUpdateConfirmation: responseData.awaitingUpdateConfirmation || false,
        originalQuery: responseData.originalQuery || query,
        knowledgeId: responseData.knowledgeId || null
      };
      
      // Actualizar conversaciones 
      // Si está esperando confirmación de búsqueda web, mostrar opciones
      // Si no está esperando confirmación, añadir al historial
      if (!newConversation.awaitingWebSearchConfirmation && 
          !newConversation.awaitingUpdateConfirmation) {
        setConversations(prev => [newConversation, ...prev]);
        
        if (user) {
          fetchHistory();
        }
      }
      
      // Devolver datos para componentes
      return {
        response: newConversation.response,
        source: newConversation.source,
        confidence: newConversation.confidence,
        awaitingWebSearchConfirmation: newConversation.awaitingWebSearchConfirmation,
        awaitingUpdateConfirmation: newConversation.awaitingUpdateConfirmation,
        originalQuery: newConversation.originalQuery,
        knowledgeId: newConversation.knowledgeId
      };
    } catch (error) {
      console.error('Error completo al procesar consulta:', error);
      
      // Extraer mensaje de error de manera segura
      const errorMessage = error.response?.data?.message || 
                           error.message || 
                           'Error al procesar consulta';
      
      setError(errorMessage);
      throw error;
    } finally {
      setProcessing(false);
    }
  };

  // Función para manejar la confirmación de búsqueda web
const handleWebSearchConfirmation = async (originalQuery, isConfirmed) => {
  setProcessing(true);
  setError(null);
  
  try {
    console.log('Valor original de isConfirmed:', isConfirmed);
    console.log('Tipo de isConfirmed:', typeof isConfirmed);
    
    // Asegurar que isConfirmed sea booleano
    const confirmedValue = isConfirmed === true || 
                           isConfirmed === 'true' || 
                           isConfirmed === 1 || 
                           isConfirmed === '1';
    
    // Payload simplificado y claro
    const payload = {
      query: originalQuery, 
      options: {
        awaitingWebSearchConfirmation: true,
        isConfirmed: confirmedValue, // Usar el valor booleano normalizado
        originalQuery: originalQuery // Asegurarse de que está disponible
      }
    };
    
    console.log('Payload de confirmación:', payload);
    
    // Llamar a la API
    const response = await assistantAPI.processQuery(payload);
    console.log('Respuesta completa de confirmación:', response);
      
      // Extraer datos de la respuesta
      const responseData = response.success ? response.data : response;
      
      // Actualizar conversaciones
      const newConversation = {
        id: responseData.id || Date.now().toString(),
        query: originalQuery,
        response: responseData.response || 'No se pudo obtener respuesta',
        source: responseData.source || 'desconocido',
        confidence: responseData.confidence || 0.5
      };
      
      setConversations(prev => [newConversation, ...prev]);
      
      if (user) {
        fetchHistory();
      }
      
      return responseData;
    } catch (error) {
      console.error('Error en confirmación:', error);
      setError('Error al procesar la confirmación');
      throw error;
    } finally {
      setProcessing(false);
    }
  };

  const provideFeedback = async (conversationId, feedback) => {
    try {
      const response = await assistantAPI.provideFeedback(conversationId, feedback);
      
      // Actualizar conversación local con feedback
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

  const deleteKnowledge = async (knowledgeId) => {
    try {
      const response = await assistantAPI.deleteKnowledge(knowledgeId);
      
      if (response.data.success && user) {
        // Recargar historial después de eliminar
        fetchHistory();
      }
      
      return response.data;
    } catch (error) {
      setError(error.response?.data?.message || 'Error al eliminar conocimiento');
      console.error('Error al eliminar conocimiento:', error);
      return null;
    }
  };

  const value = {
    conversations,
    loading,
    error,
    processing,
    fetchHistory,
    processQuery,
    handleWebSearchConfirmation,
    provideFeedback,
    deleteKnowledge
  };

  return (
    <AssistantContext.Provider value={value}>
      {children}
    </AssistantContext.Provider>
  );
};

const useAssistant = () => {
  const context = React.useContext(AssistantContext);
  if (!context) {
    throw new Error('useAssistant debe ser usado dentro de un AssistantProvider');
  }
  return context;
};

export default useAssistant;