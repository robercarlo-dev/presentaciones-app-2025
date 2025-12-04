//Componente para crear tarjetas para la presentación que puede contener texto e imágenes
"Use client";

import { useState, ChangeEvent, useEffect } from 'react';
import Select from 'react-select';
import toast from 'react-hot-toast';
import TipoTarjetaInput from '../TipoTarjetaInput';
import { useTarjetas } from '@/hooks/useTarjetas';
// import { Icon } from './SvgIcons';
// import PptxGenJS from 'pptxgenjs';
// import { useMediaQuery } from "react-responsive";

export default function CrearTarjetas() {
    const [tipoTarjeta, setTipoTarjeta] = useState<string | null>(null);
    const { data: tarjetasCargados = [], isPending } = useTarjetas();

    const options = [
        { value: 'bg-image', label: 'Sólo imagen de fondo' },
        { value: 'bg-img-title', label: 'Imagen de fondo y título' },
        { value: 'title', label: 'Sólo título' },
        { value: 'title-dbl-img', label: 'Título y dos imágenes' },
        { value: 'title-img', label: 'Título y una imagen' }
      ]

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
        setTipoTarjeta(selectedOption.value);
    }

    return (
        <div className="flex flex-col gap-4 w-9/10 h-screen mx-auto bg-primary self-baseline mt-10 p-5 rounded-lg overflow-auto">
            <h1>Lista de tarjetas creadas</h1>
            {isPending && <p className="text-background mt-4">Cargando tarjetas...</p>}
            {!isPending && tarjetasCargados.length === 0 && (
                <p className="text-background mt-4">No hay tarjetas creadas aún.</p>
            )}
            {!isPending && tarjetasCargados.length > 0 && (
              <>
                <h1 className="text-background text-2xl py-2">Lista de tarjetas creadas:</h1>
                <ul className="list-disc list-inside bg-background text-secondary p-5 rounded-xl mt-2">
                    {tarjetasCargados.map((tarjeta) => (
                        <li key={tarjeta.id} className="mb-2">
                            Tipo: {tarjeta.tipo} | Nombre: {tarjeta.nombre || 'Sin nombre'}
                        </li>
                    ))}
                </ul>
              </>
            )}
            <h1 className="text-background text-3xl py-6">Creación de nuevas tarjetas</h1>
            <div data-1p-ignore data-lpignore="true" data-form-type="none" className="flex gap-4 items-center justify-start">
              <h2 className="text-background">Seleccione el tipo de tarjeta que quiere crear:</h2>
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
                      className="bg-background text-primary text-center w-100 text-base sm:text-lg xl:text-xl"
              />
            </div>
            
            {!tipoTarjeta && (
                <p className="text-secondary mt-4">Por favor, selecciona un tipo de tarjeta para comenzar a crearla.</p>
            )}
            
            {tipoTarjeta && (
                <TipoTarjetaInput 
                  inputType='crear'
                    tipoTarjeta={tipoTarjeta} 
                    imagesQuantity={ tipoTarjeta === 'title-dbl-img' ? 2 : (tipoTarjeta === 'bg-image' || tipoTarjeta === 'bg-img-title' || tipoTarjeta === 'title-img' ? 1 : 0) }
                    useTitle={ tipoTarjeta === 'title' || tipoTarjeta === 'title-dbl-img' || tipoTarjeta === 'title-img' || tipoTarjeta === 'bg-img-title'}
                    tipoDescripcion={ tipoTarjeta === 'title-dbl-img' ? 'Título y dos imágenes' : tipoTarjeta === 'bg-image'? 'Sólo imagen de fondo': tipoTarjeta === 'bg-img-title'? 'Imagen de fondo y título' : tipoTarjeta === 'title-img' ? 'Título y una imagen' : 'Sólo título' }
                />
            )}
        </div>
    );
}