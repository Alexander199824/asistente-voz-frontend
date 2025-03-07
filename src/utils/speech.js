// Verifico si el navegador soporta reconocimiento de voz
export const isSpeechRecognitionSupported = () => {
  return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
};

// Creo una instancia del reconocimiento de voz
export const createSpeechRecognition = () => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  
  if (!SpeechRecognition) {
    return null;
  }
  
  const recognition = new SpeechRecognition();
  
  // Configuro el reconocimiento
  recognition.continuous = false; // No es continuo por defecto
  recognition.lang = 'es-ES';     // Idioma en español
  recognition.interimResults = false; // Solo resultados finales
  recognition.maxAlternatives = 1;    // Solo la mejor coincidencia
  
  return recognition;
};

// Verifico si la síntesis de voz está soportada
export const isSpeechSynthesisSupported = () => {
  return 'speechSynthesis' in window;
};

// Obtengo las voces disponibles
export const getAvailableVoices = () => {
  if (!isSpeechSynthesisSupported()) {
    return [];
  }
  
  return window.speechSynthesis.getVoices();
};

// Detecto menciones de la palabra de activación (wake word)
export const detectWakeWord = (text, wakeWord = 'asistente') => {
  if (!text || !wakeWord) return false;
  
  // Normalizo el texto y la palabra de activación
  const normalizedText = text.toLowerCase().trim();
  const normalizedWakeWord = wakeWord.toLowerCase().trim();
  
  // Verifico si el texto contiene la palabra de activación
  return normalizedText.includes(normalizedWakeWord);
};

// Elimino la palabra de activación del texto
export const removeWakeWord = (text, wakeWord = 'asistente') => {
  if (!text || !wakeWord) return text;
  
  // Normalizo el texto y la palabra de activación
  const normalizedText = text.toLowerCase().trim();
  const normalizedWakeWord = wakeWord.toLowerCase().trim();
  
  // Reemplazo la palabra de activación con una cadena vacía
  let result = normalizedText;
  
  // Usar una expresión regular para encontrar la palabra de activación
  // incluso si está al principio, medio o final del texto
  const regex = new RegExp(`\\b${normalizedWakeWord}\\b`, 'gi');
  result = result.replace(regex, '').trim();
  
  return result;
};