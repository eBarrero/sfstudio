import css from './style.module.css';

/**
 * @description This component is a number selector, allows put a number directly or use the buttons to increase or decrease the value.
 * @param {number} value - The current value of the selector.
 * @param {number} min - The minimum value allowed.
 * @param {number} max - The maximum value allowed.
 * @param {string} label - The label to show in the selector.
 * @param {function} onChange - The function to call when the value changes.
 * @returns {JSX.Element} - The JSX element to render.
 */
interface QuantitySelectorProps {
    value: number;
    min: number;
    max: number;
    label: string;
    onChange: (value: number) => void;  
}

const RetroQuantitySelector = (props:QuantitySelectorProps) => {
    const {value, min, max, label, onChange} = props;

    const handleInput = (e:  React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value);
        if (value >= min && value <= max) onChange(value);
    };

    const handleDecrease = () => {
        if (value > min) onChange(value - 1);
    };

    const handleIncrease = () => {
        if (value < max) onChange(value + 1);
    };

    return (
        <div className={css.retro_quantity_selector}>
            <label className={css.retro_label}>{label}</label>
            <div>
                <button className={css.retro_quantity_button}  
                        disabled={value <= min} 
                        onClick={handleDecrease}>-</button>
                <input  type="number" 
                        className={`${css.retro_input} ${css.retro_quantity_input}`}
                        value={value} 
                        onChange={handleInput}/>
                <button className={css.retro_quantity_button} 
                        disabled={value >= max}
                        onClick={handleIncrease}>+</button>
            </div>        
        </div>
    );
}

export default RetroQuantitySelector;