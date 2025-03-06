import React, { createContext, useState, useEffect } from 'react';
import { assistantAPI } from '../api';
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

  // Efecto para cargar el historial cuando el usuario inicia sesión
  useEffect(() => {
    if (user) {
      fetchHistory();
    } else {
      // Si no hay usuario, limpio el historial
      setConversations([]);
    }
  }, [user]);

  // Método para obtener el historial de conversaciones
  const fetchHistory = async (limit = 50, offset = 0) => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await assistantAPI.getHistory(limit, offset);
      setConversations(response.data.data);
      return response.data;
    } catch (error) {
      setError(error.response?.data?.message || 'Error al obtener historial');
      console.error('Error al obtener historial:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Método para procesar una consulta
  const processQuery = async (query) => {
    setProcessing(true);
    setError(null);
    
    try {
      // Paso 1: Obtener la respuesta del servidor
      const response = await assistantAPI.processQuery(query);
      
      // Paso 2: Para depuración, inspeccionar la estructura real
      console.log("Respuesta del servidor:", response);
      
      // Paso 3: Extraer la respuesta según la estructura
      // La respuesta podría venir directamente o anidada en data
      const responseText = response?.response || 'No se pudo obtener una respuesta';
      
      // Paso 4: Crear la nueva conversación con la estructura correcta
      const newConversation = {
        id: new Date().toISOString(), // Temporal hasta que se actualice con fetchHistory
        query,
        response: responseText,
        source: response?.source,
        confidence: response?.confidence,
        knowledgeId: response?.knowledgeId,
        created_at: new Date().toISOString()
      };
      
      // Paso 5: Actualizar el estado de las conversaciones
      setConversations(prev => [newConversation, ...prev]);
      
      // Paso 6: Si el usuario está autenticado, actualizar el historial
      if (user) {
        fetchHistory();
      }
      
      // Paso 7: Devolver la respuesta procesada para que otros componentes la usen
      return response;
    } catch (error) {
      setError(error.response?.data?.message || 'Error al procesar consulta');
      console.error('Error al procesar consulta:', error);
      return null;
    } finally {
      setProcessing(false);
    }
  };

  // Método para proporcionar feedback a una respuesta
  const provideFeedback = async (conversationId, feedback) => {
    try {
      const response = await assistantAPI.provideFeedback(conversationId, feedback);
      
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
      const response = await assistantAPI.deleteKnowledge(knowledgeId);
      
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