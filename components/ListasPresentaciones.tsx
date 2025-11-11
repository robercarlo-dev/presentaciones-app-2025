// //Componente que muestra las listas de presentaciones y permite activar una lista
"use client";

import { usePresentation } from '../context/PresentationContext';
import ListaPresentaciones from './ListaPresentaciones';

export default function ListasPresentaciones() {
  const { listas, listaActivaId } = usePresentation();

  if (listas.length === 0) {
    return (
      <div className="mt-14 text-gray-500 italic">
        No hay presentaciones creadas aún.
      </div>
    );
  }

  return (
    <div className="space-y-4 mt-10">
      {/* Mostrar solo la lista activa */}
      {listas
        .filter((lista) => lista.id === listaActivaId)
        .map((lista) => (
          <div
            key={lista.id}
            className="border rounded rounded-xl bg-primary drop-shadow-xl/50"
          >
            <ListaPresentaciones listaId={lista.id} />
          </div>
        ))}
    </div>
  );
}