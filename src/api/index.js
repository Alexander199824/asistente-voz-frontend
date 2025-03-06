import axios from 'axios';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { Snackbar, Alert } from '@mui/material';
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';

// Estado global de conexión
window.backendConnected = false;

// Verifica si la variable de entorno está definida
if (!process.env.REACT_APP_API_URL) {
  console.warn("⚠️ WARNING: REACT_APP_API_URL no está definido en .env. Se usará http://localhost:3001/api por defecto.");
}

// Creo una instancia de axios con la URL base de mi API
const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001/api',
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
    window.backendConnected = true;
    return response;
  },
  (error) => {
    window.backendConnected = false;
    showConnectionNotification(false, "No hay conexión con el servidor.");
    return Promise.reject(error);
  }
);

// Mostrar notificación de conexión exitosa al inicio
const checkBackendConnection = async () => {
  try {
    await API.get('/health');
    window.backendConnected = true;
    showConnectionNotification(true, "Conexión exitosa con el backend");
  } catch (error) {
    window.backendConnected = false;
    showConnectionNotification(false, "No se pudo conectar al servidor.");
  }
};

// Componente para mostrar notificación
const ConnectionNotification = () => {
  const [open, setOpen] = useState(true);
  const [success, setSuccess] = useState(true);
  const [message, setMessage] = useState('');

  const theme = createTheme();
  
  const handleClose = () => {
    setOpen(false);
  };

  window.updateConnectionStatus = (isSuccess, msg) => {
    setSuccess(isSuccess);
    setMessage(msg || (isSuccess ? "Conexión exitosa con el backend" : "Error al conectar con el backend"));
    setOpen(true);
  };

  return (
    <ThemeProvider theme={theme}>
      <Snackbar 
        open={open} 
        autoHideDuration={6000} 
        onClose={handleClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleClose} 
          severity={success ? "success" : "error"}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {message}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
};

// Función para mostrar la notificación
const showConnectionNotification = (success, message) => {
  let notificationRoot = document.getElementById('connection-notification');
  if (!notificationRoot) {
    notificationRoot = document.createElement('div');
    notificationRoot.id = 'connection-notification';
    document.body.appendChild(notificationRoot);
    const root = ReactDOM.createRoot(notificationRoot);
    root.render(<ConnectionNotification />);
  }

  if (window.updateConnectionStatus) {
    window.updateConnectionStatus(success, message);
  }
};

// Verificar conexión al cargar
setTimeout(() => {
  checkBackendConnection();
}, 1000);

// Verificar conexión periódicamente cada 30 segundos
setInterval(() => {
  checkBackendConnection();
}, 30000);

// **🔹 Endpoints del asistente de voz**
export const assistantAPI = {
  processQuery: async (query) => {
    if (!window.backendConnected) {
      showConnectionNotification(false, "No hay conexión con el servidor.");
      throw new Error("Sin conexión al backend");
    }
    try {
      const response = await API.post('/assistant/query', { query });
      // Devuelve directamente response.data para simplificar el manejo en AssistantContext
      return response.data;
    } catch (error) {
      showConnectionNotification(false, "No puedo responder en este momento.");
      throw error;
    }
  },
  
  getHistory: async (limit = 50, offset = 0) => {
    if (!window.backendConnected) return { data: { data: [] } };
    try {
      return await API.get(`/assistant/history?limit=${limit}&offset=${offset}`);
    } catch (error) {
      console.error("Error al obtener historial:", error);
      return { data: { data: [] } };
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
      showConnectionNotification(false, "No hay conexión con el servidor.");
      throw new Error("Sin conexión al backend");
    }
    try {
      return await API.post('/auth/login', { username, password });
    } catch (error) {
      showConnectionNotification(false, "No puedo iniciar sesión.");
      throw error;
    }
  },

  register: async (username, email, password) => {
    if (!window.backendConnected) {
      showConnectionNotification(false, "No hay conexión con el servidor.");
      throw new Error("Sin conexión al backend");
    }
    try {
      return await API.post('/auth/register', { username, email, password });
    } catch (error) {
      showConnectionNotification(false, "No puedo registrarte.");
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
      showConnectionNotification(false, "No hay conexión con el servidor.");
      throw new Error("Sin conexión al backend");
    }
    try {
      return await API.put('/auth/preferences', preferences);
    } catch (error) {
      showConnectionNotification(false, "No puedo actualizar las preferencias.");
      throw error;
    }
  }
};

// **🔹 Endpoints de administración**
export const adminAPI = {
  updateKnowledge: async (limit = 1) => {
    if (!window.backendConnected) {
      showConnectionNotification(false, "No hay conexión con el servidor.");
      throw new Error("Sin conexión al backend");
    }
    try {
      return await API.post('/admin/update-knowledge', { limit });
    } catch (error) {
      showConnectionNotification(false, "No puedo actualizar la base de conocimiento.");
      throw error;
    }
  },

  updateSingleKnowledge: async (knowledgeId) => {
    if (!window.backendConnected) {
      showConnectionNotification(false, "No hay conexión con el servidor.");
      throw new Error("Sin conexión al backend");
    }
    try {
      return await API.post(`/admin/update-knowledge/${knowledgeId}`);
    } catch (error) {
      showConnectionNotification(false, "No puedo actualizar el conocimiento.");
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
      showConnectionNotification(false, "No hay conexión con el servidor.");
      throw new Error("Sin conexión al backend");
    }
    try {
      return await API.post('/admin/clear-knowledge');
    } catch (error) {
      showConnectionNotification(false, "No puedo limpiar la base de conocimiento.");
      throw error;
    }
  }
};

// Exportar API principal
export default API;