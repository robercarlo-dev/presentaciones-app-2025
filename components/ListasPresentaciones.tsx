// //Componente que muestra las listas de presentaciones y permite activar una lista
"use client";

import { useState } from 'react';
import { usePresentation } from '../context/PresentationContext';
import ListaPresentaciones from './ListaPresentaciones';
import { Icon } from './SvgIcons';
import toast from 'react-hot-toast';

export default function ListasPresentaciones() {
  const { listas, crearLista, listaActivaId, nuevaPresentacion, setNuevaPresentacion } = usePresentation();
  const [nuevoNombre, setNuevoNombre] = useState('');

  const handleCrearLista = () => {
    if (nuevoNombre.trim() !== '') {
      crearLista(nuevoNombre.trim());
      setNuevoNombre('');
    } else {
      toast.error('El nombre de la presentación no puede estar vacío.');
    }
  };

  if (listas.length === 0) {
    return (
      <div className="mt-14 text-secondary">
        <p>No hay presentaciones creadas aún.</p>
        <p>¡Comienza creando una nueva presentación!</p>
        <form className="flex items-center gap-2 my-2" title="Crear presentación" onSubmit={(e) => { e.preventDefault(); handleCrearLista();}}>
          <input
            name="nombre"
            type="text"
            value={nuevoNombre}
            onChange={(e) => setNuevoNombre(e.target.value)}
            placeholder="Nombre de nueva presentación"
            className="border px-3 py-2 rounded-xl w-75 text-sm font-light text-secondary bg-background"
          />
          <button type="submit">
            <Icon name="presentation" size="xl" className="fill-primary text-transparent hover:opacity-50" />
          </button>
        </form>
        <p className='text-sm font-light italic'>Puedes crear más de una presentación <br/> y también puedes guardarlas para después, <br/> utiliza el menú al tope de la página.</p>
      </div>
    );
  }

  if (nuevaPresentacion) {
    return (
      <div className="mt-14 text-secondary">
        <p>Estás creando una nueva presentación.</p>
        <form className="flex items-center gap-2 my-2" title="Crear presentación" onSubmit={(e) => { 
          e.preventDefault(); // Prevent default browser form submission
          handleCrearLista();
          setNuevaPresentacion(false);}}>
          <input
            name="nombre"
            type="text"
            value={nuevoNombre}
            onChange={(e) => setNuevoNombre(e.target.value)}
            placeholder="Nombre de nueva presentación"
            className="border px-3 py-2 rounded-xl w-75 text-sm font-light text-secondary bg-background"
          />
          <button type="submit">
            <Icon name="presentation" size="xl" className="fill-primary text-transparent hover:opacity-50" />
          </button>
          <button onClick={() => setNuevaPresentacion(false)} className="bg-primary text-background p-2 hover:opacity-50">
            Cancelar
          </button>
        </form>
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