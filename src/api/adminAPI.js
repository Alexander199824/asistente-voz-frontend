// Importo la instancia de axios
import API from './index';

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

  updateSingleKnowledge: async (knowledgeId) => {
    try {
      return await API.post(`/admin/update-knowledge/${knowledgeId}`);
    } catch (error) {
      console.error("Error al actualizar conocimiento específico:", error);
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

export default adminAPI;