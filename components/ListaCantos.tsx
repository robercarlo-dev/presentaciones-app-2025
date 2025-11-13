'use client';

import { useState, useEffect, useCallback } from 'react';
import ItemCanto from './ItemCanto';
import { usePresentation } from '../context/PresentationContext';
import { useUser } from '@/context/UserContext';
import { obtenerFavoritos } from '@/services/cantos';
import { Canto } from '@/types/supabase';
import { Icon } from './SvgIcons';
import { useMediaQuery } from 'react-responsive';
import BuscadorCantos from './BuscadorCantos';
import Pagination from './Pagination';

interface ListaCantosProps {
  cantosData: Canto[];
}

export default function ListaCantos({ cantosData }: ListaCantosProps) {
  const [cantos, setCantos] = useState<Canto[]>([]);
  const [todosLosCantos, setTodosLosCantos] = useState<Canto[]>([]);
  const [cantoABuscar, setCantoABuscar] = useState<string>('');
  const [paginaActual, setPaginaActual] = useState(1);
  const [cantosPorPagina, setCantosPorPagina] = useState(10);
  const [mostrarFavoritos, setMostrarFavoritos] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [noResults, setNoResults] = useState(false);

  const { favoritos, setFavoritos } = usePresentation();
  const { user } = useUser();
  const is2XLDesktop = useMediaQuery({ minWidth: 1536 });

  const totalPaginas = Math.ceil(cantos.length / cantosPorPagina);
  const inicio = (paginaActual - 1) * cantosPorPagina;
  const cantosPaginados = cantos.slice(inicio, inicio + cantosPorPagina);

  /** ✅ Cargar cantos al iniciar */
  useEffect(() => {
      setTodosLosCantos(cantosData);
      setCantos(cantosData);
      setNoResults(cantosData.length === 0);
      setIsLoading(false);
  }, [cantosData]);

  /** ✅ Cargar favoritos cuando el componente monte */
  useEffect(() => {
    if (user) {
      obtenerFavoritos(user.id).then(setFavoritos).catch(console.error);
    }
  }, [user, setFavoritos]);

  /** ✅ Ajustar cantos por página según altura disponible */
  useEffect(() => {
    const ajustarCantosPorPagina = () => {
      const alturaDisponible = window.innerHeight - 90;
      const alturaMinima = 700;
      const alturaComponente = Math.max(alturaDisponible, alturaMinima);
      const alturaCanto = is2XLDesktop ? 68 : 51;
      const espacioDisponible = alturaComponente - 200;
      const cantosVisibles = Math.floor(espacioDisponible / alturaCanto);
      setCantosPorPagina(Math.max(cantosVisibles, 1));
    };

    ajustarCantosPorPagina();
    window.addEventListener('resize', ajustarCantosPorPagina);

    return () => {
      window.removeEventListener('resize', ajustarCantosPorPagina);
    };
  }, [is2XLDesktop]);

  /** ✅ Actualizar lista si se está mostrando favoritos */
  useEffect(() => {
    if (mostrarFavoritos && todosLosCantos.length > 0) {
      const cantosFavoritos = todosLosCantos.filter(canto => favoritos.includes(canto.id));
      setCantos(cantosFavoritos);
      setPaginaActual(1);
      setNoResults(cantosFavoritos.length === 0);
    }
  }, [favoritos, mostrarFavoritos, todosLosCantos]);

    /** ✅ Funciones */
    const filtrarFavoritos = useCallback(() => {
      setMostrarFavoritos(true);
      if (todosLosCantos.length > 0) {
        const cantosFavoritos = todosLosCantos.filter(canto => favoritos.includes(canto.id));
        setCantos(cantosFavoritos);
        setPaginaActual(1);
        setNoResults(cantosFavoritos.length === 0);
      }
    }, [todosLosCantos, favoritos]);
  
    const buscarCantoPorTitulo = useCallback((titulo: string) => {
      const cantosFiltrados = todosLosCantos.filter(canto =>
        canto.titulo.toLowerCase().includes(titulo.toLowerCase().trim())
      );
      setCantos(cantosFiltrados);
      setPaginaActual(1);
      setNoResults(cantosFiltrados.length === 0);
    }, [todosLosCantos]);
  
    const mostrarTodos = useCallback(() => {
      setMostrarFavoritos(false);
      setCantos(todosLosCantos);
      setPaginaActual(1);
      setNoResults(todosLosCantos.length === 0);
    }, [todosLosCantos]);

  return (
    <div
      className="bg-primary rounded-xl lg:w-[480px] xl:w-[620px] 2xl:w-[730px] md:py-5 py-15 px-6 mt-10 drop-shadow-xl/50"
      style={{ height: `calc(100vh - 90px)`, minHeight: '700px' }}
    >
      <h2 className="font-goham font-bold uppercase text-l xl:text-3xl 2xl:mt-2 text-background text-center">
        Cantos disponibles
      </h2>

      {/* Barra de búsqueda y botones */}
      <div className="flex">
        <BuscadorCantos value={cantoABuscar} onChange={setCantoABuscar} onSearch={buscarCantoPorTitulo} />

        <div className="flex gap-3 my-4 text-center">
          <button title="todos" onClick={mostrarTodos}>
            <Icon name="list" size="xl" className="fill-background text-transparent hover:opacity-50" />
          </button>
          <button title="favoritos" onClick={filtrarFavoritos} className="text-white rounded hover:opacity-50">
            <Icon name="star_list" size="xl" className="fill-background text-transparent hover:opacity-50" />
          </button>
        </div>
      </div>

      {/* Lista de cantos */}
      {isLoading ? (
        <p className="text-background text-center mt-10">Cargando cantos...</p>
      ) : noResults ? (
        <p className="text-background text-center mt-10">No se encontraron cantos.</p>
      ) : (
        <ul>
          {cantosPaginados.map((canto) => (
            <li key={canto.id} className="bg-background rounded-lg mb-1 2xl:mb-2 h-[45px] 2xl:h-[57px]">
              <ItemCanto canto={canto} />
            </li>
          ))}
        </ul>
      )}

      {/* Paginación */}
      <Pagination paginaActual={paginaActual} totalPaginas={totalPaginas} setPaginaActual={setPaginaActual} />
    </div>
  );
}