'use client';

import { useUser } from '@/context/UserContext';
import { Icon } from './SvgIcons';

export default function LogoutButton() {
  const { user, isAuthenticated, loading, signOut, authReady, } = useUser();

  if (!authReady || loading) return <div>Cargando usuario…</div>;

  if (!isAuthenticated) {
    return (
      <div>
        No has iniciado sesión.
      </div>
    );
  }

  return (
    <div className="flex my-4 justify-start gap-5 text-secondary">
      <h1>Hola, {user?.nombre}</h1>
      <button
        onClick={signOut}
        aria-label="Cerrar sesión"
        className="transition-opacity hover:opacity-50"
      >
        <Icon name="logout" size="lg" className="fill-primary text-transparent" />
      </button>
    </div>
  );
}