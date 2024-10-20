// ListSelectionComponent.tsx
import { useState } from 'react';
import css from './style.module.css'

interface SelectItem {
  code: string;
  description: string;
}


interface ListSelectionComponentProps {
  initialValues: SelectItem[];
  availableCaption?: string;
  selectedCaption?: string;
  onSelectionChange: (selectedValues: string[], isInList:boolean) => void;
}

const ListSelectionComponent: React.FC<ListSelectionComponentProps> = ({ initialValues, onSelectionChange, availableCaption, selectedCaption }) => {
  const [availableValues, setAvailableValues] = useState<SelectItem[]>(initialValues);
  const [selectedValues, setSelectedValues] = useState<SelectItem[]>([]);
  const [inList, setInList] = useState<boolean>(true);

  
  // Mueve un valor del contenedor de disponibles al de seleccionados
  const moveToSelected = (value: SelectItem) => {
    setAvailableValues(availableValues.filter((item) => item.code !== value.code));
    const localSelectedValues = [...selectedValues, value];
    setSelectedValues(localSelectedValues);
    onSelectionChange && onSelectionChange(localSelectedValues.map((value) => value.code), inList);    
  };

  // Mueve un valor del contenedor de seleccionados al de disponibles
  const moveToAvailable = (value: SelectItem) => {
    const localSelectedValues = selectedValues.filter((item) => item.code !== value.code)
    setSelectedValues(localSelectedValues);
    setAvailableValues([...availableValues, value]);
    onSelectionChange && onSelectionChange(localSelectedValues.map((value) => value.code), inList);    
  };

  const onInListChange = (value: boolean) => {
    setInList(value);
    onSelectionChange && onSelectionChange(selectedValues.map((value) => value.code), value);    
  }

  return (
    <div className={css.list_selection_container}>
      {/* Contenedor de valores disponibles */}
      <div className={css.list_container}>
        <div>{availableCaption}</div>
        <div className={css.list}>
          {availableValues && availableValues.map((value,index ) => (
            <div key={`${value.code}|${index}` } className={css.list_item} onClick={() => moveToSelected(value)}>
              {configDescription(value)} 
            </div>
          ))}
        </div>
      </div>



      {/* Contenedor de valores seleccionados */}
      <div className={css.list_container}>
        <div>
        <input type="checkbox" onChange={(e) => { onInListChange(e.target.checked)}} /> Not In {selectedCaption}
        </div>
        <div className={css.list}>
          {selectedValues && selectedValues.map((value, index) => (
            <div key={`${value.code}|${index}` } className={css.list_item} onClick={() => moveToAvailable(value)}>
              {configDescription(value)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ListSelectionComponent;

function configDescription(value: SelectItem ): string {
  if (value.code===value.description) return value.description;
  return `${value.description} [${value.code}]`;
}