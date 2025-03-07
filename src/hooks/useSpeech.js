import { useState, useEffect, useRef } from 'react';
import useAuth from './useAuth';

// Hook personalizado para manejar la síntesis de voz
const useSpeech = () => {
  const [speaking, setSpeaking] = useState(false);
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [speechRate, setSpeechRate] = useState(1.0);
  const [audioSupported, setAudioSupported] = useState(true);
  
  // Referencias para manejar la síntesis de voz
  const speechSynthRef = useRef(null);
  const currentUtteranceRef = useRef(null);
  const lastTextRef = useRef('');
  const errorCountRef = useRef(0);
  const isPlayingRef = useRef(false);

  // Obtengo las preferencias del usuario
  const { user } = useAuth();
  
  // Efecto para inicializar las voces disponibles
  useEffect(() => {
    // Verificar la disponibilidad del API de síntesis de voz
    if (!window.speechSynthesis) {
      console.warn("⚠️ Este navegador no soporta SpeechSynthesis API");
      setAudioSupported(false);
      return;
    }

    speechSynthRef.current = window.speechSynthesis;
    
    // Función para obtener las voces disponibles
    const getVoices = () => {
      try {
        const availableVoices = speechSynthRef.current.getVoices();
        // Priorizar voces en español
        const spanishVoices = availableVoices.filter(voice => voice.lang.startsWith('es'));
        const otherVoices = availableVoices.filter(voice => !voice.lang.startsWith('es'));
        
        // Combinar voces en español primero, luego otras
        const sortedVoices = [...spanishVoices, ...otherVoices];
        
        setVoices(sortedVoices);
        
        // Seleccionar voz por defecto
        if (spanishVoices.length > 0) {
          setSelectedVoice(spanishVoices[0]);
          console.log("🔊 Voz en español seleccionada:", spanishVoices[0].name);
        } else if (sortedVoices.length > 0) {
          setSelectedVoice(sortedVoices[0]);
          console.log("🔊 Voz seleccionada por defecto:", sortedVoices[0].name);
        } else {
          console.warn("⚠️ No se encontraron voces disponibles");
        }
      } catch (error) {
        console.error("❌ Error al obtener voces:", error);
        setAudioSupported(false);
      }
    };
    
    // Obtengo las voces inicialmente
    getVoices();
    
    // El evento voiceschanged se dispara cuando las voces están disponibles
    try {
      speechSynthRef.current.onvoiceschanged = getVoices;
    } catch (error) {
      console.error("❌ Error al configurar onvoiceschanged:", error);
    }
    
    // Limpio el evento cuando el componente se desmonta
    return () => {
      try {
        if (speechSynthRef.current) {
          speechSynthRef.current.onvoiceschanged = null;
          speechSynthRef.current.cancel();
          isPlayingRef.current = false;
        }
      } catch (error) {
        console.error("❌ Error en cleanup del hook:", error);
      }
    };
  }, []);
  
  // Efecto para aplicar las preferencias del usuario
  useEffect(() => {
    if (user?.preferences && voices.length > 0) {
      // Aplicar velocidad de voz desde preferencias
      if (user.preferences.voice_speed) {
        setSpeechRate(user.preferences.voice_speed);
      }
      
      // Aplicar tipo de voz desde preferencias (si está disponible)
      if (user.preferences.voice_type) {
        const preferredVoice = voices.find(v => 
          v.name.toLowerCase().includes(user.preferences.voice_type.toLowerCase())
        );
        
        if (preferredVoice) {
          setSelectedVoice(preferredVoice);
        }
      }
    }
  }, [user, voices]);
  
  // Función para intentar usar la API de texto a voz del navegador
  const speakWithAPI = async (text) => {
    return new Promise((resolve, reject) => {
      if (!speechSynthRef.current) {
        reject(new Error("SpeechSynthesis no disponible"));
        return;
      }
      
      // Si el texto es el mismo que el último y hubo errores, no intentamos nuevamente
      if (text === lastTextRef.current && errorCountRef.current > 2) {
        reject(new Error("Demasiados intentos fallidos para el mismo texto"));
        return;
      }
      
      // Si ya estamos reproduciendo, no hacemos nada
      if (isPlayingRef.current) {
        resolve();
        return;
      }
      
      try {
        // Actualizar el último texto reproducido
        lastTextRef.current = text;
        isPlayingRef.current = true;
        
        // Crear una nueva instancia de SpeechSynthesisUtterance
        const utterance = new SpeechSynthesisUtterance(text);
        currentUtteranceRef.current = utterance;
        
        // Aplicar la voz seleccionada si existe
        if (selectedVoice) {
          utterance.voice = selectedVoice;
        }
        
        // Configurar idioma si no se seleccionó voz específica
        if (!utterance.voice) {
          utterance.lang = 'es-ES';
        }
        
        // Aplicar la velocidad
        utterance.rate = speechRate;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        
        // Configurar eventos
        utterance.onstart = () => {
          console.log("⏱️ Síntesis iniciada");
          setSpeaking(true);
        };
        
        utterance.onend = () => {
          console.log("✅ Síntesis completada");
          setSpeaking(false);
          currentUtteranceRef.current = null;
          isPlayingRef.current = false;
          errorCountRef.current = 0; // Reiniciar contador de errores en caso de éxito
          resolve();
        };
        
        utterance.onerror = (event) => {
          console.error("❌ Error en síntesis:", event);
          setSpeaking(false);
          currentUtteranceRef.current = null;
          isPlayingRef.current = false;
          errorCountRef.current++;
          
          // Solo rechazar si no es un error de "interrupción" o "cancelación"
          if (event.error !== 'interrupted' && event.error !== 'canceled') {
            reject(event);
          } else {
            resolve(); // Resolvemos normalmente para interrupciones
          }
        };
        
        // Cancelar síntesis anterior si existe
        speechSynthRef.current.cancel();
        
        // Inicio la síntesis después de un pequeño retraso para asegurar que la cancelación anterior se complete
        setTimeout(() => {
          try {
            speechSynthRef.current.speak(utterance);
          } catch (error) {
            console.error("❌ Error al iniciar la síntesis:", error);
            setSpeaking(false);
            isPlayingRef.current = false;
            errorCountRef.current++;
            reject(error);
          }
        }, 100); // Aumentado a 100ms para dar más tiempo a la cancelación
      } catch (error) {
        console.error("❌ Error en la configuración de síntesis:", error);
        setSpeaking(false);
        isPlayingRef.current = false;
        errorCountRef.current++;
        reject(error);
      }
    });
  };
  
  // Función para hablar un texto
  const speak = async (text) => {
    if (!text || text.trim() === '' || !audioSupported) return;
    
    // Si ya está hablando, detengo la síntesis actual
    if (speaking) {
      stop();
      // Pequeña pausa para asegurar que se detuvo
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    try {
      console.log("Reproduciendo texto:", text.substring(0, 50) + "...");
      await speakWithAPI(text);
    } catch (error) {
      console.error("Error al reproducir texto:", error);
      // Marcamos que no estamos reproduciendo
      setSpeaking(false);
      isPlayingRef.current = false;
    }
  };
  
  // Función para detener la síntesis
  const stop = () => {
    try {
      console.log("🛑 Deteniendo síntesis manualmente");
      
      if (speechSynthRef.current) {
        speechSynthRef.current.cancel();
      }
      
      setSpeaking(false);
      isPlayingRef.current = false;
      currentUtteranceRef.current = null;
    } catch (error) {
      console.error("❌ Error al detener síntesis:", error);
    }
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
    changeRate,
    audioSupported
  };
};

export default useSpeech;