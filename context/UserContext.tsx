'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { Usuario } from '@/types/supabase';
import type { AuthChangeEvent as AuthStateChangeEvent, Session } from '@supabase/supabase-js';

type UserContextType = {
  user: Usuario | null;
  setUser: React.Dispatch<React.SetStateAction<Usuario | null>>;
  loading: boolean;
  isAuthenticated: boolean;
  authReady: boolean;
  signOut: () => Promise<void>;
};

const defaultContext: UserContextType = {
  user: null,
  setUser: () => {},
  loading: true,
  isAuthenticated: false,
  authReady: false,
  signOut: async () => {},
};

const UserContext = createContext<UserContextType>(defaultContext);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [authReady, setAuthReady] = useState<boolean>(false);

  const fetchUserProfile = useCallback(async (id: string): Promise<Usuario | null> => {
    const { data, error } = await supabase.from('usuarios').select('*').eq('id', id).single();
    if (error || !data) {
      console.error('Perfil no encontrado o error:', error ?? 'No se encontró el perfil');
      return null;
    }
    return data as Usuario;
  }, []);

  const handleAuthStateChange = useCallback(
    async (_event: AuthStateChangeEvent | 'INITIAL_LOAD', session: Session | null) => {
      

      if (_event === 'TOKEN_REFRESHED') {
        console.log('Token refrescado, manteniendo sesión activa');
        // Si ya hay usuario, no hacemos nada pesado
        if (user) {
          setAuthReady(true);
          return;
        }
        // Si no hay usuario, cargamos perfil como fallback
      }


      setLoading(true);

      if (session?.user) {
        // Evita recargar si ya tenemos el mismo usuario
        if (!user || user?.id !== session.user.id) {
          console.log(`Auth state changed: ${_event}`);
          const profile = await fetchUserProfile(session.user.id);
          if (profile) {
            setUser(profile);
            sessionStorage.setItem('user', JSON.stringify(profile));
          }
        }
      } else {
        console.log(`Auth state changed: ${_event} -> SIGNED_OUT`);
        setUser(null);
        sessionStorage.removeItem('user');
      }

      setLoading(false);
      setAuthReady(true);
    },
    [fetchUserProfile]
  );

  useEffect(() => {
    let isMounted = true;

    // Cargar usuario desde sessionStorage si existe
    const savedUser = sessionStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
      setLoading(false);
      setAuthReady(true);
    }

    // Cargar sesión inicial
    const loadInitialUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (isMounted) {
        await handleAuthStateChange('INITIAL_LOAD', session);
      }
    };

    loadInitialUser();

    // Suscribirse a cambios futuros
    const { data: subscription } = supabase.auth.onAuthStateChange(handleAuthStateChange);

    return () => {
      isMounted = false;
      subscription?.subscription.unsubscribe();
    };
  }, [handleAuthStateChange]);

  const signOut = async () => {
    console.log('Cerrando sesión...');
    try {
      setLoading(true);
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      setLoading(false);
    }
  };

  const value: UserContextType = {
    user,
    setUser,
    loading,
    isAuthenticated: !!user,
    authReady,
    signOut,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = () => useContext(UserContext);
