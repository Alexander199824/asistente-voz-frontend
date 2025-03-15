import axios from 'axios';

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

// **🔹 Endpoints de autenticación**
export const authAPI = {
  login: async (username, password) => {
    try {
      return await API.post('/auth/login', { username, password });
    } catch (error) {
      console.error("Error al iniciar sesión:", error);
      throw error;
    }
  },

  register: async (username, email, password) => {
    try {
      return await API.post('/auth/register', { username, email, password });
    } catch (error) {
      console.error("Error al registrar:", error);
      throw error;
    }
  },

  getProfile: async () => {
    try {
      return await API.get('/auth/profile');
    } catch (error) {
      console.error("Error al obtener perfil:", error);
      throw error;
    }
  },

  updatePreferences: async (preferences) => {
    try {
      return await API.put('/auth/preferences', preferences);
    } catch (error) {
      console.error("Error al actualizar preferencias:", error);
      throw error;
    }
  }
};

// **🔹 Endpoints del asistente de voz**
export const assistantAPI = {
  processQuery: async (payload) => {
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
    try {
      return await API.post('/assistant/feedback', { conversationId, feedback });
    } catch (error) {
      console.error("Error al enviar feedback:", error);
      throw error;
    }
  },

  deleteKnowledge: async (knowledgeId) => {
    try {
      return await API.delete(`/assistant/knowledge/${knowledgeId}`);
    } catch (error) {
      console.error("Error al eliminar conocimiento:", error);
      throw error;
    }
  },

  getHistory: async (limit = 50, offset = 0) => {
    try {
      return await API.get(`/assistant/history?limit=${limit}&offset=${offset}`);
    } catch (error) {
      console.error("Error al obtener historial:", error);
      throw error;
    }
  }
};

// **🔹 Endpoints de administración**
export const adminAPI = {
  updateKnowledge: async (limit = 1) => {
    try {
      return await API.post('/admin/update-knowledge', { limit });
    } catch (error) {
      console.error("Error al actualizar conocimiento:", error);
      throw error;
    }
  },

  listKnowledge: async (page = 1, limit = 10) => {
    try {
      return await API.get(`/admin/knowledge?page=${page}&limit=${limit}`);
    } catch (error) {
      console.error("Error al listar conocimientos:", error);
      throw error;
    }
  },

  clearKnowledgeBase: async () => {
    try {
      return await API.post('/admin/clear-knowledge');
    } catch (error) {
      console.error("Error al limpiar base de conocimientos:", error);
      throw error;
    }
  }
};

// Exportar API principal
export default API;