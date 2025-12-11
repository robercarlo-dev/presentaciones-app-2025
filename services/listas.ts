import { supabase } from '@/lib/supabaseClient';
import { Lista } from '@/types/supabase';

export async function guardarListaConCantosYTarjetas(
  nombre: string,
  usuarioId: string,
  cantos: {id:string, numero:number}[], // array de IDs de cantos
  tarjetas: {id:string, numero:number}[], // array de IDs de cantos
  // array de IDs de tarjetas
) {
  console.log('Guardando lista:', { nombre, usuarioId, cantos, tarjetas });
  const { data: listaData, error: listaError } = await supabase
    .from('listas')
    .insert([{ nombre, usuario_id: usuarioId }])
    .select("id")
    .single();

  if (listaError || !listaData) {
    console.error("Error al insertar lista:", listaError);
    throw listaError; // Re-lanza el error para que el componente lo maneje
  }

  const listaId = listaData.id;

  const listaCantos = cantos.map((canto) => ({
    lista_id: listaId,
    canto_id: canto.id,
    orden: canto.numero,
  }));

  const { error: cantosError } = await supabase
    .from('lista_cantos')
    .insert(listaCantos);

  if (cantosError) {
    console.error("Error al insertar lista_cantos:", cantosError);
    // Considera eliminar la lista si falla la inserción en lista_cantos
    await supabase.from("listas").delete().eq("id", listaId);
    throw cantosError;  // Re-lanza el error
  }

  const listaTarjetas = tarjetas.map((tarjeta) => ({
    lista_id: listaId,
    tarjeta_id: tarjeta.id,
    orden: tarjeta.numero,
  }));

  const { error: tarjetasError } = await supabase
    .from('lista_tarjetas')
    .insert(listaTarjetas);
  
    if (tarjetasError) {
    console.error("Error al insertar lista_tarjetas:", tarjetasError);
    // Considera eliminar la lista y los cantos si falla la inserción en lista_tarjetas
    await supabase.from("lista_cantos").delete().eq("lista_id", listaId);
    await supabase.from("listas").delete().eq("id", listaId);
    throw tarjetasError;  // Re-lanza el error
  }

  return listaId;
}

export async function obtenerListasDelUsuario(usuarioId: string): Promise<Lista[]> {
    const { data, error } = await supabase
      .from('listas')
      .select('*')
      .eq('usuario_id', usuarioId)
      .order('fecha_creacion', { ascending: false });
  
    if (error) {
      console.error('Error al obtener listas:', error.message);
      return [];
    }
  
    return data as Lista[];
  }

  export async function obtenerIdsCantosGuardados(listaId: string): Promise<[]> {
    const { data, error } = await supabase
      .from('lista_cantos')
      .select('*')
      .eq('lista_id', listaId)
      .order('orden', { ascending: false });
  
    if (error) {
      console.error('Error al obtener cantos:', error.message);
      return [];
    }
  
    return data as [];
  }

  export async function actualizarListaConCantos(
    listaId: string,
    nuevoNombre: string,
    nuevosCantos: string[] // array de IDs de cantos
  ) {
    // Actualizar el nombre de la lista
    const { error: listaError } = await supabase
      .from('listas')
      .update({ nombre: nuevoNombre })
      .eq('id', listaId);
  
    if (listaError) throw listaError;
  
    // Obtener los cantos actuales de la lista
    const { data: cantosActuales, error: cantosError } = await supabase
      .from('lista_cantos')
      .select('*')
      .eq('lista_id', listaId);
  
    if (cantosError) throw cantosError;
  
    // Crear un mapa de los cantos actuales para facilitar la comparación
    const cantosActualesMap = new Map(
      cantosActuales.map((canto: any) => [canto.canto_id, canto])
    );
  
    // Determinar los cantos a agregar, eliminar y actualizar
    const cantosAAgregar = nuevosCantos.filter(
      (cantoId) => !cantosActualesMap.has(cantoId)
    );
    const cantosAEliminar = cantosActuales.filter(
      (canto: any) => !nuevosCantos.includes(canto.canto_id)
    );
    const cantosAActualizar = nuevosCantos.filter((cantoId, index) => {
      const cantoActual = cantosActualesMap.get(cantoId);
      return cantoActual && cantoActual.orden !== index;
    });
  
    // Agregar nuevos cantos
    if (cantosAAgregar.length > 0) {
      const nuevosCantosData = cantosAAgregar.map((cantoId, index) => ({
        lista_id: listaId,
        canto_id: cantoId,
        orden: index,
      }));
  
      const { error: agregarError } = await supabase
        .from('lista_cantos')
        .insert(nuevosCantosData);
  
      if (agregarError) throw agregarError;
    }
  
    // Eliminar cantos que ya no están en la lista
    if (cantosAEliminar.length > 0) {
      const { error: eliminarError } = await supabase
        .from('lista_cantos')
        .delete()
        .in(
          'canto_id',
          cantosAEliminar.map((canto: any) => canto.canto_id)
        );
  
      if (eliminarError) throw eliminarError;
    }
  
    // Actualizar el orden de los cantos existentes
    for (const cantoId of cantosAActualizar) {
      const nuevoOrden = nuevosCantos.indexOf(cantoId);
  
      const { error: actualizarError } = await supabase
        .from('lista_cantos')
        .update({ orden: nuevoOrden })
        .eq('lista_id', listaId)
        .eq('canto_id', cantoId);
  
      if (actualizarError) throw actualizarError;
    }
  
    return listaId;
  }
  