'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useUser } from '@/context/UserContext';
import { crearCanto } from '@/services/cantos';
import { Canto } from '@/types/supabase';
import toast from 'react-hot-toast';

export default function AgregarCantos() {
  const { user } = useUser();
  const queryClient = useQueryClient();

  const [nuevoTitulo, setNuevoTitulo] = useState('');
  const [nuevasEstrofas, setNuevasEstrofas] = useState<string[]>([]);
  const [cantidadEstrofas, setCantidadEstrofas] = useState(1);

  // Usa la misma key que en Modificar/Eliminar para mantener el caché consistente
  const key = ['cantos', user?.id ?? 'anon'];

  const mutation = useMutation({
    mutationFn: (data: Pick<Canto, 'titulo' | 'estrofas'>) => crearCanto(data),
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: key });

      const previous = queryClient.getQueryData<Canto[]>(key);

      // Optimista: agrega un canto temporal al inicio de la lista
      const tempId = `temp-${Date.now()}`;
      const tempCanto = {
        id: tempId,
        titulo: data.titulo,
        estrofas: data.estrofas,
        uso_total: 0,
        ultima_vez_usado: null,
      } as Canto;

      queryClient.setQueryData<Canto[]>(key, (old) => [tempCanto, ...(old ?? [])]);

      return { previous, tempId };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(key, ctx.previous);
      toast.error('Error al crear el canto');
    },
    onSuccess: (serverCanto, _vars, ctx) => {
      // Reemplaza el canto temporal por el que devuelve el servidor
      queryClient.setQueryData<Canto[]>(key, (old) =>
        (old ?? []).map((c) => (c.id === ctx?.tempId ? serverCanto : c))
      );
      toast.success('Canto creado exitosamente');
    },
    onSettled: () => {
      // Garantiza consistencia final
      queryClient.invalidateQueries({ queryKey: key });
    },
  });

  const handleCrearCanto = () => {
    const titulo = nuevoTitulo.trim();

    const estrofasRecortadas = nuevasEstrofas.slice(0, cantidadEstrofas);
    const estrofas = estrofasRecortadas
      .map((e) => (e ?? '').trim())
      .filter((e) => e.length > 0);

    if (!titulo) {
      toast.error('El título no puede estar vacío');
      return;
    }
    if (estrofas.length === 0 || estrofas.length !== cantidadEstrofas) {
      toast.error('Todas las diapositivas deben estar completas');
      return;
    }

    mutation.mutate({ titulo, estrofas });

    // Limpia el formulario (opcional: podrías esperar onSuccess)
    setNuevoTitulo('');
    setNuevasEstrofas([]);
    setCantidadEstrofas(1);
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!mutation.isPending) handleCrearCanto();
      }}
      className="flex flex-col gap-4 w-full mx-auto bg-primary self-baseline mt-4"
    >
      <h1 className="text-3xl font-bold mb-4 text-center text-background uppercase">
        Agregar Canto Nuevo
      </h1>

      <div className="flex mx-4 justify-around pb-10">
        <div>
          <label className="text-background">
            Título:
            <input
              name="titulo"
              type="text"
              value={nuevoTitulo}
              onChange={(e) => setNuevoTitulo(e.target.value)}
              className="bg-background border border-primary w-100 text-secondary p-2 rounded-lg mt-1 ml-2"
              disabled={mutation.isPending}
            />
          </label>
        </div>
        <div>
          <label className="text-background mr-2">
            Cantidad de diapositivas:
            <input
              name="cantidadstrofas"
              type="number"
              min={1}
              value={cantidadEstrofas}
              onChange={(e) => setCantidadEstrofas(Number(e.target.value))}
              className="border border-primary text-xl w-15 text-secondary text-center bg-background p-2 rounded-lg mt-1 ml-2"
              disabled={mutation.isPending}
            />
          </label>
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-3 mt-4 pb-10">
        <h2 className="w-full text-2xl font-medium text-background mb-4 text-center">
          Diapositivas:
        </h2>
        {Array.from({ length: cantidadEstrofas }, (_, i) => (
          <div key={i} className="flex items-center">
            <label className="text-background">
              {i + 1}.
              <textarea
                name={`estrofa-${i}`}
                value={nuevasEstrofas[i] || ''}
                onChange={(e) => {
                  const nuevas = [...nuevasEstrofas];
                  nuevas[i] = e.target.value;
                  setNuevasEstrofas(nuevas);
                }}
                className="border border-primary text-secondary bg-background p-2 rounded-lg mt-1 ml-2 h-40 w-80"
                disabled={mutation.isPending}
              />
            </label>
          </div>
        ))}
      </div>

      <button
        type="submit"
        disabled={mutation.isPending}
        className="bg-secondary text-white px-4 py-2 mr-10 mb-10 w-40 self-end rounded hover:opacity-50 disabled:opacity-50"
      >
        {mutation.isPending ? 'Creando...' : 'Crear Canto'}
      </button>
    </form>
  );
}