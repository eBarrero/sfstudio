import {create} from 'zustand';
import { Controller } from '../DataModel/Model';



interface DialogState {
    component: string;
    info: FieldId;
}

interface AppState {
    appState: {
        action: string;        
        orgSfName: string;
        sObjectApiName: string;
        sObjectIndex: number;
    };
    dialogState: DialogState[];
    queryState: QueryState;
    sqlState: sqlState;
    showSObjects: (orgSfName: string) => void; 
    showSObject: (orgSfName: string, sObject: string, sObjectIndex:number) => void;
    showReference: (fieldIndex: number) => void; 
    showRelataionByApiName: (sObjectApiName: string) => void;
    showByqueryElemntsIndex: (index: number) => void;
    pushDialog: (dialogState: DialogState) => void;
    popDialog: () => void;
    doAction: (fieldIndex: number, action: string) => void;
  } 

export const useAppState = create<AppState>((set, get) => {
    return  {
        appState:   { orgSfName: '', action: '', sObjectApiName: '', sObjectIndex: - 1},
        dialogState: [],
        queryState: { queryElemnts: [], currentElement: 0  },
        sqlState:   { sql: ''},

        showSObjects: (orgSfName: string)                                       => 
            set({appState: {orgSfName, action: 'btn', sObjectApiName: '', sObjectIndex: -1}}),

        showSObject: (orgSfName: string, sObjectApiName: string, sObjectIndex: number) => {
            const mainQuery: fromObject = {
                sObjectId:{orgSfName,sObjectApiName,sObjectIndex},  
                parent:-1, 
                limit:1, 
                isAgregator:false, 
                type:'ROOT',
                selectClause: {fields: []} 
            };
            const queryState:QueryState = {queryElemnts: [mainQuery], currentElement: 0};

            set({appState: {orgSfName, sObjectApiName, sObjectIndex, action: 'sobject'},queryState, sqlState: sqlState(queryState)});
        },
        showReference: (fieldIndex: number) => {
            const appState = get().appState;
            const reletedSObject = Controller.getReferenceSObjectId(appState.orgSfName, appState.sObjectIndex!, fieldIndex);
                  
            const queryState = structuredClone(get().queryState); 
            const currentElement = queryState.currentElement;
            const parentQuery = queryState.queryElemnts[currentElement];
            const newlevel = (parentQuery as reletedObject).level + 1;

            queryState.queryElemnts.push({sObjectId: reletedSObject, parent: queryState.currentElement, level: newlevel, limit: 1, type:'RELETED'} as reletedObject);
            queryState.currentElement = queryState.queryElemnts.length - 1;
            set({appState: {orgSfName:appState.orgSfName, sObjectApiName:reletedSObject.sObjectApiName, sObjectIndex: reletedSObject.sObjectIndex, action: 'sobject'} , 
                 queryState, sqlState: sqlState(queryState)
            }); 
        },        
        showRelataionByApiName: (sObjectApiName: string) => {
            const appState = get().appState;
            const sObjectId = Controller.getSobjectIdByName(appState.orgSfName, sObjectApiName);

            const queryState = structuredClone(get().queryState); 

            queryState.queryElemnts.push({sObjectId, parent: queryState.currentElement, limit: 1, type:'SUBQUERY'} as fromObject);

            set({appState: {orgSfName:appState.orgSfName, sObjectApiName:sObjectId.sObjectApiName, sObjectIndex: sObjectId.sObjectIndex, action: 'sobject'},
                 queryState, sqlState: sqlState(queryState)
            });
        },

        showByqueryElemntsIndex(index: number) {
            const queryState = structuredClone(get().queryState);
            const currentElement = queryState.currentElement = index;
            const query = queryState.queryElemnts[currentElement];

            set({appState: {orgSfName: query.sObjectId.orgSfName, sObjectApiName: query.sObjectId.sObjectApiName, sObjectIndex: query.sObjectId.sObjectIndex, action: 'sobject'},
                 queryState
            });
        },
        doAction: (fieldIndex: number, action: string) => {
            console.log('acction ' + action);
            const queryState = structuredClone(get().queryState);
            const currentElement = queryState.currentElement;
            const query = queryState.queryElemnts[currentElement];  
            const fieldId = Controller.getFieldIdByIndex(query.sObjectId.orgSfName, query.sObjectId.sObjectIndex, fieldIndex);

            if (action === 'SELECTED') {
                const SelectClauseField = {fields: fieldId, alias: undefined, aggregateFunction: undefined};
                query.selectClause!.fields!.push(SelectClauseField);
            }

            if (action === 'UNSELECTED') {
                query.selectClause!.fields = query.selectClause!.fields?.filter((field) => field.fields !== fieldId);
            }
            

            set({queryState, sqlState: sqlState(queryState)});
        },
        pushDialog: (dialogState: DialogState) => {
            const dialog = structuredClone(get().dialogState);
            dialog.push(dialogState);
            set({dialogState: dialog});
        },
        popDialog: () => {
            console.log('popDialog');
            const dialog = structuredClone(get().dialogState);
            dialog.pop();
            set({dialogState: dialog});
        }
    }
});

function sqlState( queryState: QueryState  ): sqlState {
    const query = queryState.queryElemnts;
    let sql = '';
    query.forEach((queryElemnt) => {
        if (queryElemnt.type === 'ROOT') {
            sql += `SELECT ${queryElemnt.selectClause?.fieldsAll} `;
            queryElemnt.selectClause?.fields?.forEach((field) => {
                sql += `${field.fields.orgSfName}.${field.fields.fieldApiName} `;
            });
            sql += `FROM ${queryElemnt.sObjectId.orgSfName}.${queryElemnt.sObjectId.sObjectApiName} `;
        }
    });
    return {sql};
}   

