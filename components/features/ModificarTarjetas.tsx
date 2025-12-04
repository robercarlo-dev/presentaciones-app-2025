//Componente para crear tarjetas para la presentación que puede contener texto e imágenes
"Use client";

import { useState, ChangeEvent, useEffect } from 'react';
import Select from 'react-select';
import toast from 'react-hot-toast';
import TipoTarjetaInput from '../TipoTarjetaInput';
import { useTarjetas } from '@/hooks/useTarjetas';
import { Tarjeta } from '@/types/supabase';


export default function ModificarTarjetas() {
    const [selectedTarjeta, setSelectedTarjeta] = useState<Tarjeta | null>(null);
    const { data: tarjetasCargados = [], isPending } = useTarjetas();

    const options = tarjetasCargados.map((tarjeta) => 
       ({ "value":tarjeta.id, "label": `${tarjeta.nombre} - ${tarjeta.tipo}` }) 
    )

    const customStyles = {
        control: (provided: any, state: any) => ({
          ...provided,
          backgroundColor: state.isFocused ? '#f2e8cf' : '#f2e8cf', // Cambia el fondo del control
          borderColor: state.isFocused ? '#a7c957' : '#ddd', // Cambia el borde cuando está enfocado
          boxShadow: 'none', // Remueve el box shadow por defecto
          '&:hover': {
            borderColor: '#a7c957', // Color del borde al pasar el cursor
          }
        }),
        singleValue: (provided: any) => ({
            ...provided,
            color: '#d65a39', // Color del texto del valor seleccionado
          }),
        option: (provided: any, state: any) => ({
          ...provided,
          backgroundColor: state.isSelected ? '#d65a39' : state.isFocused ? '#f0f0f0' : '#fff', // Cambia el fondo de las opciones
          color: state.isSelected ? '#fff' : '#333', // Cambia el color del texto
        }),
        menu: (provided: any) => ({
          ...provided,
          zIndex: 9999 // Asegura que el menú se superponga correctamente
        })
      };

    const handleSelectChange = (selectedOption: any) => {
        console.log('Option selected:', selectedOption.value);
        const tarjetaEncontrada = tarjetasCargados.find(
            (tarjeta) => tarjeta.id.toString() === selectedOption.value.toString()
          );
        setSelectedTarjeta(tarjetaEncontrada || null);
    }

    return (
        <div className="flex flex-col gap-4 w-9/10 h-screen mx-auto bg-primary self-baseline mt-10 p-5 rounded-lg overflow-auto">
            <h1>Modificar Tarjetas</h1>
            {isPending && <p className="text-background mt-4">Cargando datos...</p>}
            {!isPending && tarjetasCargados.length === 0 && (
                <p className="text-background mt-4">No hay tarjetas creadas aún.</p>
            )}
            {!isPending && tarjetasCargados.length > 0 && (
              <>
                <h2 className="text-background">Seleccione la tarjeta que desea modificar:</h2>
                <Select
                        classNamePrefix="custom-select"
                        unstyled
                        data-1p-ignore
                        data-lpignore="true"
                        name="custom-select-name"
                        options={options}
                        // defaultValue={options[0]}
                        placeholder="Seleccione el tipo de tarjeta"
                        onChange={handleSelectChange}
                        styles={customStyles}
                        className="bg-background text-primary text-center w-100 cursor-pointer text-base sm:text-lg xl:text-xl"
                />
              </>
            )}

            {!selectedTarjeta && (
                <p className="text-secondary mt-4">Por favor, selecciona una tarjeta para modificarla.</p>
            )}
            
            {selectedTarjeta && (
                <TipoTarjetaInput 
                    inputType="modificar"
                    tipoTarjeta={selectedTarjeta.tipo} 
                    imagesQuantity={ selectedTarjeta.tipo === 'title-dbl-img' ? 2 : (selectedTarjeta.tipo === 'bg-image' || selectedTarjeta.tipo === 'bg-img-title' || selectedTarjeta.tipo === 'title-img' ? 1 : 0) }
                    useTitle={ selectedTarjeta.tipo === 'title' || selectedTarjeta.tipo === 'title-dbl-img' || selectedTarjeta.tipo === 'title-img' || selectedTarjeta.tipo === 'bg-img-title'}
                    tipoDescripcion={ selectedTarjeta.tipo === 'title-dbl-img' ? 'Título y dos imágenes' : selectedTarjeta.tipo === 'bg-image'? 'Sólo imagen de fondo': selectedTarjeta.tipo === 'bg-img-title'? 'Imagen de fondo y título' : selectedTarjeta.tipo === 'title-img' ? 'Título y una imagen' : 'Sólo título'}
                    tarjetaExistente={selectedTarjeta}
                />
            )}
        </div>
    );
}