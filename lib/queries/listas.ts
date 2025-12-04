import { supabase } from "@/lib/supabaseClient";
import { obtenerListasDelUsuario } from "@/services/listas";
import { Canto, Tarjeta } from "@/types/supabase";
import { ListaPresentacion } from "@/types/ListaPresentacion";

async function obtenerCantosDeLista(listaId: string, cantos: Canto[]): Promise<Canto[]> {
 
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

  if (!cantos) return [];
  const cantosData = cantos.filter((canto) => cantoIds.includes(canto.id));

  const indexById = new Map(cantoIds.map((id, idx) => [id, idx]));
  return (cantosData as Canto[]).slice().sort(
    (a, b) => (indexById.get(a.id) ?? 0) - (indexById.get(b.id) ?? 0)
  );
}

async function obtenerTarjetasDeLista(listaId: string): Promise<Tarjeta[]> {
  const { data, error } = await supabase
    .from("lista_tarjetas")
    .select("tarjeta_id")
    .eq("lista_id", listaId);

  if (error) {
    console.error("Error al obtener tarjetas de la lista:", error.message);
    return [];
  }

  return (data ?? []).map((i) => i.tarjeta_id);
}

export async function fetchListasConCantos(usuarioId: string, cantos: Canto[]): Promise<ListaPresentacion[]> {
  const listasGuardadas = await obtenerListasDelUsuario(usuarioId);
  const listasTransformadas: ListaPresentacion[] = await Promise.all(
    listasGuardadas.map(async (lista) => ({
      id: lista.id,
      nombre: lista.nombre,
      cantos: await obtenerCantosDeLista(lista.id, cantos),
      isSaved: true,
    }))
  );
  return listasTransformadas;
}

export async function fetchListasConCantosYTarjetas(usuarioId: string, cantos: Canto[]): Promise<ListaPresentacion[]> {
  const listasGuardadas = await obtenerListasDelUsuario(usuarioId);
  const listasTransformadas: ListaPresentacion[] = await Promise.all(
    listasGuardadas.map(async (lista) => ({
      id: lista.id,
      nombre: lista.nombre,
      cantos: await obtenerCantosDeLista(lista.id, cantos),
      tarjetas: await obtenerTarjetasDeLista(lista.id),
      isSaved: true,
    }))
  );
  return listasTransformadas;
}