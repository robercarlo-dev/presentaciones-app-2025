// Definition of the ListaPresentacion type
import { Canto, Tarjeta } from '@/types/supabase';

export type ListaPresentacion = {
    id: string; // UUID
    nombre: string;
    usuarioId?: string;
    cantos: Canto[];
    tarjetas?: Tarjeta[]; // Opcional: lista de tarjetas asociadas
    isSaved?: boolean; // Indica si la lista está guardada en la base de datos
  };