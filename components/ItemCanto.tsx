"use client";

import { usePresentation } from "../context/PresentationContext";
import { Icon } from "./SvgIcons";
import { useMediaQuery } from "react-responsive";
import { useUser } from '@/context/UserContext';
import React, { useState, useEffect } from "react";
import { quitarFavorito, agregarFavorito } from '@/services/cantos';

type CantoProps = {
  canto: {
    id: string;
    titulo: string;
    estrofas: string[];
    uso_total: number;
    ultima_vez_usado: string | null;
  };
};

const ItemCanto: React.FC<CantoProps> = ({ canto }) => {

  const [esFavorito, setEsFavorito] = useState(false);

  const isTablet = useMediaQuery({ minWidth: 768, maxWidth: 1023 });
  const is2XLDesktop = useMediaQuery({ minWidth: 1536 });

  const { listaActivaId, listas, agregarCantoALista, removerCantoDeLista, setCantoPreview, favoritos, setFavoritos } = usePresentation();

  const listaActiva = listas.find((l) => l.id === listaActivaId);
  const cantoYaAgregado = listaActiva?.cantos.some((c) => c.id === canto.id);
  const { user } = useUser();

  // Cargar favoritos al iniciar
  useEffect(() => {
    const checkIsFavorito = () => favoritos.includes(canto.id) ? setEsFavorito(true) : setEsFavorito(false);
    
    checkIsFavorito();
  }, [favoritos, canto.id]);

  const handleAdd = () => {
    if (listaActivaId && !cantoYaAgregado) {
      agregarCantoALista(listaActivaId, canto);
    }
  };

  const handleRemove = () => {
    if (listaActivaId) {
      removerCantoDeLista(listaActivaId, canto.id);
    }
  };

  const handlePreview = () => {
    setCantoPreview(canto);
  };

  const toggleFavorito = async () => {
    if (!user) return;
  
    const userId = user.id;
    const cantoId = canto.id;

    try {
      if (esFavorito) {
        await quitarFavorito(userId, cantoId);
        setFavoritos(prev => prev.filter(id => id !== cantoId));
        setEsFavorito(false);
      } else {
        await agregarFavorito(userId, cantoId);
        setFavoritos(prev => [...prev, cantoId]);
        setEsFavorito(true);
      }
    } catch (error) {
      console.error("Error al actualizar favorito:", error);
    }
  };

  return (
      <div className={`rounded-lg grid grid-cols-12 2xl:grid-cols-32 gap-3 2xl:gap-5 h-full ${ cantoYaAgregado ? "bg-accent" : ""}`}>
        <h3 className={`text-sm lg:text-xl 2xl:text-2xl font-medium truncate col-span-8 2xl:col-span-22 flex items-center ml-2 lg:ml-5 ${ cantoYaAgregado ? "text-primary" : "text-secondary"}`} >
          <span className="truncate block overflow-hidden whitespace-nowrap">
            {canto.titulo}
          </span>
        </h3>
        <div className="col-span-4 2xl:col-span-10 flex justify-end gap-2 pr-2">
          <button onClick={handlePreview}>
            <Icon name="view" size={`${ is2XLDesktop ? "xxxl" : isTablet ? "lg" : "xl" }`} className="fill-secondary text-transparent hover:opacity-50"/>
          </button>
          {listaActivaId && listas.length > 0 && (
            <>
              {!cantoYaAgregado ? (
                <button onClick={handleAdd}>
                  <Icon name="add" size={`${ is2XLDesktop ? "xxxl" : isTablet ? "lg" : "xl" }`} className="fill-secondary text-transparent hover:opacity-50" />
                </button>
              ) : (
                <button onClick={handleRemove}>
                  <Icon name="remove" size={`${ is2XLDesktop ? "xxxl" : isTablet ? "lg" : "xl" }`} className="fill-red-500 text-transparent hover:opacity-50" />
                </button>
              )}
            </>
          )}
          <button onClick={toggleFavorito}>
            {esFavorito && (
              <Icon name="star_filled" size={`${ is2XLDesktop ? "xxxl" : isTablet ? "lg" : "xl" }`} className="fill-primary text-transparent hover:opacity-50" />
            )}
            {!esFavorito && (
              <Icon name="star_edges" size={`${ is2XLDesktop ? "xxxl" : isTablet ? "lg" : "xl" }`} className="fill-primary text-transparent hover:opacity-50" />
            )}
          </button>
        </div>
      </div>
  );
};

export default ItemCanto;