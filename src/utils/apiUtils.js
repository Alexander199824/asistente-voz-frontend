// Función de utilidad para reintentar llamadas API
export const retryApiCall = async (apiFunction, params = [], maxRetries = 3, delay = 1000) => {
    let lastError = null;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        // Esperar un tiempo creciente entre intentos (excepto el primero)
        if (attempt > 0) {
          await new Promise(resolve => setTimeout(resolve, delay * attempt));
        }
        
        // Llamar a la función API con los parámetros proporcionados
        const result = await apiFunction(...params);
        return result;
      } catch (error) {
        console.error(`Intento ${attempt + 1}/${maxRetries} fallido:`, error.message);
        lastError = error;
        
        // Si el error no es de conexión, no tiene sentido reintentar
        if (error.response && error.response.status !== 0 && error.response.status !== 408 && error.response.status !== 504) {
          throw error;
        }
      }
    }
    
    // Si llegamos aquí, todos los intentos fallaron
    console.error(`Todos los ${maxRetries} intentos fallaron.`);
    throw lastError;
  };
  
  // Función para verificar si hay conexión a Internet
  export const checkInternetConnection = () => {
    return window.navigator.onLine;
  };
  
  // Función para esperar un tiempo determinado
  export const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));