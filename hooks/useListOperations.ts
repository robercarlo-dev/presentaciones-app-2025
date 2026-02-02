import { useQueryClient } from "@tanstack/react-query";
import { Canto, Tarjeta } from "@/types/supabase";
import { ListaPresentacion, ElementoCanto, ElementoTarjeta } from "@/types/ListaPresentacion";
import { supabase } from "@/lib/supabaseClient";
import { useRef } from "react";

const FLUSH_DELAY_MS = 5000;

export const useListOperations = (userId?: string) => {
  const queryClient = useQueryClient();
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const updateListInCache = (id: string, updater: (lista: ListaPresentacion) => ListaPresentacion) => {
    queryClient.setQueryData<ListaPresentacion[]>(["listas", userId], (old = []) =>
      old.map(lista => (lista.id === id ? updater({ ...lista }) : lista))
    );
  };

  const scheduleFlush = (id: string, isDraft: boolean) => {
    if (!userId || isDraft) return;
  
    const timers = timersRef.current;
    const prev = timers.get(id);
    if (prev) clearTimeout(prev);
  
    const t = setTimeout(async () => {
      const cache = queryClient.getQueryData<ListaPresentacion[]>(["listas", userId]) ?? [];
      const lista = cache.find((l) => l.id === id);
      if (!lista) return;
  
      // Extraer IDs con su orden
      const cantoIds = lista.cantos.map((c) => c.canto.id);
      const tarjetaIds = lista.tarjetas?.map((t) => t.tarjeta.id) || [];
      const cantosOrden = lista.cantos.map((c) => c.numero || 0);
      const tarjetasOrden = lista.tarjetas?.map((t) => t.numero || 0) || [];
      const nombre = lista.nombre;

      console.log(`cantos orden: ${cantosOrden}`);
      console.log(`tarjetas orden: ${tarjetasOrden}`);
      console.log(`cantos ids: ${cantoIds}`);
      console.log(`tarjetas ids: ${tarjetaIds}`);
  
      const { error } = await supabase.rpc("app_actualizar_lista", {
        p_lista_id: id,
        p_nuevo_nombre: nombre,
        p_canto_ids: cantoIds,
        p_cantos_orden: cantosOrden, // Nuevo parámetro
        p_tarjeta_ids: tarjetaIds,
        p_tarjetas_orden: tarjetasOrden, // Nuevo parámetro
      });
      
      if (error) console.error("Error al aplicar cambios:", error);
      queryClient.invalidateQueries({ queryKey: ["listas", userId] });
      timers.delete(id);
    }, FLUSH_DELAY_MS);
  
    timers.set(id, t);
  };

  const createListOperations = (isDraft: (id: string) => boolean) => ({
    editListName: (id: string, newName: string, updater?: (id: string, name: string) => void) => {
      if (isDraft(id)) {
        updater?.(id, newName);
        return;
      }
      updateListInCache(id, (list) => ({ ...list, nombre: newName }));
      scheduleFlush(id, isDraft(id));
    },

    addSongToList: (id: string, song: Canto, numero: number, updater?: (id: string, song: Canto, numero: number) => void) => {
      if (isDraft(id)) {
        updater?.(id, song, numero);
        return;
      }
      updateListInCache(id, (list) => ({ 
        ...list, 
        cantos: [...list.cantos, { numero: numero, canto: song }] 
      }));
      scheduleFlush(id, isDraft(id));
    },

    ///////////////////////////////////

    addElementToList: (id: string, elemento: Canto | Tarjeta, numero: number, updater?: (id: string, elemento: Canto | Tarjeta, numero: number) => void) => {
      if (isDraft(id)) {
        updater?.(id, elemento, numero);
        return;
      }
      if ('nombre' in elemento) {
        // Es una Tarjeta
        // Aquí podrías implementar la lógica para agregar una tarjeta si es necesario
        updateListInCache(id, (list) => ({ 
          ...list, 
          tarjetas: [...list.tarjetas || [], { numero: numero, tarjeta: elemento as Tarjeta }] 
        }));
      } else {
        // Es un Canto
        updateListInCache(id, (list) => ({ 
          ...list, 
          cantos: [...list.cantos, { numero: numero, canto: elemento as Canto }] 
        }));
      }
      scheduleFlush(id, isDraft(id));
    },

    removeElementFromList: (id: string, elementId: string, updater?: (id: string, elementId: string) => void) => {
      if (isDraft(id)) {
        updater?.(id, elementId);
        return;
      }
      updateListInCache(id, (list) => ({
        ...list,
        cantos: list.cantos.filter(c => c.canto.id !== elementId), tarjetas: list.tarjetas?.filter(t => t.tarjeta.id !== elementId) || [],
      }));
      scheduleFlush(id, isDraft(id));
    },

    reorderElementsInList: (id: string, orderIds: string[], updater?: (id: string, orderIds: string[]) => void) => {
      if (isDraft(id)) {
        updater?.(id, orderIds);
        return;
      }
      
      updateListInCache(id, (list) => {
        const elementMap = new Map<string, { tipo: 'canto' | 'tarjeta', elemento: any }>();
        
        list.cantos?.forEach(elem => {
          elementMap.set(elem.canto.id, { tipo: 'canto', elemento: elem });
        });
        
        list.tarjetas?.forEach(elem => {
          elementMap.set(elem.tarjeta.id, { tipo: 'tarjeta', elemento: elem });
        });
    
        // Un solo contador para todos los elementos
        const orderedSongs: ElementoCanto[] = [];
        const orderedCards: ElementoTarjeta[] = [];
        
        let globalCounter = 1;
        
        orderIds.forEach(elementId => {
          const item = elementMap.get(elementId);
          if (!item) return;
          
          if (item.tipo === 'canto') {
            orderedSongs.push({
              ...item.elemento,
              numero: globalCounter++,
            });
          } else {
            orderedCards.push({
              ...item.elemento,
              numero: globalCounter++,
            });
          }
        });
        console.log("Reordered Elements:", { orderedSongs, orderedCards });
    
        return { ...list, cantos: orderedSongs, tarjetas: orderedCards };
      });
      
      scheduleFlush(id, isDraft(id));
    },

     ///////////////////////////////////

    removeSongFromList: (id: string, songId: string, updater?: (id: string, songId: string) => void) => {
      if (isDraft(id)) {
        updater?.(id, songId);
        return;
      }
      updateListInCache(id, (list) => ({
        ...list,
        cantos: list.cantos.filter(c => c.canto.id !== songId),
      }));
      scheduleFlush(id, isDraft(id));
    },

    reorderSongsInList: (id: string, orderIds: string[], updater?: (id: string, orderIds: string[]) => void) => {
      if (isDraft(id)) {
        updater?.(id, orderIds);
        return;
      }
      updateListInCache(id, (list) => {
        // Crear un mapa de ID de canto a ElementoCanto
        const songMap = new Map<string, ElementoCanto>();
        list.cantos.forEach((elem) => {
          songMap.set(elem.canto.id, elem);
        });

        // Reordenar los elementos según orderIds y actualizar los números
        const orderedSongs = orderIds
          .map((cantoId, index) => {
            const elem = songMap.get(cantoId);
            if (elem) {
              return {
                ...elem,
                numero: index + 1, // Actualizar el número con la nueva posición
              };
            }
            return null;
          })
          .filter(Boolean) as ElementoCanto[];

        return { ...list, cantos: orderedSongs };
      });
      scheduleFlush(id, isDraft(id));
    },
  });

  return { createListOperations, updateListInCache };
};