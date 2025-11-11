// contexts/UserContext.tsx (Versión Refactorizada)
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
  signOut: () => Promise<void>;
};

const defaultContext: UserContextType = {
  user: null,
  setUser: () => {},
  loading: true,
  isAuthenticated: false,
  signOut: async () => {},
}; 

const UserContext = createContext<UserContextType>(defaultContext);


export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  // const router = useRouter(); // <-- ELIMINADO

  const fetchUserProfile = useCallback(async (id: string): Promise<Usuario | null> => {
    // ... (la lógica de fetchUserProfile se mantiene igual) ...
    const { data, error } = await supabase.from('usuarios').select('*').eq('id', id).single();
    if (error) { console.error('Error cargando perfil:', error); return null; }
    return data as Usuario;
  }, []); // useCallback es buena práctica aquí

  useEffect(() => {
    let isMounted = true;

    const handleAuthStateChange = async (_event: AuthStateChangeEvent, session: Session | null) => {
        if (!isMounted) return;
        setLoading(true); // Ponemos loading a true mientras procesamos el cambio

        if (session?.user) {
            console.log('Auth state changed: SIGNED_IN (desde listener)');
            const profile = await fetchUserProfile(session.user.id);
            if (isMounted) setUser(profile);
        } else {
            console.log('Auth state changed: SIGNED_OUT (desde listener)');
            setUser(null);
        }
        
        setLoading(false);
    };

    // 1. Cargar el usuario inicial (al cargar la página)
    const loadInitialUser = async () => {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (isMounted) {
            if (authUser) {
                const profile = await fetchUserProfile(authUser.id);
                setUser(profile);
            } else {
                setUser(null);
            }
            setLoading(false);
        }
    };
    
    loadInitialUser();

    // 2. Suscribirse a cambios futuros
    const { data: subscription } = supabase.auth.onAuthStateChange(handleAuthStateChange);

    return () => {
      isMounted = false;
      subscription?.subscription.unsubscribe();
    };
  }, [fetchUserProfile]); // Añadimos fetchUserProfile a deps por buena práctica

  
  const signOut = async () => {
    console.log('Cerrando sesión...');
    // Ya no necesitamos setIsSigningOut ni router.push aquí. 
    // El listener de useEffect se encargará del resto.
    try {
      setLoading(true); // Opcional, pero da feedback inmediato
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
    signOut,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = () => {
  const context = useContext(UserContext);
  return context;
};
