"use client";
import { useState } from 'react';
import Select from 'react-select';
import { Icon, IconName } from "../ui/SvgIcons";

// Interface genérica que acepta cualquier tipo de objeto con id y nombre
interface BaseItem {
  id: string;
  nombre: string;
}

// Props genéricas que aceptan cualquier tipo que extienda BaseItem
interface FullScreenSelectProps<T extends BaseItem> {
  items: T[];
  defaultItemId?: string;
  onChange: (value: string) => void;
  onClose: () => void;
  placeholder?: string;
  iconName?: string;
  label?: string;
  // Props opcionales para personalizar las claves
  valueKey?: keyof T;
  labelKey?: keyof T;
  // Props para personalización adicional
  className?: string;
  buttonClassName?: string;
  modalClassName?: string;
}

export default function FullScreenSelect<T extends BaseItem>({
  items,
  defaultItemId,
  onChange,
  onClose,
  placeholder = "Seleccionar",
  iconName = "select",
  label,
  valueKey = "id" as keyof T,
  labelKey = "nombre" as keyof T,
  className = "",
  buttonClassName = "",
  modalClassName = ""
}: FullScreenSelectProps<T>) {
  const [isSelectVisible, setIsSelectVisible] = useState<boolean>(true);

  const handleButtonClick = () => {
    setIsSelectVisible(true);
  };

  const handleSelectChange = (selectedOption: any) => {
    console.log('Option selected:', selectedOption.value);
    onChange(selectedOption.value);
    setIsSelectVisible(false);
  };

  const handleCloseClick = () => {
    onClose();
    // setIsSelectVisible(false);
  };

  // Mapeo genérico usando las claves proporcionadas
  const options = items.map(item => ({
    value: item[valueKey] as string,
    label: item[labelKey] as string
  }));

  const defaultValue = defaultItemId 
    ? options.find(option => option.value === defaultItemId)
    : undefined;

  const customStyles = {
    control: (provided: any, state: any) => ({
      ...provided,
      backgroundColor: state.isFocused ? '#f2e8cf' : '#f2e8cf',
      borderColor: state.isFocused ? '#a7c957' : '#ddd',
      boxShadow: 'none',
      '&:hover': {
        borderColor: '#a7c957',
      }
    }),
    singleValue: (provided: any) => ({
      ...provided,
      color: '#d65a39',
    }),
    option: (provided: any, state: any) => ({
      ...provided,
      backgroundColor: state.isSelected ? '#d65a39' : state.isFocused ? '#f0f0f0' : '#fff',
      color: state.isSelected ? '#fff' : '#333',
    }),
    menu: (provided: any) => ({
      ...provided,
      zIndex: 9999
    })
  };

  return (
    <div className={`flex absolute ml-3 items-center justify-center min-h-screen ${className}`}>
      {/* <button
        onClick={handleButtonClick}
        className={`flex gap-2 items-center text-xs hover:opacity-50 ${buttonClassName}`}
      >
        <p className="hidden sm:inline">{label}</p> 
        <Icon 
          name={(iconName || "select") as IconName} 
          size="xl" 
          className="fill-primary text-transparent" 
        />
      </button> */}

      {/* {isSelectVisible && ( */}
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-black/50 bg-opacity-80 z-50">
          <div className={`flex flex-col items-center w-9/10 sm:w-4/10 bg-secondary/95 p-6 ${modalClassName}`}>
            <h2 className="text-background mb-4 text-lg">{placeholder}</h2>
            <Select
              options={options}
              defaultValue={defaultValue}
              onChange={handleSelectChange}
              styles={customStyles}
              className="bg-background text-primary w-full text-base sm:text-lg xl:text-xl"
              placeholder={placeholder}
              autoFocus
            />
            <button
              onClick={handleCloseClick}
              className="mt-4 px-4 py-2 bg-primary text-background rounded hover:bg-gray-300"
            >
              Cerrar
            </button>
          </div>
        </div>
      {/* )} */}
    </div>
  );
}