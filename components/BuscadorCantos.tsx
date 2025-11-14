// components/BuscadorCantos.tsx
'use client';

import React from 'react';
import { Icon } from './SvgIcons';
import { Canto } from '@/types/supabase';

interface BuscadorCantosProps {
  value: string;
  onChange: (value: string) => void;
  // onSearch: (query: string) => void;
  placeholder?: string;
  className?: string;
  cantosAFiltrar: Canto[];
  setCantosFiltrados: (cantos: Canto[]) => void;
}

const eliminarAcentos = (texto: string): string => {
  return texto
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
};

export default function BuscadorCantos({
  value,
  onChange,
  // onSearch,
  placeholder = 'Título para buscar',
  className = '',
  cantosAFiltrar,
  setCantosFiltrados,
}: BuscadorCantosProps) {

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    buscarCantoPorTitulo(value);
  };

  const buscarCantoPorTitulo = (titulo: string) => {
    const tituloBusqueda = eliminarAcentos(titulo.trim().toLowerCase());
    
    const cantosFiltrados = cantosAFiltrar.filter(canto =>
      eliminarAcentos(canto.titulo.toLowerCase()).includes(tituloBusqueda)
    );
    
    setCantosFiltrados(cantosFiltrados);
  };

  return (
    <form onSubmit={handleSubmit} className={`flex gap-4 bg-primary self-baseline ${className}`}>
      <div className="grid grid-cols-9 my-4 w-full items-center rounded-lg bg-background">
        <input
          name='buscarCanto'
          placeholder={placeholder}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="col-span-8 bg-background text-secondary rounded-lg p-2"
          aria-label="Buscar canto por título"
        />
        <button type="submit" className="flex justify-around text-white col-span-1 rounded hover:opacity-50" aria-label="Buscar">
          <Icon name="search" size="lg" className="fill-secondary text-transparent hover:opacity-50" />
        </button>
      </div>
    </form>
  );
}