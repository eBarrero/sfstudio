import css from './style.module.css';
import constants from '../../constants';
import { GridTable, GridTableCell, GridTableRow } from "../../atoms/GridTable/gridTable";

import dataState  from "../../../store/dataState";
import modelState  from "../../../store/modelState";
import applicationState from '../../../store/applicationState';
import { SFFieldTypesEnum} from '../../../core/constants/fields'






    


export default function TableFields() {
    const {currentSOQLFieldSelection, doFieldAction } = modelState();
    const {sObjectFields}  = dataState();
    const { exeCommandFromUI} = applicationState();

    const onActionRowHandle = (rowId: string, action: string) => {
        console.log('onRowActionHandle:' + action + ' [' + rowId + ']');
        const fieldLocalId = parseInt(rowId.split('|')[0]);
        const index = parseInt(rowId.split('|')[1]);
        if (action===constants.GOTO_REFERENCE) { 
            exeCommandFromUI('lookup_' + sObjectFields[index].fieldApiName);
            return;
        }  
        if (action===constants.ONCLICK) {
            exeCommandFromUI(sObjectFields[index].fieldApiName);
        }      
        doFieldAction(fieldLocalId, action); 
    }
    
    
    return (
        <section>
            <h2>{sObjectFields.length} Fields</h2>
            <div className={css.TableFields}>
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


const parseTypeFieldString = (field: GetFieldsIndex):string => {
    if (field.type===SFFieldTypesEnum.Reference)
        return field.referenceTo;
        return field.type +  ((field.length!==0) ? `(${field.length})` : '')         
}

const parseTypeField = (field: GetFieldsIndex):GridTableCell => {
    if (field.type===SFFieldTypesEnum.Reference)
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


export function TableFieldsExtend() {
    const {sObjectFields}  = dataState();
    const onActionRowHandle = () => {
        let data =  'API Name, Type, Label, Description\n'; 
        sObjectFields.forEach((field) => { 
                data+=`${field.fieldApiName}, ${parseTypeFieldString(field)}, ${field.label}, "${(field.description)? field.description :''}"\n`
            })

            const blob = new Blob([data], { type: 'text/csv' });
            const link = document.createElement('a');
            link.href = window.URL.createObjectURL(blob);
            link.download = "filename";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link); 

        };


            





    
    return (
        <section>
            <div className={css.TableFieldsExtendedClass}>
                <GridTable
                headerOff={false}
                selectable={false}
                onActionRow={onActionRowHandle} 
                columns={[{label:'API Name'},{label:'Type'}, {label:'Label'}, {label:'Description'}]}
                data={sObjectFields.map((field, index):GridTableRow => {
                    return {
                    rowId:field.fieldLocalId.toString() + '|' + index.toString(), 
                    checkDisabled: true,
                    isSelected: false,
                    data:[
                        {label:`${field.fieldApiName}`},
                        parseTypeField(field), 
                        {label: `${field.label}`} ,
                        {label:(field.description)?field.description:'-'}
                    ]}
                })}
                />    
            </div>
        </section>
    );


}