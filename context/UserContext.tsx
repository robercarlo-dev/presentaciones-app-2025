'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef
} from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { Usuario } from '@/types/supabase';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';

/**
 * Define la forma del contexto de usuario.
 */
type UserContextType = {
  user: Usuario | null;
  setUser: React.Dispatch<React.SetStateAction<Usuario | null>>;
  loading: boolean;
  isAuthenticated: boolean;
  authReady: boolean;
  signOut: () => Promise<void>;
};

/**
 * Valores por defecto para evitar errores antes de la inicialización.
 */
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
  const [user, setUser] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [authReady, setAuthReady] = useState<boolean>(false);

  // Evita múltiples inicializaciones (StrictMode en dev)
  const initializeAuthCalled = useRef<boolean>(false);
  // Guarda el último userId y expires_at observados para evitar updates innecesarios
  const lastUserIdRef = useRef<string | null>(null);
  const lastExpiresAtRef = useRef<number | null>(null);
  // Montaje
  const isMountedRef = useRef<boolean>(false);

  /**
   * Obtiene el perfil del usuario desde la tabla `usuarios`.
   */
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

  /**
   * Aplica cambios de sesión de forma deduplicada.
   * - Distingue eventos: INITIAL_SESSION, SIGNED_IN, TOKEN_REFRESHED, SIGNED_OUT
   * - Evita setState si user y expires_at no cambiaron
   */
  const applySessionChange = useCallback(
    async (event: AuthChangeEvent | 'INITIAL_SESSION', session: Session | null) => {
      const uid = session?.user?.id ?? null;
      const exp = session?.expires_at ?? null;

      console.log('UserContext: evento de auth ->', event, { user: uid, expires_at: exp });

      const sameUser = uid === lastUserIdRef.current;
      const sameExp = exp === lastExpiresAtRef.current;

      // SIGNED_OUT: limpiar solo si había algo distinto a null
      if (event === 'SIGNED_OUT') {
        if (lastUserIdRef.current !== null || lastExpiresAtRef.current !== null) {
          lastUserIdRef.current = null;
          lastExpiresAtRef.current = null;
          if (isMountedRef.current) {
            setUser(null);
          }
          sessionStorage.removeItem('user');
        }
        return;
      }

      // Para INITIAL_SESSION / SIGNED_IN / TOKEN_REFRESHED:
      // Si no cambió ni user ni expires_at, no hagas nada (evita re-renders)
      if (sameUser && sameExp) {
        return;
      }

      // Actualiza los refs (no re-render)
      lastUserIdRef.current = uid;
      lastExpiresAtRef.current = exp;

      // Si no hay usuario en la sesión, limpia estado si fuera necesario
      if (!uid) {
        if (isMountedRef.current && user !== null) {
          setUser(null);
        }
        sessionStorage.removeItem('user');
        return;
      }

      // Si el usuario es el mismo pero solo cambió el expires_at (TOKEN_REFRESHED),
      // no hace falta refetchear el perfil ni tocar el estado del user.
      if (sameUser && !sameExp) {
        return;
      }

      // Usuario cambió (o no había user local): intenta usar cache o refetch
      let profile: Usuario | null = null;

      // Intenta usar el perfil de sessionStorage si coincide el id
      const savedUser = sessionStorage.getItem('user');
      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser) as Usuario;
          if (parsed?.id === uid) {
            profile = parsed;
          }
        } catch {
          sessionStorage.removeItem('user');
        }
      }

      // Si no hay perfil en cache, pedirlo a la BD
      if (!profile) {
        profile = await fetchUserProfile(uid);
      }

      // Aplica el perfil solo si existe y si es distinto al actual (por id)
      if (profile) {
        if (!user || user.id !== profile.id) {
          if (isMountedRef.current) {
            setUser(profile);
          }
        }
        sessionStorage.setItem('user', JSON.stringify(profile));
      } else {
        // Si falló obtener el perfil, limpia estado para no dejar datos inconsistentes
        if (isMountedRef.current) {
          setUser(null);
        }
        sessionStorage.removeItem('user');
      }
    },
    [fetchUserProfile, user]
  );

  /**
   * Inicializa la autenticación y suscribe a cambios.
   */
  useEffect(() => {
    isMountedRef.current = true;

    const initializeAuth = async () => {
      setLoading(true);

      try {
        const { data: { session } } = await supabase.auth.getSession();

        // Marca refs iniciales
        lastUserIdRef.current = session?.user?.id ?? null;
        lastExpiresAtRef.current = session?.expires_at ?? null;

        // Intenta precargar desde sessionStorage si coincide usuario
        let nextUser: Usuario | null = null;
        const uid = lastUserIdRef.current;

        if (uid) {
          const savedUser = sessionStorage.getItem('user');
          if (savedUser) {
            try {
              const parsed = JSON.parse(savedUser) as Usuario;
              if (parsed?.id === uid) {
                nextUser = parsed;
              } else {
                sessionStorage.removeItem('user');
              }
            } catch {
              sessionStorage.removeItem('user');
            }
          }

          // Si no hay cache válida, obtén perfil
          if (!nextUser) {
            nextUser = await fetchUserProfile(uid);
            if (nextUser) {
              sessionStorage.setItem('user', JSON.stringify(nextUser));
            }
          }
        } else {
          sessionStorage.removeItem('user');
        }

        if (isMountedRef.current) {
          // Solo setea si realmente cambia
          if ((user?.id ?? null) !== (nextUser?.id ?? null)) {
            setUser(nextUser);
          }
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
        // Distingue eventos y aplica cambios de forma deduplicada
        await applySessionChange(event, session);
      });

      // Cleanup
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
  }, [applySessionChange, fetchUserProfile]); // refs no cambian, callbacks memorizados

  /**
   * Cierra sesión y limpia estado.
   */
  const signOut = async () => {
    console.log('Cerrando sesión...');
    try {
      setLoading(true);
      await supabase.auth.signOut();
      // onAuthStateChange (SIGNED_OUT) hará el resto
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
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

/**
 * Hook para consumir el contexto de usuario.
 */
export const useUser = (): UserContextType => useContext(UserContext);