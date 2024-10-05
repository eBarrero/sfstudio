import { useEffect, useState } from 'react';
import css from '../style.module.css'
import { t, LITERAL } from '../../../../utils/utils';
import DataTime, {CUSTOM_DATE, CUSTOM_RANGE_DATE } from '../../../../core/constants/dataTime';
import { RetroDateInput, RetroDateRangeInput }  from '../../../atoms/RetroStyle/DateTimeInput/RetroDateTime';
import RetroQuantitySelector                    from '../../../atoms/RetroStyle/QuantitySelector/RetroQuantitySelector';
import OptionList from '../../optionList/optionList';





interface DateTimeLiteral {
    sqlKeyWord: string;
    description: string;
    paramRequired: boolean;
}

interface WhereProps {
    applyNewCondition: (newCondition: SimpleCondition | pairCondition) => void,
    field: GetFieldsIndex,
    path: string | undefined
}


const WhereDataTime = (props:WhereProps) => {
    const { field, path, applyNewCondition} = props;
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
        sqlChunck && applyNewCondition(sqlChunck) ;
    }

// {DataTime.getType().map( (typeDataTime) =>  (<button onClick={handelTypeDataTime(typeDataTime.type)} >{typeDataTime.description}</button>))}   
    return (
    <div>
            <div className={css.ButtonApply}>
                <button type="button" onClick={handelButton()} >Apply</button>
            </div>

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
        </section>        

    </div>        
    );
}

export default WhereDataTime;