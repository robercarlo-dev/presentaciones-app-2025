"use client";

import { createContext, useContext, useMemo, useRef, useState, ReactNode, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@/context/UserContext";
import { fetchListasConCantos } from "@/lib/queries/listas";
import { supabase } from "@/lib/supabaseClient";
import { Canto } from "@/types/supabase";
import { ListaPresentacion } from "@/types/ListaPresentacion";
import { PresentationContextType } from "../types/PresentationContextType";
import { guardarListaConCantos } from "@/services/listas";

const PresentationContext = createContext<PresentationContextType | undefined>(undefined);

const FLUSH_DELAY_MS = 5000;

const DRAFTS_KEY_PREFIX = "presentacion:drafts:";

const storageKeyForUser = (uid?: string) => `${DRAFTS_KEY_PREFIX}${uid ?? "anon"}`;

function safeParseDrafts(raw: string | null): ListaPresentacion[] {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr.filter((l) => l && typeof l.id === "string" && typeof l.nombre === "string" && Array.isArray(l.cantos));
  } catch {
    return [];
  }
}

export const PresentationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [drafts, setDrafts] = useState<ListaPresentacion[]>([]);
  const [selectedCantos, setSelectedCantos] = useState<Canto[]>([]);
  const [listaActivaId, setListaActivaId] = useState<string | null>(null);
  const [favoritos, setFavoritos] = useState<string[]>([]);
  const [cantoPreview, setCantoPreview] = useState<Canto | null>(null);
  const [nuevaPresentacion, setNuevaPresentacion] = useState<Boolean>(false);

  const { user, isAuthenticated } = useUser();
  const usuarioId = isAuthenticated && user?.id ? user.id : undefined;

  useEffect(() => {
    const key = storageKeyForUser(usuarioId);
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem(key) : null;
      const loaded = safeParseDrafts(raw);
      setDrafts(loaded);
    } catch (e) {
      console.error("No se pudieron cargar borradores desde localStorage", e);
      setDrafts([]);
    }
  }, [usuarioId]);

  useEffect(() => {
    const key = storageKeyForUser(usuarioId);
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(key, JSON.stringify(drafts));
      }
    } catch (e) {
      console.error("No se pudieron guardar borradores en localStorage", e);
    }
  }, [drafts, usuarioId]);

  const { data: listasServer = [] } = useQuery({
    queryKey: ["listas", usuarioId],
    queryFn: () => fetchListasConCantos(usuarioId!),
    enabled: !!usuarioId,
  });

  const listas = useMemo(() => [...drafts, ...listasServer], [drafts, listasServer]);
  const activeListaId = useMemo(
    () => listaActivaId ?? (listas[0]?.id ?? null),
    [listaActivaId, listas]
  );

  const qc = useQueryClient();
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const esBorrador = (id: string) => drafts.some((l) => l.id === id);


  const updateListaEnCache = (id: string, updater: (l: ListaPresentacion) => ListaPresentacion) => {
    qc.setQueryData<ListaPresentacion[]>(["listas", usuarioId], (old = []) =>
      old.map((l) => (l.id === id ? updater({ ...l, cantos: [...l.cantos] }) : l))
    );
  };


  const scheduleFlush = (id: string) => {
    if (!usuarioId) return;
    if (esBorrador(id)) return; 

    const timers = timersRef.current;
    const prev = timers.get(id);
    if (prev) clearTimeout(prev);

    const t = setTimeout(async () => {
      const cache = qc.getQueryData<ListaPresentacion[]>(["listas", usuarioId]) ?? [];
      const lista = cache.find((l) => l.id === id);
      if (!lista) return;

      const cantoIds = lista.cantos.map((c) => c.id);
      const nombre = lista.nombre;

      const { error } = await supabase.rpc("app_actualizar_lista", {
        p_lista_id: id,
        p_nuevo_nombre: nombre,
        p_canto_ids: cantoIds,
      });
      if (error) {
        console.error("Error al aplicar cambios:", error);
        qc.invalidateQueries({ queryKey: ["listas", usuarioId] });
      } else {
        qc.invalidateQueries({ queryKey: ["listas", usuarioId] });
      }
      timers.delete(id);
    }, FLUSH_DELAY_MS);

    timers.set(id, t);
  };

  // Acciones

  const crearLista = (nombre: string) => {
    const nueva: ListaPresentacion = {
      id: crypto.randomUUID(),
      nombre,
      cantos: [],
      isSaved: false,
    };
    setDrafts((prev) => [nueva, ...prev]);
    setListaActivaId(nueva.id);
  };

  const eliminarLista = (id: string) => {
    // Determinar si es borrador
    const esBorradorLocal = esBorrador(id);
    
    if (esBorradorLocal) {
      console.log("Eliminando borrador de lista", id);
      
      // Filtrar borradores y obtener nueva lista de borradores
      setDrafts((prev) => {
        const nuevosBorradores = prev.filter((l) => l.id !== id);
        
        // Buscar nueva lista activa entre todas las listas disponibles
        const todasLasListas = [...listas, ...nuevosBorradores];
        const nuevaListaActiva = todasLasListas.find(l => l.id !== id)?.id || null;
        
        // Actualizar lista activa si era la que se eliminó
        setListaActivaId((prevId) => (prevId === id ? nuevaListaActiva : prevId));
        
        console.log("Borrador eliminado");
        return nuevosBorradores;
      });
      
      return;
    }
    
    // Para listas normales
    supabase
      .from("listas")
      .delete()
      .eq("id", id)
      .then(({ error }) => {
        if (error) {
          console.error(error);
          return;
        }
        
        // Buscar nueva lista activa después de eliminar
        const listasRestantes = listas.filter(l => l.id !== id);
        const todasLasListas = [...listasRestantes, ...drafts];
        const nuevaListaActiva = todasLasListas[0]?.id || null;
        
        setListaActivaId((prev) => (prev === id ? nuevaListaActiva : prev));
        qc.invalidateQueries({ queryKey: ["listas", usuarioId] });
      });
  };

  const editarNombreLista = (id: string, nuevoNombre: string) => {
    if (esBorrador(id)) {
      setDrafts((prev) => prev.map((l) => (l.id === id ? { ...l, nombre: nuevoNombre } : l)));
      return;
    }
    updateListaEnCache(id, (l) => ({ ...l, nombre: nuevoNombre }));
    scheduleFlush(id);
  };

  const agregarCantoALista = (id: string, canto: Canto) => {
    if (esBorrador(id)) {
      setDrafts((prev) =>
        prev.map((l) => (l.id === id ? { ...l, cantos: [...l.cantos, canto] } : l))
      );
      return;
    }
    updateListaEnCache(id, (l) => ({ ...l, cantos: [...l.cantos, canto] }));
    scheduleFlush(id);
  };

  const removerCantoDeLista = (id: string, cantoId: string) => {
    if (esBorrador(id)) {
      setDrafts((prev) =>
        prev.map((l) =>
          l.id === id ? { ...l, cantos: l.cantos.filter((c) => c.id !== cantoId) } : l
        )
      );
      return;
    }
    updateListaEnCache(id, (l) => ({
      ...l,
      cantos: l.cantos.filter((c) => c.id !== cantoId),
    }));
    scheduleFlush(id);
  };

  const reordenarCantosEnLista = (id: string, ordenIds: string[]) => {
    if (esBorrador(id)) {
      setDrafts((prev) =>
        prev.map((l) => {
          if (l.id !== id) return l;
          const cantosOrdenados = ordenIds
            .map((cid) => l.cantos.find((c) => c.id === cid)!)
            .filter(Boolean);
          return { ...l, cantos: cantosOrdenados };
        })
      );
      return;
    }
    updateListaEnCache(id, (l) => {
      const cantosOrdenados = ordenIds
        .map((cid) => l.cantos.find((c) => c.id === cid)!)
        .filter(Boolean);
      return { ...l, cantos: cantosOrdenados };
    });
    scheduleFlush(id);
  };

  const guardarListaBorrador = async (id: string) => {
    if (!usuarioId) throw new Error("Usuario no autenticado");
    const draft = drafts.find((l) => l.id === id);
    if (!draft) throw new Error("No se encontró el borrador");
  
    const nuevaListaId = await guardarListaConCantos(
      draft.nombre,
      usuarioId,
      draft.cantos.map((c) => c.id)
    );

    
    setDrafts((prev) => prev.filter((l) => l.id !== id));  
    
    qc.setQueryData<ListaPresentacion[]>(["listas", usuarioId], (old = []) => [
      ...old,
      {
        id: nuevaListaId,
        nombre: draft.nombre,
        cantos: draft.cantos,
        isSaved: true,
      },
    ]);
  
    
    setListaActivaId(nuevaListaId);
  
    return nuevaListaId;
  };

  const revalidateListas = () => {
    qc.invalidateQueries({ queryKey: ["listas", usuarioId] });
  };

  const addCanto = (canto: Canto) => setSelectedCantos((prev) => [...prev, canto]);
  const removeCanto = (id: string) => setSelectedCantos((prev) => prev.filter((c) => c.id !== id));

  return (
    <PresentationContext.Provider
      value={{
        selectedCantos,
        setSelectedCantos,
        addCanto,
        removeCanto,

        listas,

        crearLista,
        eliminarLista,
        editarNombreLista,
        agregarCantoALista,
        removerCantoDeLista,
        reordenarCantosEnLista,

        guardarListaBorrador,
        revalidateListas,

        listaActivaId: activeListaId,
        setListaActivaId,

        cantoPreview,
        setCantoPreview,
        favoritos,
        setFavoritos,

        nuevaPresentacion,
        setNuevaPresentacion,
      }}
    >
      {children}
    </PresentationContext.Provider>
  );
};

export const usePresentation = (): PresentationContextType => {
  const ctx = useContext(PresentationContext);
  if (!ctx) throw new Error("usePresentation must be used within a PresentationProvider");
  return ctx;
};