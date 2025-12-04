// hooks/useCantos.ts (sin cambios funcionales)
'use client';

import { useQuery } from '@tanstack/react-query';
import { useUser } from '@/context/UserContext';
import { obtenerTarjetas } from '@/services/tarjetas';
import { Tarjeta } from '@/types/supabase';

export function useTarjetas() {
  const { isAuthenticated, authReady, user } = useUser();

  return useQuery<Tarjeta[]>({
    queryKey: ['tarjetas', user?.id ?? 'anon'],
    queryFn: obtenerTarjetas,
    enabled: authReady && isAuthenticated,
  });
}