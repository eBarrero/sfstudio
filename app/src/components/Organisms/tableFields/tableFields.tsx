import { useEffect } from 'react';
import css from './style.module.css';
import constants from '../../constants';
import { GridTable, GridTableCell, GridTableRow } from "../../atoms/GridTable";
import { SalesforceFieldEnum } from "../../../Constants/Fields";
import useDataState  from "../../../store/dataState";
import useModelState  from "../../../store/modelState";
import { use } from 'i18next';




    


export default function TableFields() {
    const {state, addReference} = useModelState();
    const {sObjectFields, loadFields, loadFieldsFromReference}  = useDataState();


    const onActionRowHandle = (rowId: string, action: string) => {
        console.log('onRowActionHandle:' + action + ' [' + rowId + ']');
        const FieldLocalId = parseInt(rowId);
        if (action===constants.GOTO_REFERENCE) { 
            addReference(FieldLocalId);
            return
        }        
    }
    useEffect(()=>{
        if (state.action!=='object') {
            console.log('object');    
            loadFields(state.orgSfName, state.sObjectLocalId);
            return;
        }
        console.log('loadFieldsFromReference');
        loadFieldsFromReference(state.orgSfName, state.sObjectLocalId);
    }, [state.orgSfName, state.sObjectLocalId]);

    

return (
    <div className={css.grid}>
        <GridTable
        headerOff={true}
        onActionRow={onActionRowHandle}
        columns={[{label:'Type'},{label:'Field'}]}
        data={sObjectFields.map((field):GridTableRow => ({
            rowId:field.fieldLocalId.toString(), 
            data:[
                parseTypeField(field), {label:`${field.sObjectApiName} - ${field.label}`} 
            ]
        }))}
        />    
    </div>
);
}


const parseTypeField = (field: GetFieldsIndex):GridTableCell => {
    if (field.type===SalesforceFieldEnum.Reference)
        return {
            iconType : '1to1',
            tooltip : 'go to reference',
            label: field.referenceTo,
            subLabel: '',
            action: constants.GOTO_REFERENCE
        }
    else return {
            label: field.type +  ((field.length!==0) ? `(${field.length})` : '')         
        }
}