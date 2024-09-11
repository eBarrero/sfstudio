import css from './style.module.css';
import constants from '../../constants';
import { GridTable, GridTableCell, GridTableRow } from "../../atoms/GridTable/gridTable";
import { SalesforceFieldTypes } from "../../../core/constants/fields";
import dataState  from "../../../store/dataState";
import modelState  from "../../../store/modelState";
import applicationState from '../../../store/applicationState';





    


export default function TableFields() {
    const {currentSOQLFieldSelection, doFieldAction } = modelState();
    const {sObjectFields}  = dataState();
    const { exeCommandFromUI} = applicationState();

    const onActionRowHandle = (rowId: string, action: string) => {
        console.log('onRowActionHandle:' + action + ' [' + rowId + ']');
        const fieldLocalId = parseInt(rowId.split('|')[0]);
        const index = parseInt(rowId.split('|')[1]);
        if (action===constants.GOTO_REFERENCE) { 
            exeCommandFromUI('.lookup_' + sObjectFields[index].fieldApiName);
            return;
        }  
        if (action===constants.ONCLICK) {
            exeCommandFromUI('._' + sObjectFields[index].fieldApiName);
        }      
        doFieldAction(fieldLocalId, action); 
    }
    
    console.log("sObjectFields", sObjectFields.length);
    return (
        <section>
            <h2>Fields</h2>
            <div className={css.grid}>
                <GridTable
                headerOff={true}
                onActionRow={onActionRowHandle}
                columns={[{label:'Type'},{label:'Field'}]}
                data={sObjectFields.map((field, index):GridTableRow => {
                    const itm = (currentSOQLFieldSelection.has(field.fieldLocalId))? currentSOQLFieldSelection.get(field.fieldLocalId) : undefined    
                    return {
                    rowId:field.fieldLocalId.toString() + '|' + index.toString(), 
                    checkDisabled: (itm===undefined)?false:itm.isSelectNotAlled,
                    isSelected: (itm===undefined)?false:itm.isSelected,
                    data:[
                        parseTypeField(field), 
                        {label:`${field.fieldApiName} - ${field.label}`} 
                    ]}
                })}
                />    
            </div>
        </section>
    );
}


const parseTypeField = (field: GetFieldsIndex):GridTableCell => {
    if (field.type===SalesforceFieldTypes.Reference)
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