import { useEffect } from 'react';
import css from './style.module.css';
import constants from '../../constants';
import { GridTable, GridTableCell, GridTableRow } from "../../atoms/GridTable";
import { SalesforceFieldEnum } from "../../../constants/Fields";
import dataState  from "../../../store/dataState";
import modelState  from "../../../store/modelState";
import { use } from 'i18next';




    


export default function TableFields() {
    const {state, currentSOQLFieldSelection, doAction, addReference} = modelState();
    const {sObjectFields, loadFields, loadFieldsFromReference}  = dataState();


    const onActionRowHandle = (rowId: string, action: string) => {
        console.log('onRowActionHandle:' + action + ' [' + rowId + ']');
        const fieldLocalId = parseInt(rowId);
        if (action===constants.GOTO_REFERENCE) { 
            addReference(fieldLocalId);
            return
        }        
        doAction(fieldLocalId, action); 
    }
    useEffect(()=>{
        console.log('TableFields useEffect' + state.action);
        if (state.action==='sobject') {
            console.log('object');    
            loadFields(state.orgSfName, state.sObjectLocalId);
            return;
        }
        console.log('loadFieldsFromReference');
        loadFieldsFromReference(state.orgSfName, state.sObjectLocalId);
    }, [state.orgSfName, state.sObjectLocalId]);

    currentSOQLFieldSelection && currentSOQLFieldSelection.forEach((value, key) => { console.log(key + ' ' + value.isSelected) } ) 

return (
    <div className={css.grid}>
        <GridTable
        headerOff={true}
        onActionRow={onActionRowHandle}
        columns={[{label:'Type'},{label:'Field'}]}
        data={sObjectFields.map((field):GridTableRow => ({
            rowId:field.fieldLocalId.toString(), 
            isSelected: currentSOQLFieldSelection && currentSOQLFieldSelection.get(field.fieldLocalId)?.isSelected,
            data:[
                parseTypeField(field), 
                {label:`${field.sObjectApiName} - ${field.label}`} 
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