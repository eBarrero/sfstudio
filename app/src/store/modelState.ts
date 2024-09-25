import {create} from 'zustand';
import { modelReader } from '../services/salesforceSchema/proxy';
import constants from '../components/constants';
import { addCommand, NODEL_CMD } from '../core/commandManager';
import { SelectAllFieldsEnum } from "../core/constants/fields";







  const modelState = create<ModelState>((set, get) => {
    return  {
        state:   { orgSfName: '', action: '', sObjectApiName: '', sObjectLocalId: - 1, currentField: null},
        queryState: { queryElemnts: [], indexCurrentElement: 0  },
        sqlState:   { sql: '', isValid: false},
        currentSOQLFieldSelection: new Map<FieldLocalId, SOQLFieldSelectionState>,
        setOrg: (orgSfName: SchemaName)  => {
            if (orgSfName === '') return;
            set({state: {orgSfName, action:'INI', sObjectApiName:'',  sObjectLocalId: -1, currentField: null},});
        },  
                                               
            
        /*
        * Set the current sObject to be used in the query
        */
        setSObject: (sObjectLocalId: SObjectLocalId) => {
            const orgSfName = get().state.orgSfName;
            const sObjectApiName = modelReader.getSObjectApiName(orgSfName, sObjectLocalId);
            const mainQuery: PrimaryQuery = {
                sObjectId:{orgSfName, sObjectLocalId, sObjectApiName},  
                parent:-1, 
                limit:50, 
                type:'ROOT',
                level: 0,
                selectClause: {fields: []} 
            };
            const queryState:QueryState = {queryElemnts: [mainQuery], indexCurrentElement: 0};
            set({state: {orgSfName, action:'sobject', sObjectApiName,  sObjectLocalId },queryState, 
                sqlState: sqlState(queryState),
                currentSOQLFieldSelection: new Map<FieldLocalId, SOQLFieldSelectionState>,
                rankQueryElements: rankQueryElements(queryState.queryElemnts)                
            });
        },
        setField: (field: GetFieldsIndex) => {
            console.log('setField', );
            const state = get().state;
            state.currentField = field;
            state.action = 'field';
            set({state});
        },
        gotoLookup: (field: GetFieldsIndex) => {
            console.log('addReference');
            const orgSfName = get().state.orgSfName;
            
                  
            const queryState = structuredClone(get().queryState); 
            const indexCurrentElement = queryState.indexCurrentElement;
            const parentQuery = queryState.queryElemnts[indexCurrentElement];  // the current element is the parent of the new element
            const newlevel = (parentQuery as ReletedObject).level + 1;         // the new level is the parent level + 1 (max. 5) 
            const parentPath = (parentQuery as ReletedObject).path; // the new path is the parent path + fieldApiName + '.'
            const path = ((parentPath)?parentPath:'') + field.relationshipName + '.'; 
            console.log('path', path);
            
            
            const sObjectLocalId = field.referenceToLocalId![0];
            const relatedObject : ReletedObject = {
                sObjectId: {orgSfName, sObjectLocalId, sObjectApiName: field.referenceTo}, 
                path, 
                parent: indexCurrentElement, 
                type:'RELETED', 
                relatedTo: field.relationshipName!,
                level: newlevel,
                selectClause: {fields: []}  
            }
            queryState.indexCurrentElement = queryState.queryElemnts.push(relatedObject) - 1;

            set({state: {orgSfName, 
                         sObjectApiName: field.referenceTo, 
                         sObjectLocalId: sObjectLocalId, 
                         currentPath: path,
                         action: 'quitar action'}, 
                 queryState, 
                 sqlState: sqlState(queryState),
                 currentSOQLFieldSelection: new Map<FieldLocalId, SOQLFieldSelectionState>,
                 rankQueryElements: rankQueryElements(queryState.queryElemnts)            

            }); 
        },        
        gotoChild: (child: GetChildRelationships) => {
            const {orgSfName, sObjectLocalId, childSObject, relationshipName} = child;
            
            const queryState = structuredClone(get().queryState); 
            const newSubquery: NestedQuery = {
                sObjectId: {orgSfName, sObjectLocalId, sObjectApiName: childSObject},
                parent: 0,
                type:'SUBQUERY',
                level: 1,
                selectClause: {fields: []},
                relationshipName,
                limit : 1
            };

            queryState.indexCurrentElement = queryState.queryElemnts.push(newSubquery) - 1;
                
            set({state: {orgSfName, sObjectApiName:childSObject, sObjectLocalId, action: 'sobject'},
                 queryState, sqlState: sqlState(queryState),
                 currentSOQLFieldSelection: new Map<FieldLocalId, SOQLFieldSelectionState>,
                 rankQueryElements: rankQueryElements(queryState.queryElemnts)            
            });
        },

        showByqueryElemntsIndex(index: number) {
            console.log('showByqueryElemntsIndex', index);
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
                queryState,
                currentSOQLFieldSelection: createSOQLFieldSelection(query),
            });
        },
        doFieldAction: (fieldIndex: FieldLocalId, action: string) => {
            const { orgSfName } = get().state;
            const queryState = structuredClone(get().queryState);
            const currentElement = queryState.indexCurrentElement;
            const query = queryState.queryElemnts[currentElement];  

            if (action === constants.SELECTED) {
                const fieldId: FieldId = {fieldApiName: modelReader.getFieldApiName(orgSfName, query.sObjectId.sObjectLocalId, fieldIndex), fieldIndex};
                const SelectClauseField = {fieldId: fieldId, alias: undefined, aggregateFunction: undefined};
                query.selectClause!.fields!.push(SelectClauseField);
            }

            if (action === constants.UNSELECTED) {
                query.selectClause!.fields = query.selectClause!.fields?.filter((field) => field.fieldId.fieldIndex !== fieldIndex);
            }

            const currentSOQLFieldSelection  =  createSOQLFieldSelection(query);

            set({queryState, sqlState: sqlState(queryState), currentSOQLFieldSelection});
        },
        setSelectAllFields: (value:SelectAllFields) => {
            console.log('setSelectAllFields');
            const queryState = structuredClone(get().queryState);
            const currentElement = queryState.indexCurrentElement;
            const query = queryState.queryElemnts[currentElement];  

            query.selectClause.fieldsAll = value;
            const currentSOQLFieldSelection  =  createSOQLFieldSelection(query);

            // Rebuild select: Remove fields from query.selectClause?.fields based on the map conditions
            const newSelect =  query.selectClause.fields.filter((field) => {
                    const index = field.fieldId.fieldIndex;
                    return !currentSOQLFieldSelection.has(index) || !currentSOQLFieldSelection.get(index)?.isSelectNotAlled;
                });
            if (newSelect) query.selectClause.fields = newSelect;


            set({queryState, 
                 sqlState: sqlState(queryState),
                 currentSOQLFieldSelection
            });
        },
        addWhere: (SimpleCondition: SimpleCondition | pairCondition) => {
            console.log('addWhere',SimpleCondition);
            const queryState = structuredClone(get().queryState);
            const currentElement = queryState.indexCurrentElement;
            const query = queryState.queryElemnts[currentElement];  
            if (!query.where) {
                query.where = [];
            }
            query.where!.push(SimpleCondition);
            set({queryState, 
                sqlState: sqlState(queryState)
                });  
        },
        initializeModel: () => {
            // Create the commands for the field filter
            addCommand({...NODEL_CMD.SELECT_ALL_FIELDS ,     action: () => { get().setSelectAllFields(SelectAllFieldsEnum.ALL); } });
            addCommand({...NODEL_CMD.SELECT_STANDARD_FIELDS, action: () => { get().setSelectAllFields(SelectAllFieldsEnum.STANDARD); } });
            addCommand({...NODEL_CMD.SELECT_CUSTOM_FIELDS,   action: () => { get().setSelectAllFields(SelectAllFieldsEnum.CUSTOM); } });
            addCommand({...NODEL_CMD.SET_QUERY,              
                action: (actionParams: AcctionParams) => { 
                    const {data, application} = actionParams;
                    const params = application.currentCommand.split(' ');

                    const index = parseInt((params[1]==='')?'0':params[1]);
                    get().showByqueryElemntsIndex(index);
                    data.loadFields(get().state.orgSfName, get().state.sObjectLocalId);
                } 
            });
        }
    }
});

export default modelState;


function createSOQLFieldSelection(query: QueryElement): Map<FieldLocalId, SOQLFieldSelectionState> {
    console.log('createSOQLFieldSelection');
    const map = new Map<FieldLocalId, SOQLFieldSelectionState>();



    // if we use "ALL" or "CUSTOM" or "STANDARD", we need to: remove teh acurate fields from current selection and mark them as not selectable
    
    if (query.selectClause?.fieldsAll!==undefined ) {
        const { orgSfName, sObjectLocalId } = query.sObjectId;
        const object =  modelReader.getSObject(orgSfName,  sObjectLocalId);
        object.fields!.forEach((field) => {
            if ((query.selectClause?.fieldsAll === SelectAllFieldsEnum.ALL) || 
                (query.selectClause?.fieldsAll === SelectAllFieldsEnum.CUSTOM && field.custom) ||
                (query.selectClause?.fieldsAll === SelectAllFieldsEnum.STANDARD && !field.custom)) {
                    map.set(field.fieldLocalId, {isSelected:true, isWhere: false, isOrderBy: false, isSelectNotAlled:true});
                }
                
        });
    }

    query.selectClause?.fields?.forEach((field) => {
        if (!map.has(field.fieldId.fieldIndex)) {
            map.set(field.fieldId.fieldIndex, {isSelected:true, isWhere: false, isOrderBy: false, isSelectNotAlled:false});
        }
    });

    query.where?.forEach((where) => {
        if (map.has(where.field.fieldIndex)) {
            const item = map.get(where.field.fieldIndex);
            item!.isWhere = true;
            map.set(where.field.fieldIndex, item!);
        } else {
            map.set(where.field.fieldIndex, {isSelected:true, isWhere: true, isOrderBy: false, isSelectNotAlled:false});
        }
    });
    query.orderBy?.forEach((orderBy) => {
        if (map.has(orderBy.field.fieldIndex)) {
            const item = map.get(orderBy.field.fieldIndex);
            item!.isOrderBy = true;
            map.set(orderBy.field.fieldIndex, item!);
        } else {
            map.set(orderBy.field.fieldIndex, {isSelected:true, isWhere: false, isOrderBy: true, isSelectNotAlled:false});
        }
    });
    
    return map;
}   


function sqlState( queryState: QueryState  ): SQLState {

    function addLookupSelect(parent: number, currentSelect: string, previousRelatedTo: string): string {
        let select = currentSelect;
        query.forEach((queryElemnt, index) => {
            if (queryElemnt.type === 'RELETED' && queryElemnt.parent === parent) {
                
                const reletedObject = queryElemnt as ReletedObject;
                const newRelatedTo = previousRelatedTo + reletedObject.relatedTo + '.';
                select = addLookupSelect(index, select, newRelatedTo);
                
                reletedObject.selectClause?.fields?.forEach((field) => {
                    if  (select !== '')  select += ', ';
                    select += `${newRelatedTo}${field.fieldId.fieldApiName} `;
                });            
            }
        });

        return select;
    }






    const query = queryState.queryElemnts;
    let sqlSelect = '';
    let sqlFrom = 'FROM ';
    let sqlWhere = '';
    let sqlOrderBy = '';
    let sqlGroupBy = '';
    let sqlHaving = '';
    let sqlLimit = '';



    query.forEach((queryElemnt,index) => {
        if (queryElemnt.type === 'ROOT') {
            const rootQuery = queryElemnt as PrimaryQuery;
            if (rootQuery.selectClause?.fieldsAll!==undefined) sqlSelect += `SELECT ${rootQuery.selectClause?.fieldsAll} `;
            rootQuery.selectClause!.fields!.forEach((field) => {
                if  (sqlSelect === '')  sqlSelect='SELECT '; else sqlSelect += ', ';
                sqlSelect += `${field.fieldId.fieldApiName}`;
            });
            sqlSelect = addLookupSelect(0, sqlSelect, '');
            sqlFrom += `${rootQuery.sObjectId.sObjectApiName} `;
            rootQuery.where?.forEach((where) => {
                if  (sqlWhere === '')  sqlWhere='WHERE '; else sqlWhere += ' AND ';
                sqlWhere += `${where.sqlString} `;
            });


        } else if (queryElemnt.type === 'SUBQUERY') {
            const subQuery = queryElemnt as NestedQuery;
            let subQuerySelect = '';
            subQuery.selectClause?.fields?.forEach((field) => {
                if (subQuerySelect === '')  subQuerySelect='SELECT '; else subQuerySelect += ', ';
                subQuerySelect += `${field.fieldId.fieldApiName}`;
            });
            subQuerySelect = addLookupSelect(index, subQuerySelect, '');
            subQuerySelect+= ` FROM ${subQuery.relationshipName} `;
            if  (sqlSelect === '')  sqlSelect='SELECT '; else sqlSelect += ', ';
            sqlSelect += `(${subQuerySelect}) `;

        } 
    });




    sqlLimit = ` LIMIT ${ (query[0] as PrimaryQuery).limit} `;

    const sql = `${sqlSelect} ${sqlFrom} ${sqlWhere} ${sqlOrderBy} ${sqlGroupBy} ${sqlHaving} ${sqlLimit}`;
    const isValid = (sql.split("SELECT").length ===sql.split("FROM").length);
    return {sql, isValid};
}   

function rankQueryElements(queryElemnts: QueryElement[]): RankQueryElements[] {
    function calculateRankingPath(index: number ): string {
        let solution = '';
        if (index===0) return '';
        const parent = queryElemnts[index].parent;
        solution += calculateRankingPath(parent) + parent ; 
        return solution;
    }    

    return queryElemnts
        .map((_element, index): [string,  number] => [calculateRankingPath(index)+index.toString(),  index])
        .sort((a, b) => a[0].localeCompare(b[0]));
}

