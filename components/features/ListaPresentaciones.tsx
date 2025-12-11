"use client";

import { useState, useCallback, useEffect } from 'react';
import { usePresentation } from '../../context/PresentationContext';
import { useMediaQuery } from "react-responsive";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent} from '@dnd-kit/core';
import { SortableContext, arrayMove, verticalListSortingStrategy} from '@dnd-kit/sortable';
import { restrictToParentElement } from '@dnd-kit/modifiers';
import DraggableItem from '../layout/DraggableItem';
import { Icon } from '../ui/SvgIcons';
import PptxGenJS from 'pptxgenjs';
import FullScreenSelect from '../features/FullScreenSelect';
import { useTarjetas } from '@/hooks/useTarjetas';
import { ElementoCanto, ElementoTarjeta } from '@/types/ListaPresentacion';

type Props = {
  listaId: string;
};

const ListaPresentaciones: React.FC<Props> = ({ listaId }) => {
  const { listas, agregarElementoALista, editarNombreLista, eliminarLista, removerCantoDeLista, reordenarElementosEnLista, guardarListaBorrador } = usePresentation();
  const lista = listas.find((l) => l.id === listaId);
  const { data: tarjetas, isPending: tarjetasPending } = useTarjetas();

  const [editandoNombre, setEditandoNombre] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState(lista?.nombre || '');
  const isTablet = useMediaQuery({ minWidth: 768, maxWidth: 1023 });
  const is2XLDesktop = useMediaQuery({ minWidth: 1536 });
  
  const [displaySelect, setDisplaySelect] = useState<boolean>(false);
  const [itemsEnLista, setItemsEnLista] = useState<(ElementoTarjeta | ElementoCanto)[]>([]);

  if (!lista) return null;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Aumenta la distancia mínima para activar el drag
      },
    })
  );

  // Función para combinar y ordenar items
  const combineAndSortItems = useCallback((cantos: ElementoCanto[], tarjetasList: ElementoTarjeta[]) => {
    return [...cantos, ...(tarjetasList || [])].sort((a, b) => a.numero - b.numero);
  }, []);

  useEffect(() => {
    if (!tarjetasPending) {
      const combinedItems = combineAndSortItems(lista.cantos, lista.tarjetas || []);
      setItemsEnLista(combinedItems);
    }
  }, [lista.cantos, lista.tarjetas, tarjetasPending, combineAndSortItems]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = itemsEnLista.findIndex((item) => 
      ("canto" in item) ? item.canto.id === active.id : item.tarjeta.id === active.id
    );
    const newIndex = itemsEnLista.findIndex((item) => 
      ("canto" in item) ? item.canto.id === over.id : item.tarjeta.id === over.id
    );
    
    if (oldIndex === -1 || newIndex === -1) return;

    // Actualizar el estado local inmediatamente para evitar parpadeo
    const nuevosElementos = arrayMove(itemsEnLista, oldIndex, newIndex);
    
    // Actualizar números de orden
    const elementosConNumeros = nuevosElementos.map((elemento, index) => ({
      ...elemento,
      numero: index + 1
    }));
    
    setItemsEnLista(elementosConNumeros);
    
    // Persistir cambios en el contexto
    const ordenIds = elementosConNumeros.map((e) => 
      ("canto" in e) ? e.canto.id : e.tarjeta.id
    );
    
    try {
      reordenarElementosEnLista(listaId, ordenIds);
    } catch (error) {
      console.error("Error al reordenar:", error);
      // Revertir en caso de error
      const itemsOriginales = combineAndSortItems(lista.cantos, lista.tarjetas || []);
      setItemsEnLista(itemsOriginales);
    }
  }, [itemsEnLista, listaId, reordenarElementosEnLista, combineAndSortItems, lista.cantos, lista.tarjetas]);

  // Para IDs únicos del SortableContext
  const getItemIds = useCallback(() => {
    return itemsEnLista.map(elemento => 
      ("canto" in elemento) ? elemento.canto.id : elemento.tarjeta.id
    );
  }, [itemsEnLista]);

  const handleGuardarNombre = () => {
    const nombre = nuevoNombre.trim();
    if (!nombre || nombre === lista.nombre) {
      setEditandoNombre(false);
      return;
    }
    
    editarNombreLista(listaId, nombre);
    setEditandoNombre(false);
  };

  const addTarjeta = (tarjetaId: string) => {
    const tarjeta = tarjetas?.find(t => t.id === tarjetaId);
    if (!tarjeta) return;

    const index = itemsEnLista.length + 1;
    
    if (lista.id) {
      agregarElementoALista(lista.id, tarjeta, index);
      // Actualizar el estado local inmediatamente
      setItemsEnLista(prev => [...prev, { numero: index, tarjeta }]);
    }

    setDisplaySelect(false);
  }

  const handleGuardar = async () => {
    try {
      const newId = await guardarListaBorrador(listaId);
      alert("Lista guardada correctamente.");
    } catch (e) {
      console.error("Error al guardar lista:", e);
    }
  };

  const handleEliminar = () => {
    eliminarLista(listaId);
  }
  
  const handleDescargar = () => {
    // Usar los datos actuales del contexto
    const pptx = new PptxGenJS();
    lista.cantos.forEach((elemento) => {
      const titleSlide = pptx.addSlide();
      titleSlide.background = { color: '000000', path: 'images/bg-titulos.jpg' };
      titleSlide.addText(elemento.canto.titulo, {
        x: 0,
        y: 1.51,
        h: 2.61,
        w: '100%',
        color: 'FFFFFF',
        fontSize: 60,
        bold: true,
        align: 'center',
      });

      elemento.canto.estrofas.forEach((estrofa, index) => {
        const slide = pptx.addSlide();
        slide.background = { color: '000000', path: 'images/bg-cantos.jpg' };

        slide.addText(`${index + 1}`, {
          x: 0.08,
          y: 0,
          w: 0.5,
          h: 0.5,
          color: 'FFFFFF',
          align: 'left',
        });

        let fontSize = 50;
        const minFontSize = 36;
        const maxCharactersPerLine = 27;
        const maxLines = 7;

        const linesArray = estrofa.split('\n');
        let totalLines = 0;

        linesArray.forEach((line) => {
          totalLines += Math.ceil(line.length / maxCharactersPerLine);
        });

        while (totalLines > maxLines && fontSize > minFontSize) {
          fontSize -= 2;
          totalLines = 0;
          linesArray.forEach((line) => {
            totalLines += Math.ceil(line.length / maxCharactersPerLine);
          });
        }

        slide.addText(estrofa, {
          isTextBox: true,
          fit: 'shrink',
          x: 0,
          y: 0,
          w: '100%',
          h: '100%',
          fontSize: fontSize,
          color: 'FFFFFF',
          align: 'center',
        });

        if (elemento.canto.estrofas.length === index + 1) {
          slide.addText('Fin', {
            x: 9.42,
            y: 5.145,
            w: 0.54,
            h: 0.42,
            color: 'FFFFFF',
            italic: true,
            align: 'left',
          });
        }
      });
    });

    pptx.writeFile({ fileName: `${lista.nombre || 'presentacion'}.pptx` });
  };

  return (
    <div className="bg-primary rounded-xl md:py-5 py-15 px-6 w-screen max-w-39/40 md:max-w-[380px] lg:max-w-[480px] xl:max-w-[620px] 2xl:max-w-[730px]" style={{ height: `calc(100vh - 90px)`, minHeight: '700px', }}>
      <div className="text-center mb-2">
        {editandoNombre ? (
          <div className="flex items-center gap-2 text-background">
            <input 
              type="text" 
              value={nuevoNombre} 
              onChange={(e) => setNuevoNombre(e.target.value)} 
              className="border px-2 py-1 rounded"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleGuardarNombre();
                if (e.key === 'Escape') {
                  setEditandoNombre(false);
                  setNuevoNombre(lista.nombre);
                }
              }}
            />
            <button onClick={handleGuardarNombre}>
              <Icon name="guardar" size={`${ is2XLDesktop ? "xxxl" : isTablet ? "lg" : "xl" }`} className="fill-background text-transparent hover:opacity-50" />
            </button>
          </div>
        ) : (
          <h3 className="font-goham font-bold uppercase text-l xl:text-3xl text-background text-center mb-3">
            {lista.nombre}
          </h3>
        )}
        <div className="flex gap-2 item-center justify-center">
          <button onClick={() => setDisplaySelect(true)} className='text-background text-xs hover:cursor-pointer hover:opacity-50'>
            <Icon name="select" size={`${ is2XLDesktop ? "xxxl" : isTablet ? "lg" : "xl" }`} className="fill-background text-transparent mb-1 mx-auto drop-shadow-xl" />
            Tarjetas
          </button>
          {itemsEnLista.length > 0 && (
            <button onClick={handleDescargar} className='text-background text-xs hover:cursor-pointer hover:opacity-50'>
              <Icon name="download" size={`${ is2XLDesktop ? "xxxl" : isTablet ? "lg" : "xl" }`} className="fill-background text-transparent mb-1 mx-auto drop-shadow-xl" />
              Descargar
            </button>
          )}
          {!lista.isSaved && (
            <button onClick={handleGuardar} className='text-background text-xs min-w-15 hover:cursor-pointer hover:opacity-50'>
              <Icon name="guardar" size={`${ is2XLDesktop ? "xxxl" : isTablet ? "lg" : "xl" }`} className="fill-background text-transparent mb-1 mx-auto drop-shadow-xl " />
              Guardar
            </button>
          )}
          {!editandoNombre && (
            <button onClick={() => setEditandoNombre(true)} className="text-background text-xs min-w-15 hover:cursor-pointer hover:opacity-50">
              <Icon name="editar" size={`${ is2XLDesktop ? "xxxl" : isTablet ? "lg" : "xl" }`} className="fill-background text-transparent mb-1 mx-auto drop-shadow-xl" />
              Editar
            </button>
          )}
          <button onClick={handleEliminar} className="text-background text-xs min-w-15 hover:cursor-pointer hover:opacity-50">
            <Icon name="trash" size={`${ is2XLDesktop ? "xxxl" : isTablet ? "lg" : "xl" }`} className="fill-background text-transparent mb-1 mx-auto drop-shadow-xl" />
            Eliminar
          </button>  
        </div>
      </div>

      <div className="draggable-container overflow-auto border rounded-xl p-6 bg-background h-8/10">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          modifiers={[restrictToParentElement]}
          onDragEnd={handleDragEnd}
        >
          <SortableContext 
            items={getItemIds()} 
            strategy={verticalListSortingStrategy}
          >
            <ul>
              {itemsEnLista.map((elemento) => (
                <DraggableItem
                  key={("canto" in elemento) ? elemento.canto.id : elemento.tarjeta.id}
                  elemento={("canto" in elemento) ? elemento.canto : elemento.tarjeta}
                  removeElemento={(id) => {
                    removerCantoDeLista(listaId, id);
                    // Actualizar estado local
                    setItemsEnLista(prev => prev.filter(item => 
                      ("canto" in item) ? item.canto.id !== id : item.tarjeta.id !== id
                    ));
                  }}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      </div>
      {tarjetas && displaySelect && (
        <FullScreenSelect
          items={tarjetas}
          onChange={addTarjeta}
          placeholder='Seleccionar tarjeta'
          onClose={() => setDisplaySelect(false)}
        />
      )}
    </div>
  );
};

export default ListaPresentaciones;