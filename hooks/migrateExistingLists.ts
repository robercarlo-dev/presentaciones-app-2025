// scripts/migrateExistingLists.ts
import { supabase } from "@/lib/supabaseClient";
import { migrarListaANuevaEstructura } from "@/services/listas";

export const migrarListasExistentes = async (usuarioId: string) => {
  try {
    // Obtener todas las listas del usuario
    const { data: listas, error } = await supabase
      .from("listas")
      .select("id")
      .eq("usuario_id", usuarioId);

    if (error) throw error;

    // Para cada lista, crear items_orden
    for (const lista of listas || []) {
      // Obtener cantos de la lista
      const { data: listaCantos } = await supabase
        .from("lista_cantos")
        .select("canto_id")
        .eq("lista_id", lista.id)
        .order("orden", { ascending: true });

      // Obtener tarjetas de la lista
      const { data: listaTarjetas } = await supabase
        .from("lista_tarjetas")
        .select("tarjeta_id")
        .eq("lista_id", lista.id)
        .order("orden", { ascending: true });

      // Crear items_orden combinando ambos (cantos primero, luego tarjetas)
      const itemsOrden = [
        ...(listaCantos || []).map((item, index) => ({
          id: crypto.randomUUID(),
          tipo: 'canto' as const,
          item_id: item.canto_id,
          orden: index + 1
        })),
        ...(listaTarjetas || []).map((item, index) => ({
          id: crypto.randomUUID(),
          tipo: 'tarjeta' as const,
          item_id: item.tarjeta_id,
          orden: (listaCantos?.length || 0) + index + 1
        }))
      ];

      // Migrar lista
      if (itemsOrden.length > 0) {
        await migrarListaANuevaEstructura(lista.id, itemsOrden);
        console.log(`Lista ${lista.id} migrada exitosamente`);
      }
    }

    console.log("Migración completada");
  } catch (error) {
    console.error("Error en migración:", error);
  }
};