"use client";

import { createContext, useContext, useMemo, useRef, useState, ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@/context/UserContext";
import { fetchListasConCantos } from "@/lib/queries/listas";
import { supabase } from "@/lib/supabaseClient";
import { Canto } from "@/types/supabase";
import { ListaPresentacion } from "@/types/ListaPresentacion";
import { PresentationContextType } from "../types/PresentationContextType";
import { guardarListaConCantos } from "@/services/listas";

const PresentationContext = createContext<PresentationContextType | undefined>(undefined);

const FLUSH_DELAY_MS = 5000; // debounce por lista

export const PresentationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Borradores locales
  const [drafts, setDrafts] = useState<ListaPresentacion[]>([]);
  const [selectedCantos, setSelectedCantos] = useState<Canto[]>([]);
  const [listaActivaId, setListaActivaId] = useState<string | null>(null);
  const [favoritos, setFavoritos] = useState<string[]>([]);
  const [cantoPreview, setCantoPreview] = useState<Canto | null>(null);

  const { user, isAuthenticated } = useUser();
  const usuarioId = isAuthenticated && user?.id ? user.id : undefined;

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

  // Actualiza la cache de React Query localmente para una lista guardada
  const updateListaEnCache = (id: string, updater: (l: ListaPresentacion) => ListaPresentacion) => {
    qc.setQueryData<ListaPresentacion[]>(["listas", usuarioId], (old = []) =>
      old.map((l) => (l.id === id ? updater({ ...l, cantos: [...l.cantos] }) : l))
    );
  };

  // Programa un flush debounced a la DB para una lista guardada
  const scheduleFlush = (id: string) => {
    if (!usuarioId) return;
    if (esBorrador(id)) return; // borradores no se flushean: se guardan con Guardar

    const timers = timersRef.current;
    const prev = timers.get(id);
    if (prev) clearTimeout(prev);

    const t = setTimeout(async () => {
      const cache = qc.getQueryData<ListaPresentacion[]>(["listas", usuarioId]) ?? [];
      const lista = cache.find((l) => l.id === id);
      if (!lista) return;

      const cantoIds = lista.cantos.map((c) => c.id);
      const nombre = lista.nombre;

      // 1 llamada a RPC con snapshot final
      const { error } = await supabase.rpc("app_actualizar_lista", {
        p_lista_id: id,
        p_nuevo_nombre: nombre,
        p_canto_ids: cantoIds,
      });
      if (error) {
        console.error("Error al aplicar cambios:", error);
        // Revalida para recuperar estado de la DB
        qc.invalidateQueries({ queryKey: ["listas", usuarioId] });
      } else {
        // Revalida para confirmar
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
    if (esBorrador(id)) {
      setDrafts((prev) => prev.filter((l) => l.id !== id));
      setListaActivaId((prev) => (prev === id ? (listas[0]?.id ?? null) : prev));
      return;
    }
    // Lista guardada: borrar en DB (1 llamada)
    supabase
      .from("listas")
      .delete()
      .eq("id", id)
      .then(({ error }) => {
        if (error) console.error(error);
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
    const cantoIds = draft.cantos.map((c) => c.id);

    const nuevaListaId = await guardarListaConCantos(draft.nombre, usuarioId, cantoIds);

    setDrafts((prev) => prev.filter((l) => l.id !== id));
    await qc.invalidateQueries({ queryKey: ["listas", usuarioId] });
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