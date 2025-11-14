'use client';

import { useUser } from '@/context/UserContext';
import { Icon } from './SvgIcons';

export default function LogoutButton() {
  const { isAuthenticated, loading, signOut, authReady, } = useUser();

  if (!authReady || loading) return <div>Cargando usuario…</div>;

  if (!isAuthenticated) {
    return (
      <div>
        No has iniciado sesión.
      </div>
    );
  }

  return (
    <div className="flex my-4 justify-end gap-5 text-primary">
      <button
        onClick={signOut}
        aria-label="Cerrar sesión"
        className="flex gap-2 items-center transition-opacity hover:opacity-50"
      >
        <Icon name="logout" size="lg" className="fill-primary text-transparent" />
        Salir
      </button>
    </div>
  );
}