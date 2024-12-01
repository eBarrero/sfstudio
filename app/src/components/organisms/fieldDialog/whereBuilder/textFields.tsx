import { useEffect, useState } from 'react';
import css from '../style.module.css'
import { t, LITERAL } from '../../../../utils/utils';
import OptionList from '../../optionList/optionList';
import { TextFieldCtrl, TextFieldLiteralTypeEnum, salesforceFieldTypesDefinition } from '../../../../core/constants/fields';
import { RetroInput, RetroRangeInput, RetroListInput } from '../../../atoms/RetroStyle/Input/RetroInput';


interface WhereProps {
    applyNewCondition: (newCondition: SimpleCondition | pairCondition) => void,
    field: GetFieldsIndex,
    path: string | undefined
}


const WhereTextField = (props:WhereProps) => {
    const { field, path, applyNewCondition} = props;
    const { fieldApiName, fieldLocalId, type: typeField } = field;
    const [sqlChunck, setSqlChunck] = useState<(SimpleCondition | pairCondition)>();
    const [typeCondition, setTypeCondition] = useState<string>('Single');
    const [condition, setCondition] = useState<string>('');
    const [param, setParam] = useState<{typeHTML: string, from: string, to: string, list?: string}>();

    useEffect(() => {
        const whereParamValues = (param)? {typeHTML: param.typeHTML, from: param.from, to: param.to, list: param.list,  typeField}:undefined;
        setSqlChunck(TextFieldCtrl.getSQLChunck ({fieldApiName: path + fieldApiName ,  fieldIndex:fieldLocalId, condition, keyWordWhere:typeCondition,  whereParamValues: whereParamValues}));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    },[condition,typeCondition, param]);



    const handelButton = () => () => {
        sqlChunck && applyNewCondition(sqlChunck) ;
    }

    return (
        <div>
        
            <div className={css.wherePanel}>
                <div className={css.panel}>
                    <OptionList options={TextFieldCtrl.getType().map( (textTypeCondition) => { return  {id: textTypeCondition.type, label:t(textTypeCondition.description)}})}  
                    title={t(LITERAL.TextLiteral_Type)} 
                    onSelect={(valor) => { setCondition('');  setTypeCondition(valor)}}
                    />
                </div>

                <div className={css.panel}>
                    {typeCondition==TextFieldLiteralTypeEnum.SINGLE.toString()    &&  
                        <RetroInput 
                            label='Value'
                            type={salesforceFieldTypesDefinition.get(typeField)!.typeHTML} 
                            onChangeValue={setParam}/>
                    }
                    {typeCondition==TextFieldLiteralTypeEnum.RANGE.toString()   &&  
                        <RetroRangeInput 
                            type={salesforceFieldTypesDefinition.get(typeField)!.typeHTML} 
                            labelFrom="From" 
                            labelTo='To'  
                            onChangeRangeValue={setParam}/>
                    }                
                    {typeCondition==TextFieldLiteralTypeEnum.LIST.toString()    &&  
                        <RetroListInput 
                            onChangeValue={setParam}/>
                    }                    
                </div>    

                {typeCondition &&        
                <div className={css.panel}>
                    <OptionList options={TextFieldCtrl.getTextCondition(typeCondition).map( (textLiteral) => { return  {id: textLiteral.sqlKeyWord, label:t(textLiteral.description)}})}  
                    title={t(LITERAL.Condition)} 
                    onSelect={setCondition}/>
                </div>  
                }   
            </div>
            {condition &&    
            <section className={css.card}>
                    <span className={css.cardTitle}>Predicate</span>
                    <div>
                        <span className={css.sql}>{sqlChunck?.sqlString}</span>
                    </div>
                    <button type="button" onClick={handelButton()} >Apply</button>
            </section>        
        }            
        </div>
    )
}

export default WhereTextField;