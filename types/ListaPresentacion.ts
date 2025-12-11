// Definition of the ListaPresentacion type
import { Canto, Tarjeta } from '@/types/supabase';

// Nuevo tipo que representa un elemento de la lista de cantos
export type ElementoCanto = {
  numero: number; // El número indica el orden o alguna referencia numérica
  canto: Canto;   // Objeto del tipo Canto
};

// Nuevo tipo que representa un elemento de la lista de tarjetas
export type ElementoTarjeta = {
  numero: number; // El número indica el orden o alguna referencia numérica
  tarjeta: Tarjeta; // Objeto del tipo Tarjeta
};

export type ListaPresentacion = {
    id: string; // UUID
    nombre: string;
    usuarioId?: string;
    cantos: ElementoCanto[];
    tarjetas?: ElementoTarjeta[]; // Opcional: lista de tarjetas asociadas
    isSaved?: boolean; // Indica si la lista está guardada en la base de datos
  };