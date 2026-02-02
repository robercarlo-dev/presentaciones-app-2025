import { supabase } from "@/lib/supabaseClient";
import { obtenerListasDelUsuario } from "@/services/listas";
import { Canto, Tarjeta } from "@/types/supabase";
import { ListaPresentacion, ElementoCanto, ElementoTarjeta } from "@/types/ListaPresentacion";

async function obtenerCantosDeLista(listaId: string, cantos: Canto[]): Promise<ElementoCanto[]> {
  const { data, error } = await supabase
    .from("lista_cantos")
    .select("canto_id, orden")
    .eq("lista_id", listaId)

  if (error) {
    console.error("Error al obtener cantos de la lista:", error.message);
    return [];
  }

  const cantoIds = (data ?? []).map((canto) => canto.canto_id);
  if (cantoIds.length === 0) return [];


  if (!cantos) return [];
  const cantosData = cantos.filter((canto) => cantoIds.includes(canto.id));

  const elementosCanto: ElementoCanto[] = cantosData.map((canto) => {
    const numero = data?.find((item) => item.canto_id === canto.id)?.orden || 0;
    return {
      numero: numero,
      canto: canto!,
    };
  });

  // console.log("Elementos de canto obtenidos:", elementosCanto);

  return elementosCanto;

}

async function obtenerTarjetasDeLista(listaId: string, tarjetas: Tarjeta[]): Promise<ElementoTarjeta[]> {
  const { data, error } = await supabase
    .from("lista_tarjetas")
    .select("tarjeta_id, orden")
    .eq("lista_id", listaId);

  if (error) {
    console.error("Error al obtener tarjetas de la lista:", error.message);
    return [];
  }

  const tarjetaIds = (data ?? []).map((tarjeta) => tarjeta.tarjeta_id);
  if (tarjetaIds.length === 0) return [];


  if (!tarjetas) return [];
  const tarjetasData = tarjetas.filter((tarjeta) => tarjetaIds.includes(tarjeta.id));

  const elementosTarjeta: ElementoTarjeta[] = tarjetasData.map((tarjeta) => {
    const numero = data?.find((item) => item.tarjeta_id === tarjeta.id)?.orden || 0;
    return {
      numero: numero,
      tarjeta: tarjeta!,
    };
  });

  console.log("Elementos de tarjeta obtenidos:", elementosTarjeta);

  return elementosTarjeta;

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

export async function fetchListasConCantosYTarjetas(usuarioId: string, cantos: Canto[], tarjetas: Tarjeta[]): Promise<ListaPresentacion[]> {
  const listasGuardadas = await obtenerListasDelUsuario(usuarioId);
  const listasTransformadas: ListaPresentacion[] = await Promise.all(
    listasGuardadas.map(async (lista) => ({
      id: lista.id,
      nombre: lista.nombre,
      cantos: await obtenerCantosDeLista(lista.id, cantos),
      tarjetas: await obtenerTarjetasDeLista(lista.id, tarjetas),
      isSaved: true,
    }))
  );
  return listasTransformadas;
}