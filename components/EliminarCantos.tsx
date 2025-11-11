// Componente para eliminar cantos de la base de datos
"use client";
import { useState, useEffect } from 'react';
import { obtenerCantos, eliminarCanto } from '@/services/cantos';
import { Canto } from '@/types/supabase';
import toast from 'react-hot-toast';
import RemainingHeightDiv from '@/components/RemainingHeightDiv';


export default function EliminarCantos() {
  const [cantos, setCantos] = useState<Canto[]>([]);
  const [cantosSeleccionados, setCantosSeleccionados] = useState<Canto[]>([]);
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

    const handleEliminarCanto = async (cantoId: string) => {
        console.log("Eliminando canto con ID:", cantoId);
        if (!confirm('¿Estás seguro de que deseas eliminar este canto?')) return;
        try {
            await eliminarCanto(cantoId);
            setCantos(prev => prev.filter(c => c.id !== cantoId));
            resetAttributes();
            toast.success('Canto eliminado exitosamente');
        } catch (error) {
            toast.error('Error al eliminar el canto');
            console.error(error);
        }
    };

    const buscarCantoPorTitulo = (titulo: string) => {
        const cantosFiltrados = cantos.filter(canto => canto.titulo.toLowerCase().includes(titulo.toLowerCase().trim()));
        setCantosSeleccionados(cantosFiltrados);
        if (cantosFiltrados.length === 1) {
            console.log("Canto encontrado:", cantosFiltrados[0]);
            setAttributes(cantosFiltrados[0]);
        }
    }

    const setAttributes = (canto: Canto) => {
        console.log("Seteando atributos para canto:", canto);
        
        setNuevoTitulo(canto.titulo);
        setNuevasEstrofas(canto.estrofas);
        setCantidadEstrofas(canto.estrofas.length);
        setCantosSeleccionados([canto]);
    }

    const resetAttributes = () => {
        setNuevoTitulo('');
        setNuevasEstrofas([]);
        setCantidadEstrofas(1);
        setCantosSeleccionados([]);
    }

    return (
            
        <div className="flex flex-col gap-4 w-full mx-auto bg-primary self-baseline mt-4 overflow-auto min-h-">
            <h1 className="text-3xl font-bold mb-4 text-center text-background uppercase">Eliminar Cantos Existentes</h1>
            <form onSubmit={(e) => { e.preventDefault();  buscarCantoPorTitulo(cantoABuscar)}} className="flex flex-col gap-4 w-full mx-auto bg-primary self-baseline">
                <div className="flex mx-4 justify-around items-center pb-1">
                    <div>
                        <label className="text-background mr-2">Título del Canto a Eliminar:</label>
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
                                        setNuevoTitulo(canto.titulo);
                                        setNuevasEstrofas(canto.estrofas);
                                        setCantidadEstrofas(canto.estrofas.length);
                                        setCantosSeleccionados([canto]);
                                    }} className="bg-primary text-white px-4 py-2 rounded hover:opacity-50">
                                        Seleccionar
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </RemainingHeightDiv>
                </div>
            )}
            {cantosSeleccionados.length === 1 && cantosSeleccionados.map(canto => (
                <div key={canto.id} className="flex flex-col border border-primary rounded-lg p-4 mb-4 bg-secondary/10 mx-4">
                    <h2 className="text-2xl font-medium text-background mb-2">Eliminar: {canto.titulo}</h2>
                    <div className="flex justify-between">
                        <div className="mb-4">
                            <label className="text-background mr-2">Título:</label>
                            <p className="bg-background border border-primary w-100 text-secondary bg-background p-2 rounded-lg mt-1 p-2">
                                {nuevoTitulo}
                            </p>
                        </div>
                        <div className="mb-4">
                            <label className="text-background mr-2">Cantidad de diapositivas: </label>
                            <p className="border border-primary text-xl w-15 text-secondary text-center bg-background p-2 rounded-lg mt-1">
                                {cantidadEstrofas}
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-wrap justify-center gap-3 mt-4 mb-4">
                        <h2 className="w-full text-2xl font-medium text-background mb-4 text-center">Diapositivas:</h2>
                        {Array.from({ length: cantidadEstrofas }, (_, i) => (
                            <div key={i} className="flex items-center">
                                <label className="text-background mr-2">{i + 1}:</label>
                                <p className="border border-primary text-secondary bg-background p-2 rounded-lg mt-1 h-40 w-80">
                                    {nuevasEstrofas[i] || ''}
                                </p>
                            </div>
                        ))}
                    </div>
                    <button onClick={() => handleEliminarCanto(canto.id)} className="bg-secondary text-white px-4 py-2 mr-10 my-4 w-50 self-end rounded hover:opacity-50">
                        Eliminar Canto
                    </button>
                </div>
            ))}
        </div>
          
    );
    
}