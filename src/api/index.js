import axios from 'axios';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { Snackbar, Alert } from '@mui/material';
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';

// Estado global de conexión
window.backendConnected = undefined;

// Verifica si la variable de entorno está definida
if (!process.env.REACT_APP_API_URL) {
  console.warn("⚠️ WARNING: REACT_APP_API_URL no está definido en .env. Se usará http://localhost:3001/api por defecto.");
}

// Creo una instancia de axios con la URL base de mi API
const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'https://asistente-voz-backend.onrender.com',
  timeout: 5000,
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

// Verificar la conexión inicial al backend sin mostrar notificación (App.js se encargará de esto)
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
      
      // Enviar la consulta al servidor
      const response = await API.post('/assistant/query', queryPayload);
      
      // Devuelve directamente response.data para simplificar el manejo en AssistantContext
      return response.data;
    } catch (error) {
      console.error("Error al procesar consulta:", error);
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
  }
};

// **🔹 Endpoints de autenticación**
export const authAPI = {
  login: async (username, password) => {
    if (!window.backendConnected) {
      throw new Error("Sin conexión al backend");
    }
    try {
      return await API.post('/auth/login', { username, password });
    } catch (error) {
      throw error;
    }
  },

  register: async (username, email, password) => {
    if (!window.backendConnected) {
      throw new Error("Sin conexión al backend");
    }
    try {
      return await API.post('/auth/register', { username, email, password });
    } catch (error) {
      throw error;
    }
  },

  getProfile: async () => {
    if (!window.backendConnected) return null;
    try {
      return await API.get('/auth/profile');
    } catch (error) {
      return null;
    }
  },

  updatePreferences: async (preferences) => {
    if (!window.backendConnected) {
      throw new Error("Sin conexión al backend");
    }
    try {
      return await API.put('/auth/preferences', preferences);
    } catch (error) {
      throw error;
    }
  }
};

// **🔹 Endpoints de administración**
export const adminAPI = {
  updateKnowledge: async (limit = 1) => {
    if (!window.backendConnected) {
      throw new Error("Sin conexión al backend");
    }
    try {
      return await API.post('/admin/update-knowledge', { limit });
    } catch (error) {
      throw error;
    }
  },

  updateSingleKnowledge: async (knowledgeId) => {
    if (!window.backendConnected) {
      throw new Error("Sin conexión al backend");
    }
    try {
      return await API.post(`/admin/update-knowledge/${knowledgeId}`);
    } catch (error) {
      throw error;
    }
  },

  listKnowledge: async (page = 1, limit = 10) => {
    if (!window.backendConnected) return { data: { data: [], total: 0, limit } };
    try {
      return await API.get(`/admin/knowledge?page=${page}&limit=${limit}`);
    } catch (error) {
      console.error("Error al listar conocimientos:", error);
      return { data: { data: [], total: 0, limit } };
    }
  },

  clearKnowledgeBase: async () => {
    if (!window.backendConnected) {
      throw new Error("Sin conexión al backend");
    }
    try {
      return await API.post('/admin/clear-knowledge');
    } catch (error) {
      throw error;
    }
  }
};

// Exportar API principal
export default API;