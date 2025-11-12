// services/cantos.ts
import { supabase } from '@/lib/supabaseClient';
import { Canto } from '@/types/supabase';

export async function obtenerCantos(): Promise<Canto[]> {
  const { data, error } = await supabase
    .from('cantos')
    .select('*')
    .order('titulo', { ascending: true });

  if (error || !data) {
    console.error('Error al obtener cantos:', error?.message);
    return [];
  }

  return data as Canto[];
}

export async function selectCanto(cantoId: string): Promise<Canto[]> {
  const { data, error } = await supabase
    .from('cantos')
    .select('*')
    .eq('id', cantoId);

  if (error) {
    console.error('Error al obtener cantos:', error.message);
    return [];
  }

  return data as Canto[];
}

export async function crearCanto(canto: Partial<Canto>): Promise<Canto> {
  const { data, error } = await supabase
    .from('cantos')
    .insert(canto)
    .select()
    .single();

  if (error) {
    throw new Error('Error al crear el canto: ' + error.message);
  }

  return data as Canto;
}

// DEVUELVE el registro actualizado
export async function actualizarCanto(cantoId: string, cambios: Partial<Canto>): Promise<Canto> {
  const esUUIDValido = (id: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  if (!esUUIDValido(cantoId)) {
    throw new Error('ID de canto inválido: ' + cantoId);
  }

  const { data, error } = await supabase
    .from('cantos')
    .update(cambios)
    .eq('id', cantoId)
    .select()
    .single(); // <- importante para obtener una fila

  if (error) {
    throw new Error('Error al actualizar el canto: ' + error.message);
  }

  return data as Canto;
}

export async function eliminarCanto(cantoId: string): Promise<void> {
  const { error } = await supabase.from('cantos').delete().eq('id', cantoId);
  if (error) {
    throw new Error('Error al eliminar el canto: ' + error.message);
  }
}

export async function obtenerFavoritos(userId: string) {
  const { data, error } = await supabase
    .from('favoritos')
    .select('canto_id')
    .eq('user_id', userId);

  if (error) throw error;
  return data.map((f) => f.canto_id);
}

export async function agregarFavorito(userId: string, cantoId: string) {
  const { error } = await supabase
    .from('favoritos')
    .insert([{ user_id: userId, canto_id: cantoId }]);
  if (error) throw error;
}

export async function quitarFavorito(userId: string, cantoId: string) {
  const { error } = await supabase
    .from('favoritos')
    .delete()
    .match({ user_id: userId, canto_id: cantoId });
  if (error) throw error;
}