// src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '../utils/api';

// Creamos el Contexto de Autenticación
const AuthContext = createContext(null);

// Componente Proveedor de Autenticación
export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Efecto para verificar la sesión al cargar la aplicación
  useEffect(() => {
    const verifyAuth = async () => {
      const token = localStorage.getItem('authToken');
      const role = localStorage.getItem('userRole');

      if (token && role) {
        try {
          // Verificar token con el backend
          const response = await apiService.verifyToken();
          
          if (response.success) {
            setIsAuthenticated(true);
            setUserRole(response.data.user.rol);
            setUserData(response.data);
            
            // Redirige al dashboard correspondiente si está en una ruta pública
            if (window.location.pathname === '/login') {
              navigate(`/${response.data.user.rol}`);
            }
          } else {
            // Token inválido, limpiar localStorage
            localStorage.removeItem('authToken');
            localStorage.removeItem('userRole');
          }
        } catch (error) {
          console.error('Error verificando token:', error);
          // En caso de error, limpiar localStorage
          localStorage.removeItem('authToken');
          localStorage.removeItem('userRole');
        }
      }
      setLoading(false);
    };

    verifyAuth();
  }, [navigate]);

  // Función para manejar el inicio de sesión
  const login = async (username, password, selectedRole) => {
    setLoading(true);
    setUserRole(null);
    setUserData(null);
    
    try {
      // Llamada real al backend
      const response = await apiService.login(username, password, selectedRole);

      if (response.success) {
        const { token, user } = response.data;

        // Guardamos en localStorage
        localStorage.setItem('authToken', token);
        localStorage.setItem('userRole', user.rol);

        // Actualizamos estado
        setIsAuthenticated(true);
        setUserRole(user.rol);
        setUserData(response.data);
        setLoading(false);

        // Redirigimos según el rol
        switch (user.rol) {
          case 'consultor':
            navigate('/consultor');
            break;
          case 'gestora':
            navigate('/gestora');
            break;
          case 'reclutador':
            navigate('/reclutador');
            break;
          default:
            navigate('/');
        }

        return { success: true, role: user.rol };
      } else {
        throw new Error(response.message || 'Error en el inicio de sesión');
      }
    } catch (error) {
      // Limpiamos el estado ante un error
      setIsAuthenticated(false);
      setUserRole(null);
      setUserData(null);
      localStorage.removeItem('authToken');
      localStorage.removeItem('userRole');
      setLoading(false);
      
      return { 
        success: false, 
        error: error.message || 'Error durante el inicio de sesión' 
      };
    }
  };

  // Función para cerrar sesión
  const logout = async () => {
    try {
      // Notificar al backend del logout
      await apiService.logout();
    } catch (error) {
      console.error('Error en logout:', error);
    } finally {
      // Limpiar estado local independientemente del resultado del backend
      setIsAuthenticated(false);
      setUserRole(null);
      setUserData(null);
      localStorage.removeItem('authToken');
      localStorage.removeItem('userRole');
      navigate('/login');
    }
  };

  // Función para obtener información actualizada del usuario
  const refreshUserData = async () => {
    try {
      const response = await apiService.getCurrentUser();
      if (response.success) {
        setUserData(response.data);
        return response.data;
      }
    } catch (error) {
      console.error('Error actualizando datos de usuario:', error);
    }
    return null;
  };

  // Valor que proveerá el contexto
  const contextValue = {
    isAuthenticated,
    userRole,
    userData,
    loading,
    login,
    logout,
    refreshUserData
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {/* Solo renderiza children cuando haya terminado de verificar la autenticación */}
      {!loading && children}
    </AuthContext.Provider>
  );
};

// Hook personalizado para usar el contexto
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};