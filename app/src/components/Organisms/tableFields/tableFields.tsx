import css from './style.module.css';
import constants from '../../constants';
import { GridTable, GridTableCell, GridTableRow } from "../../atoms/GridTable";
import { SalesforceFieldEnum } from "../../../constants/Fields";
import dataState  from "../../../store/dataState";
import modelState  from "../../../store/modelState";





    


export default function TableFields() {
    const {currentSOQLFieldSelection, doFieldAction: doAction, addReference} = modelState();
    const {sObjectFields}  = dataState();


    const onActionRowHandle = (rowId: string, action: string) => {
        console.log('onRowActionHandle:' + action + ' [' + rowId + ']');
        const fieldLocalId = parseInt(rowId);
        if (action===constants.GOTO_REFERENCE) { 
            addReference(fieldLocalId);
            return
        }        
        doAction(fieldLocalId, action); 
    }
    
    console.log("sObjectFields", sObjectFields.length);
    return (
        <div className={css.grid}>
            <GridTable
            headerOff={true}
            onActionRow={onActionRowHandle}
            columns={[{label:'Type'},{label:'Field'}]}
            data={sObjectFields.map((field):GridTableRow => {
                const itm = (currentSOQLFieldSelection.has(field.fieldLocalId))? currentSOQLFieldSelection.get(field.fieldLocalId) : undefined    
                return {
                rowId:field.fieldLocalId.toString(), 
                checkDisabled: (itm===undefined)?false:itm.isSelectNotAlled,
                isSelected: (itm===undefined)?false:itm.isSelected,
                data:[
                    parseTypeField(field), 
                    {label:`${field.sObjectApiName} - ${field.label}`} 
                ]}
            })}
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