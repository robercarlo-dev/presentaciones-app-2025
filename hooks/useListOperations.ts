import { useQueryClient } from "@tanstack/react-query";
import { Canto } from "@/types/supabase";
import { ListaPresentacion } from "@/types/ListaPresentacion";
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

      const cantoIds = lista.cantos.map((c) => c.id);
      const nombre = lista.nombre;

      const { error } = await supabase.rpc("app_actualizar_lista", {
        p_lista_id: id,
        p_nuevo_nombre: nombre,
        p_canto_ids: cantoIds,
      });
      
      if (error) console.error("Error al aplicar cambios:", error);
      queryClient.invalidateQueries({ queryKey: ["listas", userId] });
      timers.delete(id);
    }, FLUSH_DELAY_MS);

    timers.set(id, t);
  };

//   editarNombreLista,
    // agregarCantoALista,
    // removerCantoDeLista,
    // reordenarCantosEnLista,
  const createListOperations = (isDraft: (id: string) => boolean) => ({
    editListName: (id: string, newName: string, updater?: (id: string, name: string) => void) => {
      if (isDraft(id)) {
        updater?.(id, newName);
        return;
      }
      updateListInCache(id, (list) => ({ ...list, nombre: newName }));
      scheduleFlush(id, isDraft(id));
    },

    addSongToList: (id: string, song: Canto, updater?: (id: string, song: Canto) => void) => {
      if (isDraft(id)) {
        updater?.(id, song);
        return;
      }
      updateListInCache(id, (list) => ({ ...list, cantos: [...list.cantos, song] }));
      scheduleFlush(id, isDraft(id));
    },

    removeSongFromList: (id: string, songId: string, updater?: (id: string, songId: string) => void) => {
      if (isDraft(id)) {
        updater?.(id, songId);
        return;
      }
      updateListInCache(id, (list) => ({
        ...list,
        cantos: list.cantos.filter(c => c.id !== songId),
      }));
      scheduleFlush(id, isDraft(id));
    },

    reorderSongsInList: (id: string, orderIds: string[], updater?: (id: string, orderIds: string[]) => void) => {
      if (isDraft(id)) {
        updater?.(id, orderIds);
        return;
      }
      updateListInCache(id, (list) => {
        const orderedSongs = orderIds
          .map(cid => list.cantos.find(c => c.id === cid))
          .filter(Boolean) as Canto[];
        return { ...list, cantos: orderedSongs };
      });
      scheduleFlush(id, isDraft(id));
    },
  });

  return { createListOperations, updateListInCache };
};