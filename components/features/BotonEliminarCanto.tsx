'use client';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import { Canto } from '@/types/supabase';

export default function BotonEliminarCanto({
  canto,
  onConfirm,
  loading,
}: {
  canto: Canto;
  onConfirm: () => void;
  loading?: boolean;
}) {
  return (
    <AlertDialog.Root>
      <AlertDialog.Trigger asChild>
        <button
          className="w-40 mx-auto bg-red-600 text-white px-4 py-2 rounded hover:opacity-75 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'Eliminando...' : 'Eliminar Canto'}
        </button>
      </AlertDialog.Trigger>

      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 bg-black/50" />
        <AlertDialog.Content className="fixed left-1/2 top-1/2 w-[95vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-4 shadow focus:outline-none">
          <AlertDialog.Title className="text-lg font-semibold">
            Eliminar canto
          </AlertDialog.Title>
          <AlertDialog.Description className="mt-2 text-sm text-gray-600">
            Vas a eliminar “{canto.titulo}”. Esta acción es irreversible.
          </AlertDialog.Description>

          <div className="mt-4 flex justify-end gap-3">
            <AlertDialog.Cancel asChild>
              <button className="px-4 py-2 rounded border">Cancelar</button>
            </AlertDialog.Cancel>
            <AlertDialog.Action asChild>
              <button
                onClick={onConfirm}
                disabled={loading}
                className="px-4 py-2 rounded bg-red-600 text-white disabled:opacity-50"
              >
                {loading ? 'Eliminando...' : 'Eliminar'}
              </button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}