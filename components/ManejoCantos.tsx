// Componente para modificar cantos de la base de datos
"use client";
import { useState } from 'react';
import { Icon } from './SvgIcons';
import AgregarCantos from './AgregarCantos';
import ModificarCantos from './ModificarCantos';
import EliminarCantos from './EliminarCantos';


export default function ManejoCantos() {
  const [eleccion, setEleccion] = useState<'agregar' | 'modificar' | 'eliminar'>('modificar');



    return (
        <div className="w-19/20 mx-auto mt-14 flex flex-wrap bg-primary content-start rounded-xl overflow-auto" style={{ height: `calc(100vh - 90px)`, minHeight: '700px', }}>
           <div className="flex justify-around items-center w-full h-15 my-2 ">
                <button className="text-background flex items-center gap-3 p-2 hover:opacity-50" onClick={() => setEleccion("agregar")}>
                    Agregar <Icon name="add" size="xxl" className="fill-secondary text-transparent"/>
                </button>
                <button className="text-background flex items-center gap-3 p-2 hover:opacity-50" onClick={() => setEleccion("modificar")}>
                    Modificar <Icon name="editar" size="xxl" className="fill-secondary text-transparent"/>
                </button>
                <button className="text-background flex items-center gap-3 p-2 hover:opacity-50" onClick={() => setEleccion("eliminar")}>
                    Eliminar <Icon name="trash" size="xxl" className="fill-secondary text-transparent"/>
                </button>
            </div>
            {eleccion === 'agregar' && (<AgregarCantos/>)}
            {eleccion === 'modificar' && (<ModificarCantos/>)}
            {eleccion === 'eliminar' && (<EliminarCantos/>)}
        </div>
    );
    
}