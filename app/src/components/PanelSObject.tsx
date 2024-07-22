import { useEffect, useState } from 'react';
import { Controller} from '../DataModel/Model';
import { useAppState } from '../store/AppState';
import { GridTable, GridTableCell, GridTableRow } from './Atoms/GridTable';
import SOQLPanel from './Organisms/SOQLPanel';
import { SalesforceFieldEnum } from '../Constants/Fields';


export default function PanelSObject () {
    const {appState,  showReference, showRelataionByApiName, doAction, pushDialog    } = useAppState(); 
    const {orgSfName, sObjectIndex} = appState;
    const [fields, setFields] = useState<GetFieldsIndex[]>([]);
    const [relationShip, setRelationShip] = useState<GetChildRelationships[]>([]);


    async function getData() {
        try {
            const data = await Controller.getFields(orgSfName, sObjectIndex!) ;
            if (data!==null) { 
                setFields(data as GetFieldsIndex[]);
                setRelationShip(Controller.getChildRelationships(orgSfName, sObjectIndex!));
            }

        } catch(error) {
                console.log('Error in PanelSObject ' + (error as Error).message);
        }
    }
    


    useEffect(()=>{getData();}, [orgSfName, sObjectIndex]);      

    const onActionRowHandle = (rowId: string, action: string) => {
        console.log('onRowActionHandle:' + action + ' [' + rowId + ']');
        const fieldIndex = parseInt(rowId);
        if (action==="GOTO_REFERENCE") { 
            showReference(fieldIndex);
            return
        }
        if (action==="GOTO_RELATION") { 
            showRelataionByApiName(relationShip[fieldIndex].childSObject);
            return
        }

        if (action==="Click") {
            if (fields[fieldIndex].type===SalesforceFieldEnum.Date || fields[fieldIndex].type===SalesforceFieldEnum.DateTime) {
                console.log('pushDialog');
                pushDialog({component:'DataTime', info:{orgSfName, sObjectIndex, fieldIndex, fieldApiName:fields[fieldIndex].name} });
                return;
            }
            
        }
        doAction(fieldIndex, action); 
        
    }   


    /*    orgSfName: string;
    sObjectIndex: number;
    filedApiName: string;
    fieldIndex: number;*/

// {field.name} {field.label} {field.length} {field.precision} {field.scale} {field.unique} {field.custom} {field.type}
    return (
        <div>
             <SOQLPanel/>
            <span>name</span><input type="text" />
            <div className='container'>
                <div className='gridconfig'>  
                    <GridTable 
                    headerOff={true}
                    onActionRow={onActionRowHandle}
                    columns={[{label:'Type'},{label:'Field'}]} 
                    data={fields.map((field):GridTableRow => ({
                        rowId:field.index.toString(), 
                        data:[
                            parseTypeField(field), {label:`${field.name} - ${field.label}`} 
                        ]
                    }))}
                    />
                </div>
                <div className='gridconfig2'>  
                    <GridTable 
                    selectable={true}
                    headerOff={false}
                    onActionRow={onActionRowHandle}
                    columns={[{label:'API Name'},{label:'Reference Name'}]} 
                    data={relationShip.map((relation, index):GridTableRow => ({
                        rowId:index.toString(), 
                        data:[
                            {label:relation.childSObject,
                            iconType : '1toN',
                            tooltip : 'go to relationShip', 
                            action: 'GOTO_RELATION'
                            },  {label:relation.relationshipName}
                        ]
                    }))}
                    />
                </div>                
            </div>
        </div>
    )
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