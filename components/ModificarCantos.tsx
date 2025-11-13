'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useUser } from '@/context/UserContext';
import { useCantos } from '@/hooks/useCantos';
import { actualizarCanto } from '@/services/cantos';
import { Canto } from '@/types/supabase';
import toast from 'react-hot-toast';
import RemainingHeightDiv from '@/components/RemainingHeightDiv';
import BuscadorCantos from './BuscadorCantos';

export default function ModificarCantos() {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const { data: cantosCargados = [], isPending } = useCantos();

  const [cantosSeleccionados, setCantosSeleccionados] = useState<Canto[]>([]);
  const [editandoCantoId, setEditandoCantoId] = useState<string | null>(null);
  const [nuevoTitulo, setNuevoTitulo] = useState('');
  const [cantoABuscar, setCantoABuscar] = useState<string>('');
  const [nuevasEstrofas, setNuevasEstrofas] = useState<string[]>([]);
  const [cantidadEstrofas, setCantidadEstrofas] = useState(1);

  const key = ['cantos', user?.id ?? 'anon'];

  const mutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Pick<Canto, 'titulo' | 'estrofas'> }) =>
      actualizarCanto(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: key });

      const previous = queryClient.getQueryData<Canto[]>(key);

      // Optimista
      queryClient.setQueryData<Canto[]>(key, (old) =>
        old?.map((c) => (c.id === id ? { ...c, ...data } : c))
      );

      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(key, ctx.previous);
      toast.error('Error al actualizar el canto');
    },
    onSuccess: (serverCanto) => {
      // Usa el valor canónico del servidor
      queryClient.setQueryData<Canto[]>(key, (old) =>
        old?.map((c) => (c.id === serverCanto.id ? serverCanto : c))
      );
      // Si hay variantes de queries (p. ej. otras keys que empiezan con 'cantos'), puedes actualizar todas:
      // queryClient.setQueriesData<Canto[]>({ queryKey: ['cantos'] }, (old) => old?.map(...));
      toast.success('Canto actualizado exitosamente');
    },
    onSettled: () => {
      // Garantiza consistencia final
      queryClient.invalidateQueries({ queryKey: key });
    },
  });

  useEffect(() => {
    if (editandoCantoId && !cantosCargados.find((c) => c.id === editandoCantoId)) {
      resetAttributes();
    }
  }, [cantosCargados, editandoCantoId]);

  const handleGuardarCambios = () => {
    if (!editandoCantoId) return;

    const estrofasRecortadas = nuevasEstrofas.slice(0, cantidadEstrofas);
    const estrofasFiltradas = estrofasRecortadas.filter((e) => e && e.trim() !== '');

    mutation.mutate({
      id: editandoCantoId,
      data: { titulo: nuevoTitulo, estrofas: estrofasFiltradas },
    });

    resetAttributes();
  };

  const buscarCantoPorTitulo = (titulo: string) => {
    const cantosFiltrados = cantosCargados.filter((canto) =>
      canto.titulo.toLowerCase().includes(titulo.toLowerCase().trim())
    );
    setCantosSeleccionados(cantosFiltrados);
    if (cantosFiltrados.length === 1) {
      setAttributes(cantosFiltrados[0]);
    }
  };

  const setAttributes = (canto: Canto) => {
    setEditandoCantoId(canto.id);
    setNuevoTitulo(canto.titulo);
    setNuevasEstrofas(canto.estrofas);
    setCantidadEstrofas(canto.estrofas.length || 1);
    setCantosSeleccionados([canto]);
  };

  const resetAttributes = () => {
    setEditandoCantoId(null);
    setNuevoTitulo('');
    setNuevasEstrofas([]);
    setCantidadEstrofas(1);
    setCantosSeleccionados([]);
  };

  if (isPending) return <p className="mt-20 text-primary">Cargando...</p>;

  return (
    <div className="flex flex-col gap-4 w-full mx-auto bg-primary self-baseline mt-4 overflow-auto">
      <h1 className="text-3xl font-bold mb-4 text-center text-background uppercase">
        Modificar Cantos Existentes
      </h1>

      <BuscadorCantos value={cantoABuscar} onChange={setCantoABuscar} onSearch={buscarCantoPorTitulo} placeholder='Título del Canto a Modificar' />

      {cantosSeleccionados.length > 1 && (
        <div className="text-background text-center w-5/10 pt-3 m-auto">
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
                  <h2 className="text-xl font-medium text-background">{canto.titulo}</h2>
                  <button
                    onClick={() => setAttributes(canto)}
                    className="bg-primary text-white px-4 py-2 rounded hover:opacity-50"
                  >
                    Editar
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
            <h2 className="text-2xl font-medium text-background mb-2">Editando: {canto.titulo}</h2>
            <div className="flex justify-between">
              <div className="mb-4">
                <label className="text-background ">Título:
                  <input
                    name='tituloCanto'
                    type="text"
                    value={nuevoTitulo}
                    onChange={(e) => setNuevoTitulo(e.target.value)}
                    className="bg-background border border-primary w-100 text-secondary p-2 rounded-lg mt-1 ml-2"
                  />
                </label>
              </div>
              <div className="mb-4">
                <label className="text-background">Cantidad de diapositivas: 
                  <input
                    name='cantidadEstrofas'
                    type="number"
                    value={cantidadEstrofas}
                    onChange={(e) => setCantidadEstrofas(Number(e.target.value))}
                    min={1}
                    className="border border-primary text-xl w-15 text-secondary text-center bg-background p-2 rounded-lg mt-1 ml-2"
                  />
                </label>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-3 mt-4 mb-4">
              <h2 className="w-full text-2xl font-medium text-background mb-4 text-center">
                Diapositivas:
              </h2>
              {Array.from({ length: cantidadEstrofas }, (_, i) => (
                <div key={i} className="flex items-center">
                  <label className="text-background">{i + 1}.
                    <textarea
                      name={`estrofa-${i}`}
                      value={nuevasEstrofas[i] || ''}
                      onChange={(e) => {
                        const nuevas = [...nuevasEstrofas];
                        nuevas[i] = e.target.value;
                        setNuevasEstrofas(nuevas);
                      }}
                      className="border border-primary text-secondary bg-background p-2 rounded-lg mt-1 ml-2 h-40 w-80"
                    />
                  </label>
                </div>
              ))}
            </div>

            <button
              onClick={handleGuardarCambios}
              disabled={mutation.isPending}
              className="bg-secondary text-white px-4 py-2 mr-10 my-4 w-50 self-end rounded hover:opacity-50 disabled:opacity-50"
            >
              {mutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        ))}
    </div>
  );
}