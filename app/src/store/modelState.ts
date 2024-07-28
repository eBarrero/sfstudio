import {create} from 'zustand';
import  Proxy  from '../services/salesforceSchema/proxy';
import { SimpleCondition, SQLState, QueryState, fromObject } from './types';





interface ModelState {
    state: {
        action: string;        
        orgSfName: string;
        sObjectApiName: string;
        sObjectIndex: number;
    };
    sobjects: GetSObjectsIndex[]
    filerSObject?: FilterSObject
    queryState: QueryState;
    sqlState: SQLState;
    setOrg: (orgSfName: string) => void; 
    showSObject: (orgSfName: string, sObject: string, sObjectIndex:number) => void;
    showReference: (fieldIndex: number) => void; 
    showRelataionByApiName: (sObjectApiName: string) => void;
    showByqueryElemntsIndex: (index: number) => void;
    doAction: (fieldIndex: number, action: string) => void;
    addWhere: (SimpleCondition: SimpleCondition) => void;
  } 

  const useModelState = create<ModelState>((set, get) => {
    return  {
        state:   { orgSfName: '', action: '', sObjectApiName: '', sObjectIndex: - 1},
        sobjects:[],
        queryState: { queryElemnts: [], currentElement: 0  },
        sqlState:   { sql: ''},

        setOrg: (orgSfName: string)  => {
            if (orgSfName === '') return;
            const filterSObject:FilterSObject = {name:'', custom:true,  queryable: true};
            Proxy.getSObjectsIndex(orgSfName, filterSObject).then((data) => {
                if (data!==null)            
                    set({state: {orgSfName, action: 'setOrgs', sObjectApiName: '', sObjectIndex: -1}, sobjects:data});
                });
        },  
                                               
            
        // action deja de ser una marca para ver que componente mostrar y pasa a ser una accion que se va a realizar
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

            set({state: {orgSfName, sObjectApiName, sObjectIndex, action: 'sobject'},queryState, sqlState: sqlState(queryState)});
        },
        showReference: (fieldIndex: number) => {
            const appState = get().state;
            const reletedSObject = Proxy.getReferenceSObjectId(appState.orgSfName, appState.sObjectIndex!, fieldIndex);
                  
            const queryState = structuredClone(get().queryState); 
            const currentElement = queryState.currentElement;
            const parentQuery = queryState.queryElemnts[currentElement];
            const newlevel = (parentQuery as reletedObject).level + 1;

            queryState.queryElemnts.push({sObjectId: reletedSObject, parent: queryState.currentElement, level: newlevel, limit: 1, type:'RELETED'} as reletedObject);
            queryState.currentElement = queryState.queryElemnts.length - 1;
            set({state: {orgSfName:appState.orgSfName, sObjectApiName:reletedSObject.sObjectApiName, sObjectIndex: reletedSObject.sObjectIndex, action: 'sobject'} , 
                 queryState, sqlState: sqlState(queryState)
            }); 
        },        
        showRelataionByApiName: (sObjectApiName: string) => {
            const appState = get().state;
            const sObjectId = Proxy.getSobjectIdByName(appState.orgSfName, sObjectApiName);

            const queryState = structuredClone(get().queryState); 

            queryState.queryElemnts.push({sObjectId, parent: queryState.currentElement, limit: 1, type:'SUBQUERY'} as fromObject);

            set({state: {orgSfName:appState.orgSfName, sObjectApiName:sObjectId.sObjectApiName, sObjectIndex: sObjectId.sObjectIndex, action: 'sobject'},
                 queryState, sqlState: sqlState(queryState)
            });
        },

        showByqueryElemntsIndex(index: number) {
            const queryState = structuredClone(get().queryState);
            const currentElement = queryState.currentElement = index;
            const query = queryState.queryElemnts[currentElement];

            set({state: {orgSfName: query.sObjectId.orgSfName, sObjectApiName: query.sObjectId.sObjectApiName, sObjectIndex: query.sObjectId.sObjectIndex, action: 'sobject'},
                 queryState
            });
        },
        doAction: (fieldIndex: number, action: string) => {
            console.log('acction ' + action);
            const queryState = structuredClone(get().queryState);
            const currentElement = queryState.currentElement;
            const query = queryState.queryElemnts[currentElement];  
            const fieldId = Proxy.getFieldIdByIndex(query.sObjectId.orgSfName, query.sObjectId.sObjectIndex, fieldIndex);

            if (action === 'SELECTED') {
                const SelectClauseField = {fields: fieldId, alias: undefined, aggregateFunction: undefined};
                query.selectClause!.fields!.push(SelectClauseField);
            }

            if (action === 'UNSELECTED') {
                query.selectClause!.fields = query.selectClause!.fields?.filter((field) => field.fields !== fieldId);
            }
            

            set({queryState, sqlState: sqlState(queryState)});
        },

        addWhere: (SimpleCondition: SimpleCondition) => {
            const queryState = structuredClone(get().queryState);
            const currentElement = queryState.currentElement;
            const query = queryState.queryElemnts[currentElement];  
            if (!query.where) {
                query.where = [];
            }
            query.where!.push(SimpleCondition);
            set({queryState, sqlState: sqlState(queryState)});  
        }
    }
});

export default useModelState;


function sqlState( queryState: QueryState  ): SQLState {
    const query = queryState.queryElemnts;
    let sql = '';
    query.forEach((queryElemnt) => {
        if (queryElemnt.type === 'ROOT') {
            sql += `SELECT ${queryElemnt.selectClause?.fieldsAll} `;
            queryElemnt.selectClause?.fields?.forEach((field) => {
                sql += `${field.fields.orgSfName}.${field.fields.fieldApiName} `;
            });
            sql += `FROM ${queryElemnt.sObjectId.orgSfName}.${queryElemnt.sObjectId.sObjectApiName} `;
            sql += "WHERE ";    
            (queryElemnt as fromObject).where?.forEach((where) => {
                sql += `${where.field.orgSfName}.${where.field.fieldApiName} ${where.operator} ${where.value} `;
            });
        }
    });
    return {sql};
}   

