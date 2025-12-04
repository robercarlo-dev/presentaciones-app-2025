// hooks/useDraftLists.ts
import { useState, useEffect } from "react";
import { ListaPresentacion } from "@/types/ListaPresentacion";

const DRAFTS_KEY_PREFIX = "presentacion:drafts:";

const getStorageKey = (userId?: string) => `${DRAFTS_KEY_PREFIX}${userId ?? "anon"}`;

export const useDraftLists = (userId?: string) => {
  const [drafts, setDrafts] = useState<ListaPresentacion[]>([]);

  // Cargar borradores desde localStorage
  useEffect(() => {
    const key = getStorageKey(userId);
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem(key) : null;
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setDrafts(parsed);
        }
      }
    } catch (error) {
      console.error("Error cargando borradores:", error);
    }
  }, [userId]);

  // Guardar borradores en localStorage
  useEffect(() => {
    const key = getStorageKey(userId);
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(key, JSON.stringify(drafts));
      }
    } catch (error) {
      console.error("Error guardando borradores:", error);
    }
  }, [drafts, userId]);

  const addDraft = (draft: ListaPresentacion) => {
    setDrafts(prev => [draft, ...prev]);
  };

  const updateDraft = (id: string, updater: (draft: ListaPresentacion) => ListaPresentacion) => {
    setDrafts(prev => prev.map(draft => draft.id === id ? updater(draft) : draft));
  };

  const removeDraft = (id: string) => {
    setDrafts(prev => prev.filter(draft => draft.id !== id));
  };

  const isDraft = (id: string) => {
    return drafts.some(draft => draft.id === id);
  };

  return {
    drafts,
    setDrafts,
    addDraft,
    updateDraft,
    removeDraft,
    isDraft
  };
};