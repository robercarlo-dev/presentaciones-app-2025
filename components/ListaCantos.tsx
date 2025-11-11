'use client';

import { useState, useEffect } from 'react';
import ItemCanto from './ItemCanto';
import { usePresentation } from '../context/PresentationContext';
import { useUser } from '@/context/UserContext';
import { obtenerCantos, obtenerFavoritos } from '@/services/cantos';
import { Canto } from '@/types/supabase';
import { Icon } from './SvgIcons';
import { useMediaQuery } from 'react-responsive';

export default function ListaCantos() {
  const [cantos, setCantos] = useState<Canto[]>([]);
  const [todosLosCantos, setTodosLosCantos] = useState<Canto[]>([]);
  const [cantoABuscar, setCantoABuscar] = useState<string>('');
  const [paginaActual, setPaginaActual] = useState(1);
  const [cantosPorPagina, setCantosPorPagina] = useState(10);
  const [mostrarFavoritos, setMostrarFavoritos] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [noResults, setNoResults] = useState(false);

  const { favoritos, setFavoritos } = usePresentation();
  const { user, loading } = useUser();
  const is2XLDesktop = useMediaQuery({ minWidth: 1536 });

  const totalPaginas = Math.ceil(cantos.length / cantosPorPagina);
  const inicio = (paginaActual - 1) * cantosPorPagina;
  const cantosPaginados = cantos.slice(inicio, inicio + cantosPorPagina);

  // Cargar cantos al iniciar
  useEffect(() => {
    const cargarCantos = async () => {
      setIsLoading(true);
      try {
        const data = await obtenerCantos();
        if (data) {
          setTodosLosCantos(data);
          setCantos(data);
          setNoResults(data.length === 0);
        } else {
          console.error('No se pudieron cargar los cantos');
          setNoResults(true);
        }
      } catch (error) {
        console.error('Error al cargar cantos:', error);
        setNoResults(true);
      } finally {
        setIsLoading(false);
      }
    };
  
    cargarCantos();
  }, []);

  // Cargar favoritos cuando el usuario esté listo
  useEffect(() => {
    const cargarFavoritos = async () => {
      if (!loading && user) {
        try {
          const favoritosIds = await obtenerFavoritos(user.id);
          setFavoritos(favoritosIds);
        } catch (error) {
          console.error('Error al cargar favoritos:', error);
        }
      }
    };

    cargarFavoritos();
  }, [user, loading, setFavoritos]);

  // Ajustar cantos por página según altura disponible
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

  // Actualizar lista si se está mostrando favoritos y cambian
  useEffect(() => {
    if (mostrarFavoritos && user && todosLosCantos.length > 0 && favoritos.length > 0) {
      const cantosFavoritos = todosLosCantos.filter(canto => favoritos.includes(canto.id));
      setCantos(cantosFavoritos);
      setPaginaActual(1);
    }
  }, [favoritos, mostrarFavoritos, todosLosCantos, user]);

  const filtrarFavoritos = () => {
    setMostrarFavoritos(true);
    if (todosLosCantos.length > 0 && user) {
      const cantosFavoritos = todosLosCantos.filter(canto => favoritos.includes(canto.id));
      setCantos(cantosFavoritos);
      setPaginaActual(1);
    }
  };

  const buscarCantoPorTitulo = (titulo: string) => {
    const cantosFiltrados = todosLosCantos.filter(canto =>
      canto.titulo.toLowerCase().includes(titulo.toLowerCase().trim())
    );
    setCantos(cantosFiltrados);
    setPaginaActual(1);
    setNoResults(cantosFiltrados.length === 0);
  };
  

  const mostrarTodos = () => {
    setMostrarFavoritos(false);
    setCantos(todosLosCantos);
    setPaginaActual(1);
  };

  return (
    <div
      className="bg-primary rounded-xl lg:w-[480px] xl:w-[620px] 2xl:w-[730px] md:py-5 py-15 px-6 mt-10 drop-shadow-xl/50"
      style={{ height: `calc(100vh - 90px)`, minHeight: '700px' }}
    >
      <h2 className="font-goham font-bold uppercase text-l xl:text-3xl 2xl:mt-2 text-background text-center">
        Cantos disponibles
      </h2>

      <div className="flex">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            buscarCantoPorTitulo(cantoABuscar);
          }}
          className="flex flex-col gap-4 w-full mx-auto bg-primary self-baseline"
        >
          <div className="flex mx-auto my-4 gap-2 w-100 justify-around items-center rounded-lg bg-background">
            <input
              placeholder="Título de canto para buscar"
              type="text"
              value={cantoABuscar}
              onChange={(e) => setCantoABuscar(e.target.value)}
              className="bg-background w-100 text-secondary rounded-lg p-2"
            />
            <button type="submit" className="text-white w-10 rounded hover:opacity-50">
              <Icon name="search" size="lg" className="fill-secondary text-transparent hover:opacity-50" />
            </button>
          </div>
        </form>

        <div className="flex gap-3 my-4 text-center">
          <button title="todos" onClick={mostrarTodos}>
            <Icon name="list" size="xl" className="fill-background text-transparent hover:opacity-50" />
          </button>
          <button title="favoritos" onClick={filtrarFavoritos} className="text-white rounded hover:opacity-50">
            <Icon name="star_list" size="xl" className="fill-background text-transparent hover:opacity-50" />
          </button>
        </div>
      </div>

      
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
    </div>
  );
}