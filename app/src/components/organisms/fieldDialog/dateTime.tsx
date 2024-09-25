import { useState, useEffect } from 'react';
import css from './style.module.css'
import DataTime, {CUSTOM_DATE, CUSTOM_RANGE_DATE} from '../../../core/constants/dataTime';
import { t, LITERAL } from '../../../utils/utils';
import modelState  from '../../../store/modelState';  
import viewState from '../../../store/viewState';

// Components
import OptionList from '../optionList/optionList';
import TitleBar from '../../atoms/TitleBar/titleBar';
import Tabs     from '../../atoms/Tabs/tabs';
import { RetroDateInput, RetroDateRangeInput }  from '../../atoms/RetroStyle/DateTimeInput/RetroDateTime';
import RetroQuantitySelector                    from '../../atoms/RetroStyle/QuantitySelector/RetroQuantitySelector';
import RetroCheckboxGroup                       from '../../atoms/RetroStyle/RadioGroup/RetroRadioGroup';

const Select = () => {
    const handelButton = (newCode: string) => () => {
        console.log('OrderBy', newCode);
    }
    return (
        <div>
            <RetroCheckboxGroup 
                label="Select" 
                options={[{code:'C1', label:'ISO 8601', help:"(By Default) AAAA-MM-DDTHH:MM:SSZ"},{code:'Format(%1)', label:'Format()', help:"is used to format values like dates, numbers, and currencies into a user-friendly format based on the locale of the current user.a"},  ]} 
                currentCodes={[]}
                onChange={handelButton}/>
        </div>
    );
}

const Orderby = () => {

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



const DateTime = () => {
    const { currentField, currentPath  }  = modelState().state;
    const { popDialog } = viewState();  

    const [currentTab, setCurrentTab] = useState('W');

    function onClose() {
        popDialog();
    }   

    return (
        <article className={css.container}>
            <div className={css.win}>
                {currentField &&  <>
                    <TitleBar title={`${currentField.type} - ${currentPath}${currentField.fieldApiName}`} onClose={onClose}  />
                    <Tabs tabs={[['Select',"S"],['Where',"W"],['Order',"O"]]} value={currentTab} onTabChange={setCurrentTab}/>
                    {currentTab === 'S' && <Select/>}
                    {currentTab === 'W' && <Where field={currentField} path={ (currentPath===undefined) ?'':currentPath } />}
                    {currentTab === 'O' && <Orderby/>}
                </>}
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
    field: GetFieldsIndex,
    path: string | undefined
}


const Where = (props:WhereProps) => {
    const { addWhere } = modelState();
    const { field, path} = props;
    const { fieldApiName, fieldLocalId, type: typeField } = field;
    //const [typeDataTime, setTypeDataTime] = useState(0);
    const [dateTimeLiteral , setDateTimeLiteral] = useState<DateTimeLiteral>();
    const [condition, setCondition] = useState<string>('');
    const [periods, setPeriods] = useState(1);
    const [sqlChunck, setSqlChunck] = useState<(SimpleCondition | pairCondition)>();
    const [dateTimes, setDateTimes] = useState<{type: string, from: string, to: string}>();
    
    useEffect(() => {
        if (!dateTimeLiteral) return

        const sqlKeyWord = dateTimeLiteral.sqlKeyWord + (dateTimeLiteral.paramRequired ? `:${periods}` : '');

        const dateTimesValue: DateTimeValues|undefined  = (dateTimes)? {type: dateTimes.type, from: dateTimes.from, to: dateTimes.to, typeField}:undefined;

        setSqlChunck(DataTime.getSQLChunck ({fieldApiName: path + fieldApiName ,  fieldIndex:fieldLocalId, condition, sqlKeyWord, dateTimes: dateTimesValue}));
        

    // eslint-disable-next-line react-hooks/exhaustive-deps
    },[condition,periods,dateTimeLiteral, dateTimes]);

    const handelDataTime = (type: string) =>  {
        setDateTimeLiteral({sqlKeyWord:type, description:t(type+".doc"), paramRequired:type.includes("N_")});        
    }   

    const handelButton = () => () => {
        sqlChunck && addWhere(sqlChunck) ;
    }

// {DataTime.getType().map( (typeDataTime) =>  (<button onClick={handelTypeDataTime(typeDataTime.type)} >{typeDataTime.description}</button>))}   
    return (
    <div>
        <div className={css.wherePanel}>

            <div className={css.panel}>
                <OptionList options={DataTime.getType().map( (typeDataTime) => { return  {id: typeDataTime.type.toString(), label:t(typeDataTime.description)}})}  
                title={t(LITERAL.DataTimeLiteral_Type)} 
                onSelect={handelDataTime}
                secondLevel={{
                    title: t(LITERAL.DataTimeLiteral_Periods),
                    load2ndLevel: (type: string) => { return DataTime.getDateTimeLiteral(parseInt(type)).map( (dateTimeLiteral) => { return  {id: dateTimeLiteral.sqlKeyWord, label:t(dateTimeLiteral.description)}}) }
                }}
                />
            </div>

            <div className={css.panel}>
                { dateTimeLiteral && <>
                    <p>{dateTimeLiteral.description}</p>
                    {dateTimeLiteral.paramRequired &&   <RetroQuantitySelector value={periods} min={1} max={30} label="Periods" onChange={setPeriods}/>}
                </>}
                {dateTimeLiteral?.sqlKeyWord.includes(CUSTOM_DATE)   &&  
                    <RetroDateInput 
                        type={DataTime.figureOutInputType(dateTimeLiteral.sqlKeyWord, typeField )} 
                        onChangeDateValue={setDateTimes}/>
                }
                {dateTimeLiteral?.sqlKeyWord.includes(CUSTOM_RANGE_DATE)   &&  
                    <RetroDateRangeInput 
                        type={DataTime.figureOutInputType(dateTimeLiteral.sqlKeyWord, typeField )} 
                        labelFrom="From" 
                        labelTo='To'  
                        onChangeDateValue={setDateTimes}/>
                }                
            </div>            

                 
            <div className={css.panel}>
                <OptionList options={DataTime.getDateTimeCondition().map( (dateTimeLiteral) => { return  {id: dateTimeLiteral.sqlKeyWord, label:t(dateTimeLiteral.description)}})}  
                title={t("Condition")} 
                onSelect={setCondition}/>
            </div>            
            

        </div>
        <section className={css.card}>
            <span className={css.cardTitle}>Predicate</span>
            <div>
                <span className={css.sql}>{sqlChunck?.sqlString}</span>
            </div>
            <button type="button" onClick={handelButton()} >Add</button>
            </section>        

    </div>        
    );
}












