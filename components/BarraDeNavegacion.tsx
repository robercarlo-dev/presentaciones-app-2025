'use client';

import { useUser } from '@/context/UserContext';
import { usePresentation } from '../context/PresentationContext';
import MenuDeUsuario from './MenuDeUsuario';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link'
import { Icon } from './SvgIcons';

export default function BarraDeNavegacion() {
  const { isAuthenticated } = useUser();
  const { listas, crearLista, listaActivaId, setListaActivaId, setNuevaPresentacion } = usePresentation()
  const [seleccion, setSeleccion] = useState<string>("inicio");
  const router = useRouter();

  const handleCrearLista = () => {
    setNuevaPresentacion(true)
  };

  const handleAdmin = () => {
    setSeleccion("admin");
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
    <div className="flex items-center gap-4 fixed top-0 bg-background w-full z-50 px-2 py-1">
      {/* // Logo y enlace a la página principal */}
        <Link href="/" className="flex items-center text-xs hover:opacity-50" onClick={() => setSeleccion("inicio")}>
          <Image alt="logo" src="/proyector_icon.svg" width={30} height={30} className="mx-2" />
          Inicio
        </Link>

      {/* // Selector de presentación activa si hay más de una */}
      {listas.length > 1 && seleccion !== "admin" &&(
        <div className="flex gap-4 items-center pl-2">
          <div className="border-l h-5 self-center"></div>
          <label htmlFor="selector-lista" className="block font-medium text-xs">
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
      <div className="flex gap-3 ml-auto">
        <div className="border-l h-5 self-center"></div>

        {/* // Crear nueva presentación */}
        {seleccion !== "admin"&& listas.length > 0 && (
          <div className="flex items-center gap-2 ml-auto " title="Crear presentación">
            {/* <input name="nombre" type="text" value={nuevoNombre} onChange={(e) => setNuevoNombre(e.target.value)} placeholder="Nombre de nueva presentación" className="border px-3 py-2 rounded-xl w-75 text-sm font-light text-secondary bg-background"/> */}
            <button onClick={handleCrearLista} className="flex gap-2 items-center text-xs hover:opacity-50">
              Nueva
              <Icon name="presentation" size="xl" className="fill-primary text-transparent" />
            </button>
          </div>
        )}

        {/* // Botón para administrar cantos */}
        <div className="flex items-center gap-2 ml-auto mr-2" title="Administrar cantos">
          <button
            onClick={handleAdmin}  className="flex gap-2 items-center text-xs hover:opacity-50">
              Edición
            <Icon name="admin" size="xl" className="fill-primary text-transparent hover:opacity-50" />
          </button>
        </div>
        <div className="border-l h-5 self-center"></div>
        {/* // Menú de usuario */}  
        <MenuDeUsuario /> 
      </div>
    </div>
  );
}