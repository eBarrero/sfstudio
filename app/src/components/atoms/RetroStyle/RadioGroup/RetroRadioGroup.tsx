import css from './style.module.css'



interface RetroCheckboxGroupProps {
  label?: string;
  options: { code: string, label: string, help: string }[];
  currentCodes: string[];
  onChange?: (code: string) => void;
}

const RetroCheckboxGroup: React.FC<RetroCheckboxGroupProps> = ({label, options, currentCodes = [],  onChange}) => {
    
  const handleChange = (code: string) => () => {
    if (onChange) {
      onChange(code);
    }
  };

  return ( 
    <div className={css.retro_CheckboxGroup}>
      {label && <label className={css.label}>{label}</label>}
      <div  className={css.checkbox_group}>
        {options.map((option, index) => (
          <div className={css.item}>  
            <label key={`${index}|${option.code}`} className={css.checkbox_label}>
                <input
                type="checkBox"
                value={option.code}
                checked={currentCodes.includes(option.code)}
                onChange={handleChange(option.code)}
                className={css.checkbox_input}/>
                <span className={css.select}>{option.label}</span>
            </label>
            <span  className={css.help}>{option.help}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RetroCheckboxGroup;
