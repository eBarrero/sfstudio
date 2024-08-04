import {create} from 'zustand';
import { modelReader } from '../services/salesforceSchema/proxy';





interface ModelState {
    state: {
        action: string;
        orgSfName: SchemaName;
        sObjectApiName: SObjectApiName;
        sObjectLocalId: SObjectLocalId;
    };
    filerSObject?: SObjectsFilter
    queryState: QueryState;
    sqlState: SQLState;
    setOrg: (orgSfName: SchemaName) => void; 
    setSObject: (sObjectLocalId:SObjectLocalId) => void;
    addReference: (fieldIndex: FieldLocalId) => void; 
    showRelataionByApiName: (sObjectApiName: string) => void;
    showByqueryElemntsIndex: (index: number) => void;
    doAction: (fieldIndex: number, action: string) => void;
    addWhere: (SimpleCondition: SimpleCondition) => void;
  } 

  const useModelState = create<ModelState>((set, get) => {
    return  {
        state:   { orgSfName: '', action: '', sObjectApiName: '', sObjectLocalId: - 1},
        queryState: { queryElemnts: [], indexCurrentElement: 0  },
        sqlState:   { sql: ''},

        setOrg: (orgSfName: SchemaName)  => {
            if (orgSfName === '') return;
            set({state: {orgSfName, action:'INI', sObjectApiName:'',  sObjectLocalId: -1}});
        },  
                                               
            
        // action deja de ser una marca para ver que componente mostrar y pasa a ser una accion que se va a realizar
        setSObject: (sObjectLocalId: SObjectLocalId) => {
            const orgSfName = get().state.orgSfName;
            const sObjectApiName = modelReader.getSObjectApiName(orgSfName, sObjectLocalId);
            const mainQuery: PrimaryQuery = {
                sObjectId:{orgSfName, sObjectLocalId, sObjectApiName},  
                parent:-1, 
                limit:1, 
                isAgregator:false, 
                type:'ROOT',
                selectClause: {fields: []} 
            };
            const queryState:QueryState = {queryElemnts: [mainQuery], indexCurrentElement: 0};
            set({state: {orgSfName, action:'sobject', sObjectApiName,  sObjectLocalId },queryState, sqlState: sqlState(queryState)});
        },
        addReference: (fieldIndex: FieldLocalId) => {
            console.log('addReference');
            const orgSfName = get().state.orgSfName;
            
                  
            const queryState = structuredClone(get().queryState); 
            const indexCurrentElement = queryState.indexCurrentElement;
            const parentQuery = queryState.queryElemnts[indexCurrentElement];  // the current elemwnt is the parent of the new element
            const newlevel = (parentQuery as ReletedObject).level + 1;         // the new level is the parent level + 1 (max. 5) 

            const field = modelReader.getField(orgSfName, parentQuery.sObjectId.sObjectLocalId, fieldIndex);
            const sObjectLocalId = modelReader.getSObjectLocalIdbyName(orgSfName, field.referenceTo[0]);
            const relatedObject : ReletedObject = {
                sObjectId: {orgSfName, sObjectLocalId, sObjectApiName: field.referenceTo[0]}, 
                parent: indexCurrentElement, 
                type:'RELETED', 
                relatedTo: field.relationshipName,
                level: newlevel 
            }
            queryState.indexCurrentElement = queryState.queryElemnts.push(relatedObject) - 1;

            set({state: {orgSfName, 
                         sObjectApiName:field.referenceTo[0], 
                         sObjectLocalId: sObjectLocalId, 
                         action: 'releted_sobject'}, 
                 queryState, 
                 sqlState: sqlState(queryState)
            }); 
        },        
        showRelataionByApiName: (sObjectApiName: SObjectApiName) => {
            const appState = get().state;
            //const sObjectId = Proxy.getSobjectIdByName(appState.orgSfName, sObjectApiName);

            const queryState = structuredClone(get().queryState); 

            queryState.queryElemnts.push({sObjectId, parent: queryState.currentElement, limit: 1, type:'SUBQUERY'} as fromObject);

            set({state: {orgSfName:appState.orgSfName, sObjectApiName:sObjectId.sObjectApiName, sObjectIndex: sObjectId.sObjectIndex, action: 'sobject'},
                 queryState, sqlState: sqlState(queryState)
            });
        },

        showByqueryElemntsIndex(index: number) {
            const queryState = structuredClone(get().queryState);
            const currentElement = queryState.indexCurrentElement = index;
            const query = queryState.queryElemnts[currentElement];
            let action ='sobject';
            if (query.type === 'RELETED') action = 'releted_sobject';   

            set({state: {
                orgSfName: query.sObjectId.orgSfName, 
                sObjectApiName: query.sObjectId.sObjectApiName, 
                sObjectLocalId: query.sObjectId.sObjectLocalId, 
                action},
                queryState
            });
        },
        doAction: (fieldIndex: number, action: string) => {
            console.log('acction ' + action);
            const queryState = structuredClone(get().queryState);
            const currentElement = queryState.currentElement;
            const query = queryState.queryElemnts[currentElement];  
            //const fieldId = Proxy.getFieldIdByIndex(query.sObjectId.orgSfName, query.sObjectId.sObjectIndex, fieldIndex);

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

