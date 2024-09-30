import { useState, useEffect } from 'react';
import css from './style.module.css'
import DataTime, {CUSTOM_DATE, CUSTOM_RANGE_DATE } from '../../../core/constants/dataTime';
import { SalesforceFieldTypesEnum, SQLClauseAllowedByTypeField } from '../../../core/constants/fields';
import { t, LITERAL } from '../../../utils/utils';
import modelState  from '../../../store/modelState';  
import viewState from '../../../store/viewState';

// Components
import constants from '../../constants';
import OptionList from '../optionList/optionList';
import TitleBar from '../../atoms/TitleBar/titleBar';
import Tabs     from '../../atoms/Tabs/tabs';
import { RetroDateInput, RetroDateRangeInput }  from '../../atoms/RetroStyle/DateTimeInput/RetroDateTime';
import RetroQuantitySelector                    from '../../atoms/RetroStyle/QuantitySelector/RetroQuantitySelector';
import RetroCheckboxGroup                       from '../../atoms/RetroStyle/RadioGroup/RetroRadioGroup';



interface SelectProps {
    typeField: string;
    currentFieldSelection: SOQLFieldSelectionState;
    doFieldAction(action: string, value: string, makeGroupBy:boolean ): void;
}

const Select = (props: SelectProps) => {
    const { typeField, currentFieldSelection, doFieldAction } = props;
    const [selects, setSelects] = useState<string[]>([...currentFieldSelection.selectFunction]);  
    const [selectUnGrouped, setSelectUnGrouped] = useState<{code: string, label: string, help: string}[]>([]);
    const [selectGrouped, setSelectGrouped] = useState<{code: string, label: string, help: string}[]>([]);
    const [mirrors, setMirrors] = useState<string[]>([]);
    useEffect(() => {
        try {
            setSelectUnGrouped( SQLClauseAllowedByTypeField
                .get((typeField) as SalesforceFieldTypesEnum)!
                .filter( (selectClause) => selectClause.unGroupable)
                .map( (selectClause) =>  ({code:selectClause.keyWord, label:selectClause.description, help:t(selectClause.help)}) )
            );
            setSelectGrouped(SQLClauseAllowedByTypeField
                .get((typeField) as SalesforceFieldTypesEnum)!
                .filter( (selectClause) => selectClause.groupable)
                .map( (selectClause) =>  ({code:selectClause.keyWord, label:selectClause.description, help:t(selectClause.help)}) )
            );
            setMirrors(SQLClauseAllowedByTypeField
                .get((typeField) as SalesforceFieldTypesEnum)!
                .filter( (selectClause) => selectClause.makeGroupBy)
                .map( (selectClause) =>  selectClause.keyWord )
            );
        } catch (error) {
            console.error('Error in Select', error);  
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    },[]);

    const handelButton = (newCode: string) =>  {
        setSelects( (currentCodes) => {
            if (currentCodes.includes(newCode)) {
                return currentCodes.filter( (code) => code !== newCode);
            } else {
                return [...currentCodes, newCode];
            }
        });
    }
    const handelApplyButton = () => {
        // figura out the select clause to remove
        currentFieldSelection.selectFunction.forEach(element => { if (!selects.includes(element))  doFieldAction(constants.UNSELECTED, element, false);   });
        // figura out the select clause to add
        selects.forEach(element => { if (!currentFieldSelection.selectFunction.includes(element))  doFieldAction(constants.SELECTED, element, mirrors.includes(element));
        
        });
    }


    
        

    return (
        <div>
            <div className={css.ButtonApply}>
                <button type="button" onClick={handelApplyButton} >Apply</button>            
            </div>
            <RetroCheckboxGroup 
                label="Select ungroupped" 
                options={selectUnGrouped} 
                currentCodes={selects}
                onChange={handelButton}/>
            <RetroCheckboxGroup 
                label="Just for Grouping Selects" 
                options={selectGrouped} 
                currentCodes={selects}
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
    const { state, currentSOQLFieldSelection, doFieldAction   }  = modelState();
    const { currentField, currentPath }  = state;
    const { popDialog } = viewState();  

    const [currentTab, setCurrentTab] = useState('W');

    function onClose() {
        popDialog();
    }   

    const hanndleDoFieldAction = ( action: string, value: string,  makeGroupBy:boolean) => {
        if (currentField) {
            doFieldAction(currentField.fieldLocalId, action, value, makeGroupBy);
        }
    }


    return (
        <article className={css.container}>
            <div className={css.win}>
                {currentField &&  <>
                    <TitleBar title={`${currentField.type} - ${currentPath}${currentField.fieldApiName}`} onClose={onClose}  />
                    <Tabs tabs={[['Select',"S"],['Where',"W"],['Order',"O"]]} value={currentTab} onTabChange={setCurrentTab}/>
                    {currentTab === 'S' && <Select typeField={currentField.type} 
                                                   currentFieldSelection={currentSOQLFieldSelection.get(currentField.fieldLocalId)!} 
                                                   doFieldAction={hanndleDoFieldAction} />}
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












