// contexts/PresentationContext.tsx
"use client";

import { createContext, useContext, useMemo, useState, ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@/context/UserContext";
import { fetchListasConCantos } from "@/lib/queries/listas";
import { supabase } from "@/lib/supabaseClient";
import { Canto } from "@/types/supabase";
import { ListaPresentacion } from "@/types/ListaPresentacion";
import { PresentationContextType } from "../types/PresentationContextType";
import { guardarListaConCantos } from "@/services/listas";
import { useDraftLists } from "@/hooks/useDraftLists";
import { useListOperations } from "@/hooks/useListOperations";
import { useCantos } from "@/hooks/useCantos";

const PresentationContext = createContext<PresentationContextType | undefined>(undefined);

export const PresentationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useUser();
  const userId = isAuthenticated && user?.id ? user.id : undefined;
  const queryClient = useQueryClient();
  const { data: cantos, isPending: cantosPending } = useCantos();

  // Estados locales
  const [selectedCantos, setSelectedCantos] = useState<Canto[]>([]);
  const [activeListId, setActiveListId] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [cantoPreview, setCantoPreview] = useState<Canto | null>(null);
  const [newPresentation, setNewPresentation] = useState(false);

  // Hooks personalizados
  const { drafts, addDraft, updateDraft, removeDraft, isDraft } = useDraftLists(userId);
  const { createListOperations } = useListOperations(userId);

  // Obtener operaciones de listas
  const {
    editListName,
    addSongToList,
    removeSongFromList,
    reorderSongsInList
  } = createListOperations(isDraft);

  // Query para listas del servidor
  const { data: serverLists = [] } = useQuery({
    queryKey: ["listas", userId],
    queryFn: () => fetchListasConCantos(userId!, cantos || []),
    enabled: !!userId && !cantosPending,
  });

  // Combinar listas
  const allLists = useMemo(() => [...drafts, ...serverLists], [drafts, serverLists]);
  const currentListId = activeListId ?? (allLists[0]?.id ?? null);

  // Acciones
  const crearLista = (nombre: string) => {
    const newId = crypto.randomUUID();
    const nuevaLista: ListaPresentacion = {
      id: newId,
      nombre,
      cantos: [],
      isSaved: false,
    };
    addDraft(nuevaLista);
    setActiveListId(newId);
  };

  const eliminarLista = async (id: string) => {
    if (isDraft(id)) {
      removeDraft(id);
      if (activeListId === id) {
        setActiveListId(allLists.find(list => list.id !== id)?.id || null);
      }
      return;
    }

    const { error } = await supabase.from("listas").delete().eq("id", id);
    if (!error) {
      queryClient.invalidateQueries({ queryKey: ["listas", userId] });
    }
  };

  const guardarListaBorrador = async (draftId: string) => {
    if (!userId) throw new Error("Usuario no autenticado");
    const draft = drafts.find(l => l.id === draftId);
    if (!draft) throw new Error("No se encontró el borrador");

    const nuevaListaId = await guardarListaConCantos(
      draft.nombre,
      userId,
      draft.cantos.map(c => c.id)
    );

    removeDraft(draftId);
    setActiveListId(nuevaListaId);
    queryClient.invalidateQueries({ queryKey: ["listas", userId] });
    return nuevaListaId;
  };

  const revalidateListas = () => {
    queryClient.invalidateQueries({ queryKey: ["listas", userId] });
  };

  const addCanto = (canto: Canto) => setSelectedCantos(prev => [...prev, canto]);
  const removeCanto = (id: string) => setSelectedCantos(prev => prev.filter(c => c.id !== id));

  // Preparar funciones para actualizar borradores
  const updateDraftName = (id: string, newName: string) => {
    updateDraft(id, draft => ({ ...draft, nombre: newName }));
  };

  const updateDraftAddSong = (id: string, song: Canto) => {
    updateDraft(id, draft => ({ ...draft, cantos: [...draft.cantos, song] }));
  };

  const updateDraftRemoveSong = (id: string, songId: string) => {
    updateDraft(id, draft => ({
      ...draft,
      cantos: draft.cantos.filter(c => c.id !== songId)
    }));
  };

  const updateDraftReorderSongs = (id: string, orderIds: string[]) => {
    updateDraft(id, draft => {
      const orderedSongs = orderIds
        .map(cid => draft.cantos.find(c => c.id === cid))
        .filter(Boolean) as Canto[];
      return { ...draft, cantos: orderedSongs };
    });
  };

  

  // Context value
  const value: PresentationContextType = {
    // Estados
    selectedCantos,
    listas: allLists,
    listaActivaId: currentListId,
    cantoPreview,
    favoritos: favorites,
    nuevaPresentacion: newPresentation,

    // Setters
    setSelectedCantos,
    setListaActivaId: setActiveListId,
    setCantoPreview,
    setFavoritos: setFavorites,
    setNuevaPresentacion: setNewPresentation,

    // Acciones
    crearLista,
    eliminarLista,
    editarNombreLista: (id, nombre) => editListName(id, nombre, updateDraftName),
    agregarCantoALista: (id, canto) => addSongToList(id, canto, updateDraftAddSong),
    removerCantoDeLista: (id, cantoId) => removeSongFromList(id, cantoId, updateDraftRemoveSong),
    reordenarCantosEnLista: (id, ordenIds) => reorderSongsInList(id, ordenIds, updateDraftReorderSongs),
    guardarListaBorrador,
    revalidateListas,
    addCanto,
    removeCanto,
  };

  return (
    <PresentationContext.Provider value={value}>
      {children}
    </PresentationContext.Provider>
  );
};

export const usePresentation = () => {
  const context = useContext(PresentationContext);
  if (!context) throw new Error("usePresentation debe usarse dentro de PresentationProvider");
  return context;
};