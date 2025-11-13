'use client';

import { useUser } from '@/context/UserContext';
import { usePresentation } from '../context/PresentationContext';
import LogoutButton from './LogoutButton';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link'
import { Icon } from './SvgIcons';

export default function MenuConfiguraciones() {
  const { isAuthenticated } = useUser();
  const { listas, crearLista, listaActivaId, setListaActivaId } = usePresentation();
  const [nuevoNombre, setNuevoNombre] = useState('');
  const router = useRouter();

  const handleCrearLista = () => {
    if (nuevoNombre.trim() !== '') {
      crearLista(nuevoNombre.trim());
      setNuevoNombre('');
    }
  };

  const handleAdmin = () => {
    router.push("/admin");
  };

  if (!isAuthenticated) {
    return (
      <div>
        No has iniciado sesión.
      </div>
    );
  }

  return (
    <div className="flex gap-4 fixed top-0 bg-background w-full z-50">
      {/* // Logo y enlace a la página principal */}
      <div className="flex items-center">
        <Link href="/">
          <Image alt="logo" src="/corchea.svg" width={30} height={30} className="mx-2" />
        </Link>
      </div>

      <LogoutButton />
      
      {/* // Crear nueva presentación */}
      <div className="flex items-center gap-2" title="Crear presentación">
        <input name="nombre" type="text" value={nuevoNombre} onChange={(e) => setNuevoNombre(e.target.value)} placeholder="Nombre de nueva presentación" className="border px-3 py-2 rounded-xl w-75 text-sm font-light text-secondary bg-background"/>
        <button onClick={handleCrearLista} >
          <Icon name="presentation" size="xl" className="fill-primary text-transparent hover:opacity-50" />
        </button>
      </div>

      {/* // Botón para administrar cantos */}
      <div className="flex items-center gap-2" title="Administrar cantos">
        <button
          onClick={handleAdmin}>
          <Icon name="admin" size="xl" className="fill-primary text-transparent hover:opacity-50" />
        </button>
      </div>

      {/* // Selector de presentación activa si hay más de una */}
      {listas.length > 1 && (
        <div className="flex gap-4 items-center">
          <label htmlFor="selector-lista" className="block font-medium">
            Selecciona una presentación:
          </label>
          <select id="selector-lista" value={listaActivaId ?? ''} onChange={(e) => setListaActivaId(e.target.value)} className="border rounded px-2 py-1">
            {listas.map((lista) => (
              <option key={lista.id} value={lista.id}>
                {lista.nombre}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}