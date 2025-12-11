// contexts/PresentationContext.tsx
"use client";

import { createContext, useContext, useMemo, useState, ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@/context/UserContext";
import { fetchListasConCantosYTarjetas } from "@/lib/queries/listas";
import { supabase } from "@/lib/supabaseClient";
import { Canto, Tarjeta } from "@/types/supabase";
import { ListaPresentacion, ElementoCanto, ElementoTarjeta } from "@/types/ListaPresentacion";
import { PresentationContextType } from "../types/PresentationContextType";
import { guardarListaConCantosYTarjetas } from "@/services/listas";
import { useDraftLists } from "@/hooks/useDraftLists";
import { useListOperations } from "@/hooks/useListOperations";
import { useCantos } from "@/hooks/useCantos";
import { useTarjetas } from "@/hooks/useTarjetas";

const PresentationContext = createContext<PresentationContextType | undefined>(undefined);

export const PresentationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useUser();
  const userId = isAuthenticated && user?.id ? user.id : undefined;
  const queryClient = useQueryClient();
  const { data: cantos, isPending: cantosPending } = useCantos();
  const { data: tarjetas, isPending: tarjetasPending } = useTarjetas();

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
    addElementToList,
    removeSongFromList,
    reorderElementsInList
  } = createListOperations(isDraft);

  // Query para listas del servidor
  const { data: serverLists = [] } = useQuery({
    queryKey: ["listas", userId],
    queryFn: () => fetchListasConCantosYTarjetas(userId!, cantos || [], tarjetas || []),
    enabled: !!userId && !cantosPending && !tarjetasPending,
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

    // Mapear cantos correctamente (corregida la sintaxis del arrow function)
    const cantosParaGuardar = draft.cantos.map(c => ({
      id: c.canto.id,
      numero: c.numero
    }));

    // Mapear tarjetas (asegurando que incluye el número si existe)
    const tarjetasParaGuardar = (draft.tarjetas || []).map(t => ({
      id: t.tarjeta.id,
      numero: t.numero || 0 // Asegura un valor por defecto si no existe
    }));

    const nuevaListaId = await guardarListaConCantosYTarjetas(
      draft.nombre,
      userId,
      cantosParaGuardar,
      tarjetasParaGuardar
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

  // const updateDraftAddSong = (id: string, song: Canto, numero: number) => {
  //   updateDraft(id, draft => ({ ...draft, cantos: [...draft.cantos, {numero: numero, canto: song }] }));
  // };

  const updateDraftAddElement = (id: string, element: Canto | Tarjeta, numero: number) => {
    if ("nombre" in element) {
      // Es Tarjeta
      updateDraft(id, draft => ({ ...draft, tarjetas: [...(draft.tarjetas || []), {numero: numero, tarjeta: element }] }));
    } else {
      // Es Canto
      updateDraft(id, draft => ({ ...draft, cantos: [...draft.cantos, {numero: numero, canto: element }] }));
    }
  };

  const updateDraftRemoveSong = (id: string, songId: string) => {
    updateDraft(id, draft => ({
      ...draft,
      cantos: draft.cantos.filter(c => c.canto.id !== songId)
    }));
  };

  // const updateDraftReorderSongs = (id: string, orderIds: string[]) => {
  //   updateDraft(id, draft => {
  //     const orderedSongs = orderIds
  //       .map(cid => draft.cantos.find(c => c.canto.id === cid))
  //       .filter(Boolean) as ElementoCanto[];
  //     return { ...draft, cantos: orderedSongs };
  //   });
  // };

  const updateDraftReorderElements = (id: string, orderIds: string[]) => {
    console.log("Reordenando elementos en borrador", id, orderIds);
    updateDraft(id, draft => {
      // Crear maps para acceso rápido
      const songMap = new Map(draft.cantos.map(c => [c.canto.id, c]));
      const cardMap = new Map(draft.tarjetas?.map(t => [t.tarjeta.id, t]));
      
      // Procesar todos los IDs en el orden dado
      const orderedSongs: ElementoCanto[] = [];
      const orderedCards: ElementoTarjeta[] = [];
      
      orderIds.forEach(elementId => {
        if (songMap.has(elementId)) {
          orderedSongs.push(songMap.get(elementId)!);
        } else if (cardMap.has(elementId)) {
          orderedCards.push(cardMap.get(elementId)!);
        }
        // Opcional: manejar IDs no encontrados
      });
      console.log("Reordenado - Songs:", orderedSongs, "Cards:", orderedCards);
      
      return { ...draft, cantos: orderedSongs, tarjetas: orderedCards };
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
    agregarElementoALista: (id, element, numero) => addElementToList(id, element, numero, updateDraftAddElement),
    removerCantoDeLista: (id, cantoId) => removeSongFromList(id, cantoId, updateDraftRemoveSong),
    reordenarElementosEnLista: (id, ordenIds) => reorderElementsInList(id, ordenIds, updateDraftReorderElements),
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