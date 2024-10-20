import { useEffect, useState } from 'react';
import css from '../style.module.css'
import { TextFieldCtrl,TextFieldLiteralTypeEnum, Operator  } from '../../../../core/constants/fields';
import PicklistField from '../../../atoms/ListSelecction/ListSelection';


interface WhereProps {
    applyNewCondition: (newCondition: SimpleCondition | pairCondition) => void,
    field: GetFieldsIndex,
    path: string | undefined
}


const WherePickListField = (props:WhereProps) => {
    const { field, path, applyNewCondition} = props;
    const { fieldApiName, fieldLocalId, type: typeField } = field;
    const [sqlChunck, setSqlChunck] = useState<(SimpleCondition | pairCondition)>();
    const [listValues, setListValues] = useState<string[]>([]);
    const [condition, setCondition] = useState<string>(Operator.In);
    

    useEffect(() => {
        const whereParamValues =  {typeHTML: 'Text', from: '', to: '', list: listValues.join('\n'),  typeField}
        
        setSqlChunck(TextFieldCtrl.getSQLChunck ({
            fieldApiName: path + fieldApiName ,  
            fieldIndex:fieldLocalId, 
            condition, 
            keyWordWhere:TextFieldLiteralTypeEnum.LIST.toString(),  
            whereParamValues: whereParamValues}));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    },[condition,condition, listValues]);

    const handlePickList = (values: string[], isInList: boolean) => {
            setListValues(values);
            setCondition(isInList ? Operator.NotIn: Operator.In);
    }


    const handelButton = () => () => {
        sqlChunck && applyNewCondition(sqlChunck) ;
    }

    return (
        <div>
            <div className={css.panel}>
                <PicklistField initialValues={field.picklistValues.map((value) => { return {code: value.value, description:value.label}})} 
                               onSelectionChange={handlePickList} 
                               availableCaption='Available Values'
                               selectedCaption='Selected Values'
                               />
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

export default WherePickListField;