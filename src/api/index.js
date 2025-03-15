import axios from 'axios';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { Snackbar, Alert } from '@mui/material';
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';

// Estado global de conexión
window.backendConnected = undefined;

// Verifica si la variable de entorno está definida
if (!process.env.REACT_APP_API_URL) {
  console.warn("⚠️ WARNING: REACT_APP_API_URL no está definido en .env. Se usará https://asistente-voz-backend.onrender.com/api por defecto.");
}

// Creo una instancia de axios con la URL base de mi API
const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'https://asistente-voz-backend.onrender.com/api',
  timeout: 10000, // Aumentado a 10 segundos
  headers: {
    'Content-Type': 'application/json'
  }
});

// Añado un interceptor para incluir el token en cada petición
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para manejar errores de conexión
API.interceptors.response.use(
  (response) => {
    // Solo actualizar el estado si era diferente
    if (window.backendConnected !== true) {
      window.backendConnected = true;
    }
    return response;
  },
  (error) => {
    // Solo actualizar el estado si era diferente
    if (window.backendConnected !== false) {
      window.backendConnected = false;
    }
    return Promise.reject(error);
  }
);

// Verificar la conexión inicial al backend sin mostrar notificación 
const checkBackendConnection = async () => {
  try {
    await API.get('/health');
    window.backendConnected = true;
  } catch (error) {
    window.backendConnected = false;
  }
};

// Verificar conexión al cargar (con un pequeño retraso para que la aplicación esté lista)
setTimeout(() => {
  checkBackendConnection();
}, 1000);

// Verificar conexión periódicamente cada 30 segundos
setInterval(() => {
  checkBackendConnection();
}, 30000);

// **🔹 Endpoints del asistente de voz**
export const assistantAPI = {
  processQuery: async (payload) => {
    if (!window.backendConnected) {
      throw new Error("Sin conexión al backend");
    }
    
    try {
      // Si el payload es un string, convertirlo a objeto con query
      const queryPayload = typeof payload === 'string' 
        ? { query: payload } 
        : payload;
      
      console.log('Payload enviado:', queryPayload);
      
      // Enviar la consulta al servidor
      const response = await API.post('/assistant/query', queryPayload);
      
      // Log de depuración completo
      console.log('Respuesta completa del backend:', JSON.stringify(response.data, null, 2));
      
      // Devuelve directamente response.data 
      return response.data;
    } catch (error) {
      console.error("Error al procesar consulta:", error);
      
      // Loguear detalles del error si está disponible
      if (error.response) {
        console.error('Detalles del error del servidor:', JSON.stringify(error.response.data, null, 2));
      }
      
      throw error;
    }
  },

  provideFeedback: async (conversationId, feedback) => {
    if (!window.backendConnected) return { data: { success: false } };
    try {
      return await API.post('/assistant/feedback', { conversationId, feedback });
    } catch (error) {
      console.error("Error al enviar feedback:", error);
      return { data: { success: false } };
    }
  },

  deleteKnowledge: async (knowledgeId) => {
    if (!window.backendConnected) return { data: { success: false } };
    try {
      return await API.delete(`/assistant/knowledge/${knowledgeId}`);
    } catch (error) {
      console.error("Error al eliminar conocimiento:", error);
      return { data: { success: false } };
    }
  },

  getHistory: async (limit = 50, offset = 0) => {
    if (!window.backendConnected) return { data: { data: [], total: 0 } };
    try {
      return await API.get(`/assistant/history?limit=${limit}&offset=${offset}`);
    } catch (error) {
      console.error("Error al obtener historial:", error);
      return { data: { data: [], total: 0 } };
    }
  }
};

// Exportar API principal
export default API;