import { useState, useEffect } from 'react';
import useAuth from './useAuth';

// Hook personalizado para manejar la síntesis de voz
const useSpeech = () => {
  const [speaking, setSpeaking] = useState(false);
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [speechRate, setSpeechRate] = useState(1.0);
  
  // Obtengo las preferencias del usuario
  const { user } = useAuth();
  
  // Efecto para inicializar las voces disponibles
  useEffect(() => {
    // Función para obtener las voces disponibles
    const getVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices().filter(voice => voice.lang.startsWith('es'));
      setVoices(availableVoices);
      
      // Seleccionar voz por defecto
      if (availableVoices.length > 0) {
        setSelectedVoice(availableVoices[0]);
      }
    };
    
    // Obtengo las voces inicialmente
    getVoices();
    
    // El evento voiceschanged se dispara cuando las voces están disponibles
    window.speechSynthesis.onvoiceschanged = getVoices;
    
    // Limpio el evento cuando el componente se desmonta
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);
  
  // Efecto para aplicar las preferencias del usuario
  useEffect(() => {
    if (user?.preferences) {
      // Aplicar velocidad de voz desde preferencias
      if (user.preferences.voice_speed) {
        setSpeechRate(user.preferences.voice_speed);
      }
      
      // Aplicar tipo de voz desde preferencias (si está disponible)
      if (user.preferences.voice_type && voices.length > 0) {
        const preferredVoice = voices.find(v => 
          v.name.toLowerCase().includes(user.preferences.voice_type.toLowerCase())
        );
        
        if (preferredVoice) {
          setSelectedVoice(preferredVoice);
        }
      }
    }
  }, [user, voices]);
  
  // Función para hablar un texto
  const speak = (text) => {
    // Si ya está hablando, detengo la síntesis actual
    if (speaking) {
      window.speechSynthesis.cancel();
    }
    
    if (!text) return;
    
    // Creo una nueva instancia de SpeechSynthesisUtterance
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Aplico la voz seleccionada si existe
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    
    // Aplico la velocidad
    utterance.rate = speechRate;
    
    // Configuro eventos
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    
    // Inicio la síntesis
    window.speechSynthesis.speak(utterance);
  };
  
  // Función para detener la síntesis
  const stop = () => {
    window.speechSynthesis.cancel();
    setSpeaking(false);
  };
  
  // Función para cambiar la voz
  const changeVoice = (voice) => {
    setSelectedVoice(voice);
  };
  
  // Función para cambiar la velocidad
  const changeRate = (rate) => {
    setSpeechRate(rate);
  };
  
  return {
    speak,
    stop,
    speaking,
    voices,
    selectedVoice,
    changeVoice,
    speechRate,
    changeRate
  };
};

export default useSpeech;