'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import ListaCantos from '../components/ListaCantos';
import ListasPresentaciones from '../components/ListasPresentaciones';
import { useCantos } from '@/hooks/useCantos';

export default function PaginaProtegida() {
  const { loading, isAuthenticated, authReady } = useUser();
  const router = useRouter();
  const { data: cantos, isPending } = useCantos();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, router]);

  if (!authReady || loading || isPending) {
    return <p className='mt-20 text-primary'>Cargando...</p>;
  }
  
  // Solo renderiza el contenido protegido si loading es false Y isAuthenticated es true
  if (isAuthenticated ) {
    return (
      <div className="flex gap-10 justify-center m-4 bg-background">
        <ListaCantos cantosData={cantos || []}/>
        <ListasPresentaciones />
      </div>
    );
  }

  // Si no está cargando y no está autenticado, este return NUNCA debería verse, 
  // ya que el useEffect superior ya ha iniciado la redirección.
  return null; 
}
