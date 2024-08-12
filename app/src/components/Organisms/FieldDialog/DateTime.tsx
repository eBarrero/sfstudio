import { useState, useEffect } from 'react';
import css from './local.module.css'
import DataTime from '../../../constants/DataTime';
import OptionList from '../OptionList';
import { useTranslation } from 'react-i18next';
import  modelState  from '../../../store/modelState';  
import viewState from '../../../store/viewState';



const DateTime = (props: DateTimeProps) => {
    const fieldId = props.fieldId;
    const { fieldApiName, fieldIndex } = fieldId;

    const [currentTab, setCurrentTab] = useState('W');

    return (
        <article className={css.container}>
            <div className={css.win}>
                <TitleBar title={`${fieldIndex} - ${fieldApiName}`}  />
                <Tabs tabs={[['Select',"S"],['Where',"W"],['Order',"O"]]} value={currentTab} onTabChange={setCurrentTab}/>
                {currentTab === 'S' && <Select/>}
                {currentTab === 'W' && <Where fieldId={fieldId} />}
                {currentTab === 'O' && <Orderby/>}
            </div>
        </article>
    );
} 

export default DateTime;


interface DateTimeLiteral {
    sqlKeyWord: string;
    description: string;
    paramRequired: boolean;
}

interface WhereProps {
    fieldId: FieldId;
}


const Where = (props:WhereProps) => {
    const { addWhere } = modelState();
    const { fieldApiName } = props.fieldId;
    const { t } = useTranslation(); 
    const [typeDataTime, setTypeDataTime] = useState(0);
    const [dateTimeLiteral , setDateTimeLiteral] = useState<DateTimeLiteral>({});
    const [condition, setCondition] = useState<string>('');
    const [periods, setPeriods] = useState(1);
    const [sqlWhere, setSqlWhere] = useState<string>('');
    const [sqlValue, setSqlValue] = useState<string>('');
    
    useEffect(() => {
        const value = dateTimeLiteral.sqlKeyWord + (dateTimeLiteral.paramRequired ? `:${periods}` : '');
        setSqlValue(value);         
        setSqlWhere(fieldApiName + " " + condition + " " + value);

    },[condition,periods,dateTimeLiteral]);

    const handelDataTime = (type: string) =>  {
        setDateTimeLiteral({sqlKeyWord:type, description:t(type+".doc"), paramRequired:type.includes("N_")});        
    }   
    const handelCondition = (type: string) =>  {
        setCondition(type);
    }

    const handelButton = () => () => {
        addWhere({field: props.fieldId, operator: condition, value: sqlValue});
    }

// {DataTime.getType().map( (typeDataTime) =>  (<button onClick={handelTypeDataTime(typeDataTime.type)} >{typeDataTime.description}</button>))}   
    return (
    <div>
        <div className={css.wherePanel}>

            <div className={css.panel}>
                <OptionList options={DataTime.getType().map( (typeDataTime) => { return  {id: typeDataTime.type.toString(), label:t(typeDataTime.description)}})}  
                title={t("DataTimeLiteral.Type")} 
                onSelect={handelDataTime}
                secondLevel={{
                    title: t("DataTimeLiteral.Literals"),
                    load2ndLevel: (type: string) => { return DataTime.getDateTimeLiteral(parseInt(type)).map( (dateTimeLiteral) => { return  {id: dateTimeLiteral.sqlKeyWord, label:t(dateTimeLiteral.description)}}) }
                }}

                />
            </div>

            <div className={css.panel}>
                <OptionList options={DataTime.getDateTimeCondition().map( (dateTimeLiteral) => { return  {id: dateTimeLiteral.sqlKeyWord, label:t(dateTimeLiteral.description)}})}  
                title={t("Condition")} 
                onSelect={handelCondition}/>
            </div>

            <div className={css.panel}>
                <p>{dateTimeLiteral.description}</p>
                {dateTimeLiteral.paramRequired &&   <QuantitySelector value={periods} min={1} max={10} label="Periods" onChange={setPeriods}/>}
                <label>Seleccione fecha y hora:</label>    
                <input type="datetime-local" id="datetime" name="datetime"/>
            
            </div>

            
            

        </div>
        <section className={css.card}>
            <span className={css.cardTitle}>Predicate</span>
            <div>
                <span className={css.sql}>{sqlWhere}</span>
            </div>
            <button type="button" onClick={handelButton()} >Add</button>
            </section>        

    </div>        
    );
}

const OrderBy = () => {
    /*
    const [direction, setDirection] = useState<'ASC' | 'DESC'>('ASC');

    const handleDirection = (e) => setDirection(e.target.value as 'ASC' | 'DESC');

    const handleSubmit = () => onOrderBy(direction);
*/
    return (
        <form className="OrderBy">
            <select >
                <option>ASC</option>
                <option>DESC</option>
            </select>
            <button type="button" >Add</button>
        </form>
    );
}



interface TitleBarProps {
    title: string;
}

const TitleBar = (props:TitleBarProps) => {
    const popDialog =  viewState().popDialog;
    const {title} = props;
    return (
        <div className={css.titleBar}>
            <span>{title}</span>
            <button onClick={popDialog}>&#x2573;</button>
        </div>
    );
}


interface TabsProps {
    tabs: [string, string][];
    value: string;
    onTabChange: (value: string) => void;
}

const Tabs = (props:TabsProps) => {
    const {tabs, value, onTabChange} = props;
    return (
        <div>
            {tabs.map(([label, code]) => (
                <span className="titleSection" key={code} onClick={() => onTabChange(code)}>{label}</span>
            ))}
        </div>
    );
}   



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
    max?: number;
    label: string;
    onChange: (value: number) => void;  
}

const QuantitySelector = (props:QuantitySelectorProps) => {
    const {value, min, max, label, onChange} = props;

    const handleInput = (e) => {
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
        <div className="Select">
            <label>{label}</label>
            <button onClick={handleDecrease}>-</button>
            <input type="number" value={value} onChange={handleInput}/>
            <button onClick={handleIncrease}>+</button>
        </div>
    );
}
