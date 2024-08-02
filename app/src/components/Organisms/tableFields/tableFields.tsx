import css from './style.module.css';
import { GridTable, GridTableCell, GridTableRow } from "../../atoms/GridTable";
import { SalesforceFieldEnum } from "../../../Constants/Fields";
import  useDataState  from "../../../store/dataState";



const onActionRowHandle = (rowId: string, action: string) => {
    console.log('onRowActionHandle:' + action + ' [' + rowId + ']');
}

export default function TableFields() {
    const sObjectFields  = useDataState().sObjectFields;

return (
    <div className={css.grid}>
        <GridTable
        headerOff={true}
        onActionRow={onActionRowHandle}
        columns={[{label:'Type'},{label:'Field'}]}
        data={sObjectFields.map((field):GridTableRow => ({
            rowId:field.fieldLocalId.toString(), 
            data:[
                parseTypeField(field), {label:`${field.name} - ${field.label}`} 
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
            action: 'GOTO_REFERENCE'
        }
    else return {
            label: field.type +  ((field.length!==0) ? `(${field.length})` : '')         
        }
}