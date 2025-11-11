// Definition of the ListaPresentacion type
import { Canto } from '@/types/supabase';

export type ListaPresentacion = {
    id: string; // UUID
    nombre: string;
    usuarioId?: string;
    cantos: Canto[];
    isSaved?: boolean; // Indica si la lista está guardada en la base de datos
  };