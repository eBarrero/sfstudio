import css from './style.module.css';
import { useState } from 'react';
import { handleKeyDown, handleChanges } from '../../../utils';

interface RetroInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  onChangeValue?: (newValue: string) => void;
  
}

const RetroInput: React.FC<RetroInputProps> = ({ label, onChangeValue, ...props }) => {

    return (
      <div>
        {label && <label className={css.retro_label}>{label}</label>}
        <input
          {...props}
          className={css.retro_input}
          onKeyDown={(e) => handleKeyDown(e, onChangeValue)}
          onChange={(e) => handleChanges(e, onChangeValue)}
        />
      </div>
    );
}

interface DateTimeOnChangeValues {
  type: string;
  from: string
  to: string;
}


interface RetroDateInputProps extends RetroInputProps {
  onChangeDateValue?: (newDatetime: DateTimeOnChangeValues) => void;
  type: typeInputDates
}


export const RetroDateInput = ({type = 'date', ...props}: RetroDateInputProps) => {
  function onChangeValue(newValue: string) {
      props.onChangeDateValue && props.onChangeDateValue({type, from: newValue, to: ''});
  }
  return (<RetroInput {...props}  type={type} onChangeValue={onChangeValue} />);
};



interface RetroDateRangeInputProps {
  labelFrom?: string;
  labelTo?: string;
  onChangeDateValue?: (newValue: DateTimeOnChangeValues) => void;
  type: typeInputDates
}

export const RetroDateRangeInput: React.FC<RetroDateRangeInputProps> = ({ labelFrom = 'From:',  labelTo = 'To:',   onChangeDateValue,  type }) => {
    const [ dates, setDates ] = useState<DateTimeOnChangeValues>({type, from: '', to: ''});

    function onChangeValue1stDate(newValue: string)  {
      console.log('from', newValue);
      const newDates = {type, from: newValue, to: newValue};
      setDates(newDates);
      onChangeDateValue && onChangeDateValue(newDates);
    } 
    function onChangeValue2ndDate(newValue: string)  {
      console.log('to', newValue);
      const newDates = {...dates, to: newValue};
      setDates(newDates);
      onChangeDateValue && onChangeDateValue(newDates);
    } 


  return (
    <div className={css.retro_range_group}>
      <RetroInput
        value={dates.from}
        label={labelFrom}
        onChangeValue={onChangeValue1stDate}
        type={type}
      />
      <RetroInput
        value={dates.to}
        label={labelTo}
        onChangeValue={onChangeValue2ndDate}
        type={type}
      />
    </div>
  );
};

export default RetroDateRangeInput;

  

