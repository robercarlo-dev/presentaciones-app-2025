// components/BuscadorCantos.tsx
'use client';

import React from 'react';
import { Icon } from './SvgIcons';

interface BuscadorCantosProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: (query: string) => void;
  placeholder?: string;
  className?: string;
}

export default function BuscadorCantos({
  value,
  onChange,
  onSearch,
  placeholder = 'Título de canto para buscar',
  className = '',
}: BuscadorCantosProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(value);
  };

  return (
    <form onSubmit={handleSubmit} className={`flex flex-col gap-4 w-full mx-auto bg-primary self-baseline ${className}`}>
      <div className="flex mx-auto my-4 gap-2 w-100 justify-around items-center rounded-lg bg-background">
        <input
          name='buscarCanto'
          placeholder={placeholder}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="bg-background w-100 text-secondary rounded-lg p-2"
          aria-label="Buscar canto por título"
        />
        <button type="submit" className="text-white w-10 rounded hover:opacity-50" aria-label="Buscar">
          <Icon name="search" size="lg" className="fill-secondary text-transparent hover:opacity-50" />
        </button>
      </div>
    </form>
  );
}