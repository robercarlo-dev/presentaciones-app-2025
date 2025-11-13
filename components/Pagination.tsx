// Pagination component for navigating through pages
'use client';

import React from 'react';
import { Icon } from './SvgIcons';
interface PaginacionProps {
  paginaActual: number;
  totalPaginas: number;
  setPaginaActual: React.Dispatch<React.SetStateAction<number>>;
}
export default function Pagination({ paginaActual, totalPaginas, setPaginaActual }: PaginacionProps) {
    return (
        <div className="flex justify-center items-center gap-4 2xl:mt-2">
            <button
            onClick={() => setPaginaActual((prev) => Math.max(prev - 1, 1))}
            disabled={paginaActual === 1}
            className="mt-2 px-1 py-1 bg-background rounded disabled:opacity-50"
            >
            <Icon name="left" size="xxl" className="fill-secondary text-transparent hover:opacity-50" />
            </button>

            <span className="text-background mt-2">
            Página {paginaActual} de {totalPaginas}
            </span>

            <button
            onClick={() => setPaginaActual((prev) => Math.min(prev + 1, totalPaginas))}
            disabled={paginaActual === totalPaginas}
            className="mt-2 px-1 py-1 bg-background rounded disabled:opacity-50"
            >
            <Icon name="right" size="xxl" className="fill-secondary text-transparent hover:opacity-50" />
            </button>
        </div>
    )
}