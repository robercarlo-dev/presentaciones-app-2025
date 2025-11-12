'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import ManejoCantos from '@/components/ManejoCantos';


export default function PaginaProtegida() {
  const { loading, isAuthenticated, authReady } = useUser();
  const router = useRouter();

  useEffect(() => {
    // Cuando loading sea false, si no está autenticado, redirige.
    if (!loading && !isAuthenticated) {
      console.log('Usuario no autenticado, redirigiendo a /login');
      router.push('/login');
    }
  }, [loading, isAuthenticated, router]);

  if (!authReady || loading) {
    // Muestra 'Cargando...' mientras el contexto de Firebase/Supabase se inicializa.
    return <p className='mt-20 text-primary'>Cargando...</p>;
  }

  return (
    <>
      <ManejoCantos />
    </>
  );
}