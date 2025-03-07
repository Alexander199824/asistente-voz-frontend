import React, { createContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../api';
import { retryApiCall } from '../utils/apiUtils';

// Creo el contexto de autenticación
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // Estados para el usuario autenticado y proceso de carga
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Función para verificar autenticación (usando useCallback para poder usarla en useEffect)
  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem('token');
    
    if (token) {
      try {
        // Usar la función de reintento para mayor robustez
        const response = await retryApiCall(
          authAPI.getProfile,
          [],
          2 // Máximo 2 intentos
        );
        
        if (response && response.data && response.data.data) {
          setUser(response.data.data);
        }
      } catch (error) {
        // Si hay un error, elimino el token (puede haber caducado)
        console.error('Error al obtener perfil:', error);
        localStorage.removeItem('token');
      }
    }
    
    setLoading(false);
  }, []);

  // Efecto para verificar si hay un token al cargar la aplicación
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Método para iniciar sesión
  const login = async (username, password) => {
    setLoading(true);
    setError(null);
    
    try {
      // Usar la función de reintento
      const response = await retryApiCall(
        authAPI.login,
        [username, password],
        2
      );
      
      // Guardo el token en localStorage
      localStorage.setItem('token', response.data.data.token);
      
      // Establezco el usuario autenticado
      setUser(response.data.data.user);
      
      return response.data;
    } catch (error) {
      setError(error.response?.data?.message || 'Error al iniciar sesión');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Método para registrar un nuevo usuario
  const register = async (username, email, password) => {
    setLoading(true);
    setError(null);
    
    try {
      // Usar la función de reintento
      const response = await retryApiCall(
        authAPI.register,
        [username, email, password],
        2
      );
      
      // Guardo el token en localStorage
      localStorage.setItem('token', response.data.data.token);
      
      // Establezco el usuario autenticado
      setUser(response.data.data.user);
      
      return response.data;
    } catch (error) {
      setError(error.response?.data?.message || 'Error al registrarse');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Método para cerrar sesión
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  // Método para actualizar preferencias del usuario
  const updatePreferences = async (preferences) => {
    try {
      // Usar la función de reintento
      const response = await retryApiCall(
        authAPI.updatePreferences,
        [preferences],
        2
      );
      
      // Actualizo el usuario con las nuevas preferencias
      setUser(prevUser => ({
        ...prevUser,
        preferences: response.data.data
      }));
      
      return response.data;
    } catch (error) {
      setError(error.response?.data?.message || 'Error al actualizar preferencias');
      throw error;
    }
  };

  // Proporciono los valores y métodos del contexto
  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    updatePreferences
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};