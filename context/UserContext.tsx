'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef
} from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import type { Usuario } from '@/types/supabase';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';

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
  signOut: async () => {}
};

const UserContext = createContext<UserContextType>(defaultContext);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();

  const [user, setUser] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [authReady, setAuthReady] = useState<boolean>(false);

  const initializeAuthCalled = useRef<boolean>(false);
  const lastUserIdRef = useRef<string | null>(null);
  const lastExpiresAtRef = useRef<number | null>(null);
  const isMountedRef = useRef<boolean>(false);

  // Evita redirecciones duplicadas (evento + fallback)
  const didRedirectRef = useRef<boolean>(false);
  const safeRedirectToLogin = useCallback(() => {
    console.log('Redirigiendo a /login...');
    if (didRedirectRef.current) return;
    didRedirectRef.current = true;
    console.log('Limpiando sesión local y estado de usuario');
    try {
      sessionStorage.removeItem('user');
    } catch {}
    if (isMountedRef.current) {
      setUser(null);
    }
    console.log('Ejecutando router.replace a /login');
    router.push('/login');
  }, [router]);

  const fetchUserProfile = useCallback(async (id: string): Promise<Usuario | null> => {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', id)
        .single();
      if (error || !data) {
        console.error('Perfil no encontrado o error:', error ?? 'No se encontró el perfil');
        return null;
      }
      return data as Usuario;
    } catch (e) {
      console.error('Error en fetchUserProfile:', e);
      return null;
    }
  }, []);

  const applySessionChange = useCallback(
    async (event: AuthChangeEvent | 'INITIAL_SESSION', session: Session | null) => {
      const uid = session?.user?.id ?? null;
      const exp = session?.expires_at ?? null;

      console.log('UserContext: evento de auth ->', event, { user: uid, expires_at: exp });

      const sameUser = uid === lastUserIdRef.current;
      const sameExp = exp === lastExpiresAtRef.current;

      if (event === 'SIGNED_OUT') {
        // limpiar refs y estado
        if (lastUserIdRef.current !== null || lastExpiresAtRef.current !== null) {
          lastUserIdRef.current = null;
          lastExpiresAtRef.current = null;
          if (isMountedRef.current) setUser(null);
          try { sessionStorage.removeItem('user'); } catch {}
        }
        // Redirigir e invalidar RSC
        safeRedirectToLogin();
        return;
      }

      if (sameUser && sameExp) return;

      lastUserIdRef.current = uid;
      lastExpiresAtRef.current = exp;

      if (!uid) {
        if (isMountedRef.current && user !== null) setUser(null);
        try { sessionStorage.removeItem('user'); } catch {}
        return;
      }

      if (sameUser && !sameExp) return;

      let profile: Usuario | null = null;

      const savedUser = typeof window !== 'undefined' ? sessionStorage.getItem('user') : null;
      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser) as Usuario;
          if (parsed?.id === uid) profile = parsed;
        } catch {
          try { sessionStorage.removeItem('user'); } catch {}
        }
      }

      if (!profile) {
        profile = await fetchUserProfile(uid);
      }

      if (profile) {
        if (!user || user.id !== profile.id) {
          if (isMountedRef.current) setUser(profile);
        }
        try { sessionStorage.setItem('user', JSON.stringify(profile)); } catch {}
      } else {
        if (isMountedRef.current) setUser(null);
        try { sessionStorage.removeItem('user'); } catch {}
      }
    },
    [fetchUserProfile, user, safeRedirectToLogin]
  );

  useEffect(() => {
    isMountedRef.current = true;

    const initializeAuth = async () => {
      setLoading(true);
      didRedirectRef.current = false;

      try {
        const { data: { session } } = await supabase.auth.getSession();

        lastUserIdRef.current = session?.user?.id ?? null;
        lastExpiresAtRef.current = session?.expires_at ?? null;

        let nextUser: Usuario | null = null;
        const uid = lastUserIdRef.current;

        if (uid) {
          const savedUser = typeof window !== 'undefined' ? sessionStorage.getItem('user') : null;
          if (savedUser) {
            try {
              const parsed = JSON.parse(savedUser) as Usuario;
              if (parsed?.id === uid) nextUser = parsed;
              else sessionStorage.removeItem('user');
            } catch {
              sessionStorage.removeItem('user');
            }
          }

          if (!nextUser) {
            nextUser = await fetchUserProfile(uid);
            if (nextUser) {
              try { sessionStorage.setItem('user', JSON.stringify(nextUser)); } catch {}
            }
          }
        } else {
          try { sessionStorage.removeItem('user'); } catch {}
        }

        if (isMountedRef.current) {
          if ((user?.id ?? null) !== (nextUser?.id ?? null)) setUser(nextUser);
          setLoading(false);
          setAuthReady(true);
        }
      } catch (e) {
        console.error('Error en initializeAuth:', e);
        if (isMountedRef.current) {
          setLoading(false);
          setAuthReady(true);
        }
      }
    };

    const setup = async () => {
      await initializeAuth();
      const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
        await applySessionChange(event, session);
      });

      return () => {
        sub.subscription.unsubscribe();
      };
    };

    let cleanup: (() => void) | undefined;

    if (!initializeAuthCalled.current) {
      initializeAuthCalled.current = true;
      setup().then((c) => {
        cleanup = c;
      });
    }

    return () => {
      isMountedRef.current = false;
      if (cleanup) cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applySessionChange, fetchUserProfile]);

  const signOut = async () => {
    console.log('Cerrando sesión...');
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) console.error('signOut error:', error.message);
      // Fallback: si por alguna razón no llegó el evento, redirige/limpia igual
      safeRedirectToLogin();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      // Aun con error, evita dejar datos visibles
      safeRedirectToLogin();
    } finally {
      setLoading(false);
    }
  };

  const value: UserContextType = {
    user,
    setUser,
    loading,
    isAuthenticated: !!user,
    authReady,
    signOut
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = (): UserContextType => useContext(UserContext);