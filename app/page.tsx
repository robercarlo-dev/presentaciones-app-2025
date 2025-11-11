'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import ListaCantos from '../components/ListaCantos';
import ListasPresentaciones from '../components/ListasPresentaciones';

export default function PaginaProtegida() {
  const { loading, isAuthenticated } = useUser();
  const router = useRouter(); // <-- Uso correcto del router aquí

  useEffect(() => {
    // Cuando loading sea false, si no está autenticado, redirige.
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, router]);

  if (loading) {
    // Muestra 'Cargando...' mientras el contexto de Firebase/Supabase se inicializa.
    return <p>Cargando...</p>;
  }
  
  // Solo renderiza el contenido protegido si loading es false Y isAuthenticated es true
  if (isAuthenticated) {
    return (
      <div className="flex gap-10 justify-center m-4 bg-background">
        <ListaCantos />
        <ListasPresentaciones />
      </div>
    );
  }

  // Si no está cargando y no está autenticado, este return NUNCA debería verse, 
  // ya que el useEffect superior ya ha iniciado la redirección.
  return null; 
}
