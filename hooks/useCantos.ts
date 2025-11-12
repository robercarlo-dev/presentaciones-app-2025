// hooks/useCantos.ts (sin cambios funcionales)
'use client';

import { useQuery } from '@tanstack/react-query';
import { useUser } from '@/context/UserContext';
import { obtenerCantos } from '@/services/cantos';
import { Canto } from '@/types/supabase';

export function useCantos() {
  const { isAuthenticated, authReady, user } = useUser();

  return useQuery<Canto[]>({
    queryKey: ['cantos', user?.id ?? 'anon'],
    queryFn: obtenerCantos,
    enabled: authReady && isAuthenticated,
  });
}