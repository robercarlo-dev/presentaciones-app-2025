// hooks/useListaSelector.ts
import { useMemo } from 'react';
import { usePresentation } from '@/context/PresentationContext';
import { obtenerItemsOrdenadosCompletos } from '@/types/ListaPresentacion';

export const useListaItemsOrdenados = (listaId: string) => {
  const { listas } = usePresentation();
  
  return useMemo(() => {
    const lista = listas.find(l => l.id === listaId);
    if (!lista) return [];
    
    return obtenerItemsOrdenadosCompletos(lista);
  }, [
    listaId, 
    // Dependencias específicas que cambiarán cuando se actualice la lista
    listas.length, // Cuando cambia el número de listas
    listas.find(l => l.id === listaId)?.items_orden?.length,
    listas.find(l => l.id === listaId)?.cantos?.length,
    listas.find(l => l.id === listaId)?.tarjetas?.length,
  ]);
};