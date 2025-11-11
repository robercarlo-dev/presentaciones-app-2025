import { supabase } from "@/lib/supabaseClient";
import { obtenerListasDelUsuario } from "@/services/listas";
import { Canto } from "@/types/supabase";
import { ListaPresentacion } from "@/types/ListaPresentacion";

async function obtenerCantosDeLista(listaId: string): Promise<Canto[]> {
  const { data, error } = await supabase
    .from("lista_cantos")
    .select("canto_id, orden")
    .eq("lista_id", listaId)
    .order("orden", { ascending: true });

  if (error) {
    console.error("Error al obtener cantos de la lista:", error.message);
    return [];
  }

  const cantoIds = (data ?? []).map((i) => i.canto_id);
  if (cantoIds.length === 0) return [];

  const { data: cantosData, error: cantosError } = await supabase
    .from("cantos")
    .select("*")
    .in("id", cantoIds);

  if (cantosError) {
    console.error("Error al obtener detalles de los cantos:", cantosError.message);
    return [];
  }

  const indexById = new Map(cantoIds.map((id, idx) => [id, idx]));
  return (cantosData as Canto[]).slice().sort(
    (a, b) => (indexById.get(a.id) ?? 0) - (indexById.get(b.id) ?? 0)
  );
}

export async function fetchListasConCantos(usuarioId: string): Promise<ListaPresentacion[]> {
  const listasGuardadas = await obtenerListasDelUsuario(usuarioId);
  const listasTransformadas: ListaPresentacion[] = await Promise.all(
    listasGuardadas.map(async (lista) => ({
      id: lista.id,
      nombre: lista.nombre,
      cantos: await obtenerCantosDeLista(lista.id),
      isSaved: true,
    }))
  );
  return listasTransformadas;
}