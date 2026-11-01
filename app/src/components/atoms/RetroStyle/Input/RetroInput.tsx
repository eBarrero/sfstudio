import css from './style.module.css';
import { useId, useState } from 'react';










const handleKeyDown = ( e: React.KeyboardEvent<HTMLInputElement>,  onEnter?: (newCalue: string) => void ) => {
  if (!onEnter) return
  if (e.key === 'Enter') {
      e.preventDefault();
      onEnter(e.currentTarget.value);
    }
};

const handleChanges = (e: React.ChangeEvent<HTMLInputElement>, onChangeValue?: (newValue: string) => void) => {
  onChangeValue && onChangeValue(e.currentTarget.value);
}



const areaHandleChanges = (e: React.ChangeEvent<HTMLTextAreaElement>, onChangeValue?: (newValue: string) => void) => {
  onChangeValue && onChangeValue(e.currentTarget.value);
}









interface ReturnOnChangeValues {
  typeHTML: string;
  from: string;
  to: string; 
  list?: string
}

interface RetroInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  onChangeValue?: (newValue: ReturnOnChangeValues) => void;
}

interface RetroAreaInputProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  onChangeValue?: (newValue: ReturnOnChangeValues) => void;
}

export const RetroInput: React.FC<RetroInputProps> = ({type='text', label, onChangeValue, ...props }) => {
  const generatedId = useId();
  const inputId = props.id ?? generatedId;
  function onChangeValueHandle(newValue: string) {
    onChangeValue && onChangeValue({typeHTML:type, from: newValue, to: ''});
  }


    return (
      <div>
        {label && <label className={css.retro_label} htmlFor={inputId}>{label}</label>}
        <input
          {...props}
          id={inputId}
          type = {type}
          className={css.retro_input}
          onKeyDown={(e) => handleKeyDown(e, onChangeValueHandle)}
          onChange={(e) => handleChanges(e, onChangeValueHandle)}
        />
      </div>
    );
}


interface RetroRangeInputProps {
  labelFrom?: string;
  labelTo?: string;
  onChangeRangeValue?: (newValue: ReturnOnChangeValues) => void;
  type: string
}

export const RetroRangeInput: React.FC<RetroRangeInputProps> = ({ labelFrom = 'From:',  labelTo = 'To:',   onChangeRangeValue,  type }) => {
    const [ inputString, setInputString ] = useState<ReturnOnChangeValues>({typeHTML:type, from: '', to: ''});

    function onChange1stValue(newValue: ReturnOnChangeValues)  {
      const next = {typeHTML: newValue.typeHTML, from: newValue.from, to: inputString.to};
      setInputString(next);
      onChangeRangeValue?.(next);
    } 
    function onChange2stValue(newValue: ReturnOnChangeValues)  {
      const next = {typeHTML: newValue.typeHTML, from: inputString.from, to: newValue.from};
      setInputString(next);
      onChangeRangeValue?.(next);
    } 


  return (
    <div className={css.retro_range_group}>
      <RetroInput
        value={inputString.from}
        label={labelFrom}
        onChangeValue={onChange1stValue}
        type={type}
      />
      <RetroInput
        value={inputString.to}
        label={labelTo}
        onChangeValue={onChange2stValue}
        type={type}
      />
    </div>
  );
};


// textArea 
export const RetroListInput: React.FC<RetroAreaInputProps> = ({label, onChangeValue, ...props }) => {
  const [value, setValue] = useState<string>('');
  const generatedId = useId();
  const inputId = props.id ?? generatedId;

  const areaHandleKeyDown = ( e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    const { selectionStart, selectionEnd } = e.currentTarget;
    setValue((prevValue) => {
      return (
        prevValue.slice(0, selectionStart) +
        '\n' +
        prevValue.slice(selectionEnd)
      );
    });
  };  

  function onChangeValueHandle(newValue: string) {
    setValue(newValue.replaceAll(',\n',',').replaceAll(',', ',\n').replaceAll(';', ',\n'));
    onChangeValue && onChangeValue({typeHTML:'textArea', from: '', to: '', list: newValue});
  }
  return (
    <div>
      {label && <label className={css.retro_label} htmlFor={inputId}>{label}</label>}
      <textarea
        {...props}
        id={inputId}
        rows={10}
        value={value}
        className={css.retro_input}
        onKeyDown={(e) => areaHandleKeyDown(e)}
        onChange={(e) => areaHandleChanges(e, onChangeValueHandle)}
      />
    </div>
  );
}
  

