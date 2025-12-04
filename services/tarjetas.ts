// services/tarjetas.ts
import { supabase } from '@/lib/supabaseClient';
import { Tarjeta } from '@/types/supabase';

export async function obtenerTarjetas(): Promise<Tarjeta[]> {
    const { data, error } = await supabase
      .from('tarjetas')
      .select('*')
      .order('nombre', { ascending: true });
  
    if (error || !data) {
      console.error('Error al obtener tarjetas:', error?.message);
      return [];
    }
  
    return data as Tarjeta[];
}

export async function crearTarjeta(tarjeta: Partial<Tarjeta>): Promise<Tarjeta> {
    const { data, error } = await supabase
      .from('tarjetas')
      .insert(tarjeta)
      .select()
      .single();
  
    if (error) {
      throw new Error('Error al crear el tarjeta: ' + error.message);
    }
  
    return data as Tarjeta;
}

export async function actualizarTarjeta(tarjeta: Partial<Tarjeta> & { id: string }): Promise<Tarjeta> {
    const { id, ...datosActualizar } = tarjeta;
    
    const { data, error } = await supabase
      .from('tarjetas')
      .update(datosActualizar)
      .eq('id', id)
      .select()
      .single();
  
    if (error) {
      throw new Error('Error al actualizar la tarjeta: ' + error.message);
    }
  
    return data as Tarjeta;
}

export const agregarTarjetaALista = async (
  listaId: string,
  tarjetaId: string,
  orden?: number
) => {
  const { error } = await supabase
    .from("lista_tarjetas")
    .upsert({
      lista_id: listaId,
      tarjeta_id: tarjetaId,
      orden: orden || 0,
    });

  if (error) throw error;
  return true;
};

export const removerTarjetaDeLista = async (
  listaId: string,
  tarjetaId: string
) => {
  const { error } = await supabase
    .from("lista_tarjetas")
    .delete()
    .match({ lista_id: listaId, tarjeta_id: tarjetaId });

  if (error) throw error;
  return true;
};

export const reordenarTarjetasEnLista = async (
  listaId: string,
  tarjetaIds: string[]
) => {
  // Crear batch de updates
  const updates = tarjetaIds.map((tarjetaId, index) =>
    supabase
      .from("lista_tarjetas")
      .update({ orden: index })
      .match({ lista_id: listaId, tarjeta_id: tarjetaId })
  );

  const results = await Promise.all(updates);
  const error = results.find(r => r.error)?.error;
  
  if (error) throw error;
  return true;
};