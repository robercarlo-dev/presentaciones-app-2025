"Use client";

import { useState, ChangeEvent, useEffect } from 'react';
import Select from 'react-select';
import toast from 'react-hot-toast';
import TipoTarjetaInput from './TipoTarjetaInput';
import { useTarjetas } from '@/hooks/useTarjetas';
import { Tarjeta } from '@/types/supabase';

export default function SelectorDeTarjetas() {
    const [SelectedTarjeta, setSelectedTarjeta] = useState<Tarjeta | null>(null);
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
            <h1 className="text-background text-3xl py-6">Selección de tarjetas</h1>
            <div data-1p-ignore data-lpignore="true" data-form-type="none" className="flex gap-4 items-center justify-start">
              <h2 className="text-background">Seleccione la tarjeta que quiere usar:</h2>
              <Select
                      classNamePrefix="custom-select"
                      unstyled
                      data-1p-ignore
                      data-lpignore="true"
                      name="custom-select-name"
                      options={options}
                      defaultValue={options[0]}
                      onChange={handleSelectChange}
                      styles={customStyles}
                      className="bg-background text-primary text-center w-100 text-base sm:text-lg xl:text-xl"
              />
            </div>
          
        </div>
    );
}