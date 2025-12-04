// hooks/useSubscribeToListaUpdates.ts
import { useEffect } from 'react';
import { usePresentation } from '@/context/PresentationContext';

export const useSubscribeToListaUpdates = (listaId: string) => {
  const { listas } = usePresentation();
  const lista = listas.find(l => l.id === listaId);
  
  // Este efecto se ejecuta cada vez que la lista cambie
  useEffect(() => {
    // El efecto en sí no hace nada, pero al tener lista como dependencia,
    // forzará el re-render cuando cambie
    console.log('📡 Lista actualizada en hook:', lista?.nombre, lista?.items_orden.length);
  }, [lista]); // ← Importante: lista como dependencia completa, no solo listaId
  
  return lista;
};