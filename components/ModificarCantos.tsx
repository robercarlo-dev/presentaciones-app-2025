// Componente para modificar cantos de la base de datos
"use client";
import { useState, useEffect } from 'react';
import { obtenerCantos, actualizarCanto } from '@/services/cantos';
import { Canto } from '@/types/supabase';
import toast from 'react-hot-toast';
import RemainingHeightDiv from '@/components/RemainingHeightDiv';


export default function ModificarCantos() {
  const [cantos, setCantos] = useState<Canto[]>([]);
  const [cantosSeleccionados, setCantosSeleccionados] = useState<Canto[]>([]);
  const [editandoCantoId, setEditandoCantoId] = useState<string | null>(null);
  const [nuevoTitulo, setNuevoTitulo] = useState('');
  const [cantoABuscar, setCantoABuscar] = useState<string>('');
  const [nuevasEstrofas, setNuevasEstrofas] = useState<string[]>([]);
  const [cantidadEstrofas, setCantidadEstrofas] = useState(1);

  useEffect(() => {
    const cargar = async () => {
      const data = await obtenerCantos();
      setCantos(data);
    };

    cargar();
  }, []);

    const handleGuardarCambios = async () => {
        console.log("Guardando cambios para el canto ID:", editandoCantoId);
        if (!editandoCantoId) return;
        const cantoId = editandoCantoId;


        // Recortar el arreglo al número actual de estrofas
        const estrofasRecortadas = nuevasEstrofas.slice(0, cantidadEstrofas);

        // Eliminar estrofas vacías
        const estrofasFiltradas = estrofasRecortadas.filter(e => e && e.trim() !== "");


        try {
            await actualizarCanto(cantoId, {
                titulo: nuevoTitulo,
                estrofas: estrofasFiltradas,
            });
            setCantos(prev =>
                prev.map(c =>
                c.id === cantoId ? { ...c, titulo: nuevoTitulo, estrofas: estrofasFiltradas} : c
                )
            );
            resetAttributes();
            console.log("Cantos después de la actualización:", cantos);
            toast.success('Canto actualizado exitosamente');
        } catch (error) {
            toast.error('Error al actualizar el canto');
            console.error(error);
        }
    };

    const buscarCantoPorTitulo = (titulo: string) => {
        const cantosFiltrados = cantos.filter(canto => canto.titulo.toLowerCase().includes(titulo.toLowerCase().trim()));
        setCantosSeleccionados(cantosFiltrados);
        if (cantosFiltrados.length === 1) {
            setAttributes(cantosFiltrados[0]);
        }
    }

    const setAttributes = (canto: Canto) => {
        setEditandoCantoId(canto.id);
        setNuevoTitulo(canto.titulo);
        setNuevasEstrofas(canto.estrofas);
        setCantidadEstrofas(canto.estrofas.length);
        setCantosSeleccionados([canto]);
    }

    const resetAttributes = () => {
        setEditandoCantoId(null);
        setNuevoTitulo('');
        setNuevasEstrofas([]);
        setCantidadEstrofas(1);
        setCantosSeleccionados([]);
    }

    return (
        <div className="flex flex-col gap-4 w-full mx-auto bg-primary self-baseline mt-4 overflow-auto min-h-">
            <h1 className="text-3xl font-bold mb-4 text-center text-background uppercase">Modificar Cantos Existentes</h1>
            <form onSubmit={(e) => { e.preventDefault();  buscarCantoPorTitulo(cantoABuscar)}} className="flex flex-col gap-4 w-full mx-auto bg-primary self-baseline">
                <div className="flex mx-4 justify-around items-center pb-1">
                    <div>
                        <label className="text-background mr-2">Título del Canto a Modificar:</label>
                        <input type="text" value={cantoABuscar} onChange={(e) => setCantoABuscar(e.target.value)} className="bg-background border border-primary w-100 text-secondary bg-background p-2 rounded-lg mt-1 p-2"/>
                    </div>
                    <button type="submit" className="bg-secondary text-white px-4 py-2 w-40 self-end rounded hover:opacity-50">
                        Buscar Canto
                    </button>
                </div>
                
            </form>
            {cantosSeleccionados.length > 1 && (
                <div className="text-background text-center w-5/10 pt-3 m-auto">
                    <h2 className="text-2xl font-medium text-background mb-4 text-center">Resultados de la búsqueda:</h2>
                    <RemainingHeightDiv 
                        className="overflow-auto"
                        minHeight={400} // Altura mínima de 400px
                        offset={34}     // 10px de offset adicional
                    >
                        <ul>
                            {cantosSeleccionados.map(canto => (
                                <li key={canto.id} className="flex gap-3 justify-between items-center border border-primary rounded-lg p-2 mb-1 bg-secondary">
                                    <h2 className="text-xl font-medium text-background">{canto.titulo}</h2>
                                    <button onClick={() => {
                                        setEditandoCantoId(canto.id);
                                        setNuevoTitulo(canto.titulo);
                                        setNuevasEstrofas(canto.estrofas);
                                        setCantidadEstrofas(canto.estrofas.length);
                                        setCantosSeleccionados([canto]);
                                    }} className="bg-primary text-white px-4 py-2 rounded hover:opacity-50">
                                        Editar
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </RemainingHeightDiv>
                </div>
            )}
            {cantosSeleccionados.length === 1 && cantosSeleccionados.map(canto => (
                <div key={canto.id} className="flex flex-col border border-primary rounded-lg p-4 mb-4 bg-secondary/10 mx-4">
                    <h2 className="text-2xl font-medium text-background mb-2">Editando: {canto.titulo}</h2>
                    <div className="flex justify-between">
                        <div className="mb-4">
                            <label className="text-background mr-2">Título:</label>
                            <input type="text" value={nuevoTitulo} onChange={(e) => setNuevoTitulo(e.target.value)} className="bg-background border border-primary w-100 text-secondary bg-background p-2 rounded-lg mt-1 p-2"/>
                        </div>
                        <div className="mb-4">
                            <label className="text-background mr-2">Cantidad de diapositivas: </label>
                            <input type="number" value={cantidadEstrofas} onChange={(e) => setCantidadEstrofas(Number(e.target.value)) } min="1" className="border border-primary text-xl w-15 text-secondary text-center bg-background p-2 rounded-lg mt-1"/>
                        </div>
                    </div>
                    <div className="flex flex-wrap justify-center gap-3 mt-4 mb-4">
                        <h2 className="w-full text-2xl font-medium text-background mb-4 text-center">Diapositivas:</h2>
                        {Array.from({ length: cantidadEstrofas }, (_, i) => (
                            <div key={i} className="flex items-center">
                                <label className="text-background mr-2">{i + 1}:</label>
                                <textarea value={nuevasEstrofas[i] || ''} onChange={(e) => {
                                    const nuevas = [...nuevasEstrofas];
                                    nuevas[i] = e.target.value;
                                    setNuevasEstrofas(nuevas);
                                }} className="border border-primary text-secondary bg-background p-2 rounded-lg mt-1 h-40 w-80"/>
                            </div>
                        ))}
                    </div>
                    <button onClick={() => handleGuardarCambios()} className="bg-secondary text-white px-4 py-2 mr-10 my-4 w-50 self-end rounded hover:opacity-50">
                        Guardar Cambios
                    </button>
                </div>
            ))}
        </div>
    );
    
}