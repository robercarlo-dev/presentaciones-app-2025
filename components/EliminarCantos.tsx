'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useUser } from '@/context/UserContext';
import { useCantos } from '@/hooks/useCantos';
import { eliminarCanto } from '@/services/cantos';
import { Canto } from '@/types/supabase';
import toast from 'react-hot-toast';
import RemainingHeightDiv from '@/components/RemainingHeightDiv';
import BuscadorCantos from './BuscadorCantos';
import BotonEliminarCanto from './BotonEliminarCanto';

export default function EliminarCantos() {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const { data: cantosCargados = [], isPending } = useCantos();

  const [cantosSeleccionados, setCantosSeleccionados] = useState<Canto[]>([]);
  const [cantoABuscar, setCantoABuscar] = useState<string>('');

  // Usa la misma key que en ModificarCantos para mantener el caché consistente
  const key = ['cantos', user?.id ?? 'anon'];

  const mutation = useMutation({
    mutationFn: (id: string) => eliminarCanto(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: key });

      const previous = queryClient.getQueryData<Canto[]>(key);

      // Actualización optimista: quita el canto del caché
      queryClient.setQueryData<Canto[]>(key, (old) =>
        old?.filter((c) => c.id !== id)
      );

      // También saca el canto de la selección actual
      setCantosSeleccionados((prev) => prev.filter((c) => c.id !== id));

      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(key, ctx.previous);
      toast.error('Error al eliminar el canto');
    },
    onSuccess: () => {
      toast.success('Canto eliminado exitosamente');
    },
    onSettled: () => {
      // Garantiza consistencia final con el servidor
      queryClient.invalidateQueries({ queryKey: key });
    },
  });

  // Si el canto seleccionado desaparece del caché (por ejemplo, tras eliminar/invalidar), limpia selección
  useEffect(() => {
    if (
      cantosSeleccionados.length === 1 &&
      !cantosCargados.find((c) => c.id === cantosSeleccionados[0].id)
    ) {
      resetAttributes();
    }
  }, [cantosCargados, cantosSeleccionados]);

  const resetAttributes = () => {
    setCantosSeleccionados([]);
  };

  if (isPending) return <p className="mt-20 text-primary">Cargando...</p>;

  return (
    <div className="flex flex-col gap-4 w-full mx-auto bg-primary self-baseline mt-4 overflow-auto">
      <h1 className="text-3xl font-bold mb-4 text-center text-background uppercase">
        Eliminar Cantos Existentes
      </h1>

      <BuscadorCantos
        className="mx-auto w-9/10 sm:w-100"
        value={cantoABuscar}
        onChange={setCantoABuscar}
        placeholder="Título del Canto a Eliminar"
        cantosAFiltrar={cantosCargados}
        setCantosFiltrados={setCantosSeleccionados}
      />

      {cantosSeleccionados.length > 1 && (
        <div className="text-background text-center w-9/10 lg:w-5/10 pt-3 m-auto">
          <h2 className="text-2xl font-medium text-background mb-4 text-center">
            Resultados de la búsqueda:
          </h2>
          <RemainingHeightDiv className="overflow-auto" minHeight={400} offset={34}>
            <ul>
              {cantosSeleccionados.map((canto) => (
                <li
                  key={canto.id}
                  className="flex gap-3 justify-between items-center border border-primary rounded-lg p-2 mb-1 bg-secondary"
                >
                  <h2 className="text-xl font-medium text-background truncate block overflow-hidden whitespace-nowrap">{canto.titulo}</h2>
                  <button
                    onClick={() => setCantosSeleccionados([canto])}
                    className="bg-primary text-white px-4 py-2 rounded hover:opacity-50"
                  >
                    Seleccionar
                  </button>
                </li>
              ))}
            </ul>
          </RemainingHeightDiv>
        </div>
      )}

      {cantosSeleccionados.length === 1 &&
        cantosSeleccionados.map((canto) => (
          <div
            key={canto.id}
            className="flex flex-col border border-primary rounded-lg p-4 mb-4 bg-secondary/10 mx-4"
          >
            <h2 className="text-2xl font-medium text-background mb-2">
              Eliminar: {canto.titulo}
            </h2>

            <div className="flex flex-col justify-between">
              <div className="mb-4">
                <label className="text-background mr-2">Título:</label>
                <p className="bg-background border border-primary w-9/10 sm:w-100 text-secondary p-2 rounded-lg mt-1">
                  {canto.titulo}
                </p>
              </div>
              <div className="mb-4">
                <label className="text-background mr-2">Cantidad de diapositivas: </label>
                <p className="border border-primary text-xl w-15 text-secondary text-center bg-background p-2 rounded-lg mt-1">
                  {canto.estrofas.length}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-3 mt-4 mb-4">
              <h2 className="w-full text-2xl font-medium text-background mb-4 text-center">
                Diapositivas:
              </h2>
              {canto.estrofas.map((estrofa, i) => (
                <div key={i} className="flex items-center">
                  <label className="text-background mr-2">{i + 1}:</label>
                  <p className="border border-primary text-secondary bg-background p-2 rounded-lg mt-1 h-40 w-80">
                    {estrofa}
                  </p>
                </div>
              ))}
            </div>

            <BotonEliminarCanto
                canto={canto}
                loading={mutation.isPending}
                onConfirm={() => mutation.mutate(canto.id)}
            />
          </div>
        ))}
    </div>
  );
}