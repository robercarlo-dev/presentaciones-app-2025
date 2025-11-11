'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import ManejoCantos from '@/components/ManejoCantos';

export default function PaginaProtegida() {
  const { loading, isAuthenticated } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, router]);

  if (loading) {
    return <p>Cargando...</p>;
  }

  return (
    <>
      <ManejoCantos />
    </>
  );
}