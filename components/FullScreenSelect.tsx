"use client";
import { useState, ChangeEvent } from 'react';
import Select from 'react-select';
import { ListaPresentacion } from "@/types/ListaPresentacion";
import { Icon } from "./SvgIcons";

interface FullScreenSelectProps {
    listas: ListaPresentacion[];
    listaActivaId: string;
    onChange: (value: string) => void;
  }

export default function FullScreenSelect({listas, listaActivaId, onChange }: FullScreenSelectProps) {
  const [isSelectVisible, setIsSelectVisible] = useState<boolean>(false);

  const handleButtonClick = () => {
    setIsSelectVisible(true);
  };

  const handleSelectChange = (selectedOption: any) => {
    console.log('Option selected:', selectedOption.value);
    onChange(selectedOption.value);
    setIsSelectVisible(false);
  };

  const handleCloseClick = () => {
    setIsSelectVisible(false);
  };

  const options = listas.map(lista => ({
    value: lista.id,
    label: lista.nombre
  }));

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

  return (
    <div className="flex absolute ml-3 items-center justify-center min-h-screen">
      <button
        onClick={handleButtonClick}
        className="flex gap-2 items-center text-xs hover:opacity-50"
      >
        <p className="hidden sm:inline">Presentaciones</p> <Icon name="select" size="xl" className="fill-primary text-transparent" />
      </button>

      {isSelectVisible && (
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-black/50 bg-opacity-80 z-50">
            <div className="flex flex-col items-center bg-secondary/95 p-6">
                <h2 className="text-background mb-4 text-lg">Selecciona una presentación</h2>
                <Select
                    options={options}
                    defaultValue={options.find(option => option.value === listaActivaId)}
                    onChange={handleSelectChange}
                    styles={customStyles}
                    className="bg-background text-primary w-full text-base sm:text-lg xl:text-xl"
                />
                <button
                onClick={handleCloseClick}
                className="mt-4 px-4 py-2 bg-primary text-background rounded hover:bg-gray-300"
                >
                Cerrar
                </button>
            </div>
        </div>
      )}
    </div>
  );
};
