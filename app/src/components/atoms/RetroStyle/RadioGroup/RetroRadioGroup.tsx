import css from './style.module.css'



interface RetroCheckboxGroupProps {
  label?: string;
  options: { code: string, label: string, help: string }[];
  currentCodes: string[];
  onChange?: (code: string, checked: boolean) => void;
  enabled: boolean;
}

const RetroCheckboxGroup: React.FC<RetroCheckboxGroupProps> = ({label, options, currentCodes = [],  onChange, enabled}) => {
    
  const handleChange = (code: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange && onChange(code, event.target.checked);
  };
  
    
  return ( 
    <div className={css.retro_CheckboxGroup}>
      {label && <label className={css.label}>{label}</label>}
      <div  className={css.checkbox_group}>
        {options.map((option, index) => (
          <div key={`${index}|${option.code}`} className={css.item}>  
            <label className={css.checkbox_label}>
                <input
                disabled={!enabled}
                type="checkBox"
                value={option.code}
                checked={currentCodes.includes(option.code)}
                onChange={handleChange(option.code)}
                className={css.checkbox_input}/>
                <span className={`${enabled ? css.select : css.selectNoActive}`} >{option.label}</span>
            </label>
            <span  className={css.help}>{option.help}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RetroCheckboxGroup;
