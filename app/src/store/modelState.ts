import {create} from 'zustand';
import { modelReader } from '../services/salesforceSchema/proxy';
import constants from '../components/constants';
import { addCommand, NODEL_CMD } from '../core/commandManager';
import { SelectAllFieldsEnum } from "../core/constants/fields";
import { legacySqlState } from '../core/soql/legacyAdapter';
import { MAX_PARENT_TO_CHILD_LEVELS } from '../core/soql/domain';
import { defaultWhereLogic, parseWhereLogic } from '../core/soql/whereLogic';
import { qualifiedFieldName, whereOwner } from '../core/soql/whereOwnership';
import { fieldCapabilities } from '../core/soql/fieldEditor';
import savedSoqlState from './savedSoqlState';







  const modelState = create<ModelState>((set, get) => {
    return  {
        state:   { orgSfName: '', action: '', sObjectApiName: '', sObjectLocalId: - 1, currentField: null, currentPath: ''},    
        queryState: { queryElemnts: [], indexCurrentElement: 0  },
        sqlState:   { sql: '', isValid: false},
        currentSOQLFieldSelection: new Map<FieldLocalId, SOQLFieldSelectionState>,


        setOrg: (orgSfName: SchemaName)  => {
            if (orgSfName === '') return;
            savedSoqlState.getState().clearCurrent();
            set({state: {orgSfName, action:'INI', sObjectApiName:'',  sObjectLocalId: -1, currentField: null, currentPath: ''},
                queryState: { queryElemnts: [], indexCurrentElement: 0 },
                sqlState: { sql: '', isValid: false },
                currentSOQLFieldSelection: new Map(),
                rankQueryElements: [],
            });
        },  
        clearOrg: () => {
            savedSoqlState.getState().clearCurrent();
            set({state: {orgSfName: '', action: '', sObjectApiName: '', sObjectLocalId: -1,
                currentField: null, currentPath: ''},
                queryState: { queryElemnts: [], indexCurrentElement: 0 },
                sqlState: { sql: '', isValid: false },
                currentSOQLFieldSelection: new Map(),
                rankQueryElements: [],
            });
        },
                                               
            
        /*
        * Set the current sObject to be used in the query
        */
        setSObject: (sObjectLocalId: SObjectLocalId) => {
            savedSoqlState.getState().clearCurrent();
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
            set({state: {orgSfName, action:'sobject', sObjectApiName,  sObjectLocalId, currentPath:'' },queryState, 
                sqlState: sqlState(queryState),
                currentSOQLFieldSelection: createSOQLFieldSelection(queryState, 0),
                rankQueryElements: rankQueryElements(queryState.queryElemnts)                
            });
        },
        loadSavedQuery: (saved: QueryState) => {
            const queryState = structuredClone(saved);
            queryState.indexCurrentElement = 0;
            const root = queryState.queryElemnts[0];
            const {orgSfName, sObjectApiName, sObjectLocalId} = root.sObjectId;
            set({
                state: {orgSfName, action: 'sobject', sObjectApiName, sObjectLocalId, currentField: null, currentPath: ''},
                queryState,
                sqlState: sqlState(queryState),
                currentSOQLFieldSelection: createSOQLFieldSelection(queryState, 0),
                rankQueryElements: rankQueryElements(queryState.queryElemnts),
            });
        },
        setField: (field: GetFieldsIndex) => {
            set({state: {...get().state, currentField: field, action: 'field'}});
        },
        gotoLookup: (field: GetFieldsIndex) => {
            const orgSfName = get().state.orgSfName;
            
                  
            const queryState = structuredClone(get().queryState); 
            const indexCurrentElement = queryState.indexCurrentElement;
            const parentQuery = queryState.queryElemnts[indexCurrentElement];  // the current element is the parent of the new element
            const newlevel = (parentQuery as ReletedObject).level + 1;         // the new level is the parent level + 1 (max. 5) 
            const parentPath = (parentQuery as ReletedObject).path; // the new path is the parent path + fieldApiName + '.'
            const path = ((parentPath)?parentPath:'') + field.relationshipName + '.'; 
            
            
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
                 currentSOQLFieldSelection: createSOQLFieldSelection(queryState, queryState.indexCurrentElement),
                 rankQueryElements: rankQueryElements(queryState.queryElemnts)            

            }); 
        },        
        gotoChild: (child: GetChildRelationships) => {
            const {orgSfName, sObjectLocalId, childSObject, relationshipName} = child;
            
            const queryState = structuredClone(get().queryState); 
            const parent = queryState.indexCurrentElement;
            const parentQuery = queryState.queryElemnts[parent];

            let parentToChildLevels = 1;
            for (let index = parent; index >= 0; index = queryState.queryElemnts[index].parent) {
                if (queryState.queryElemnts[index].type === 'SUBQUERY') parentToChildLevels += 1;
            }
            if (parentToChildLevels >= MAX_PARENT_TO_CHILD_LEVELS) {
                throw new Error('SOQL supports at most five levels of child relationships.');
            }

            if (queryState.queryElemnts[0].selectClause.fields.length>0 &&
                queryState.queryElemnts[0].selectClause.fields[0].isAggregateFunction ) {
                  throw new Error('You can not use child relationships in a query with aggregate functions');
             }            



            const newSubquery: NestedQuery = {
                sObjectId: {orgSfName, sObjectLocalId, sObjectApiName: childSObject},
                parent,
                type:'SUBQUERY',
                level: parentQuery.level + 1,
                selectClause: {fields: []},
                relationshipName,
                limit : 1
            };

            queryState.indexCurrentElement = queryState.queryElemnts.push(newSubquery) - 1;
                
            set({state: {orgSfName, sObjectApiName:childSObject, sObjectLocalId, action: 'sobject', currentPath:''},
                 queryState, sqlState: sqlState(queryState),
                 currentSOQLFieldSelection: createSOQLFieldSelection(queryState, queryState.indexCurrentElement),
                 rankQueryElements: rankQueryElements(queryState.queryElemnts)            
            });
        },

        showByqueryElemntsIndex(index: number) {
            const queryState = structuredClone(get().queryState);
            const currentElement = queryState.indexCurrentElement = index;
            const query = queryState.queryElemnts[currentElement];
            let action ='sobject';
            let path = '';
            if (query.type === 'RELETED')   {
                action = 'releted_sobject';   
                path = (query as ReletedObject).path;
            }
            set({state: 
                {
                    orgSfName: query.sObjectId.orgSfName, 
                    sObjectApiName: query.sObjectId.sObjectApiName, 
                    sObjectLocalId: query.sObjectId.sObjectLocalId, 
                    currentPath: path,
                    action
                }, 
                queryState, 
                sqlState: sqlState(queryState),
                currentSOQLFieldSelection: createSOQLFieldSelection(queryState, currentElement),
            });
        },
        doFieldAction: (fieldIndex: FieldLocalId, action: string, soqlFunction: string = '%1', isAggregateFunction: boolean = false, makeGroupBy: boolean = false ) => {
            const { orgSfName } = get().state;
            const queryState = structuredClone(get().queryState);
            const currentElement = queryState.indexCurrentElement;
            const query = queryState.queryElemnts[currentElement];  
            const { ownerIndex } = whereOwner(queryState, currentElement);
            const owner = queryState.queryElemnts[ownerIndex];
            const fieldApiName = modelReader.getFieldApiName(orgSfName, query.sObjectId.sObjectLocalId, fieldIndex);
            const field = modelReader.getSObject(orgSfName, query.sObjectId.sObjectLocalId)?.fields?.find(item => item.fieldLocalId === fieldIndex);
            if (action === constants.SELECTED && field &&
                !fieldCapabilities(field.type).select.some(option => option.keyWord === soqlFunction)) {
                throw new Error('This SELECT expression is not supported for the field type.');
            }
            const sameExpression = (item: SelectClauseField) =>
                item.fieldId.fieldApiName === fieldApiName && item.soqlFunction === soqlFunction;

            if (action === constants.SELECTED) {
                if (owner.selectClause.fieldsAll) throw new Error('Individual fields cannot be combined with FIELDS(...).');
                if (query.selectClause.fields.some(sameExpression)) return;
                if (isAggregateFunction && owner.type === 'SUBQUERY')
                    throw new Error('Aggregate expressions are not supported in child query blocks.');
                const blockFields = queryState.queryElemnts.flatMap((element, index) =>
                    whereOwner(queryState, index).ownerIndex === ownerIndex ? element.selectClause.fields : []);
                const hasAggregate = blockFields.some(item => item.isAggregateFunction) || isAggregateFunction;
                const hasUngroupedField = blockFields.some(item => !item.isAggregateFunction && !item.makeGroupBy) ||
                    (!isAggregateFunction && !makeGroupBy);
                if (hasAggregate && hasUngroupedField)
                    throw new Error('Group plain fields before combining them with aggregate expressions.');
                if (hasAggregate && ownerIndex === 0 && queryState.queryElemnts.some(item => item.type === 'SUBQUERY'))
                    throw new Error('Aggregate expressions cannot be combined with child queries.');

                const fieldId: FieldId = {fieldApiName, fieldIndex};
                const SelectClauseField = {fieldId: fieldId, alias: undefined, soqlFunction, isAggregateFunction, makeGroupBy};
                query.selectClause!.fields!.push(SelectClauseField);
            }

            if (action === constants.UNSELECTED) {
                query.selectClause.fields = query.selectClause.fields.filter(item => !sameExpression(item));
            }

            const currentSOQLFieldSelection  =  createSOQLFieldSelection(queryState, currentElement);

            set({queryState, sqlState: sqlState(queryState), currentSOQLFieldSelection});
        },
        setSelectAllFields: (value:SelectAllFields) => {
            const queryState = structuredClone(get().queryState);
            const currentElement = queryState.indexCurrentElement;
            const query = queryState.queryElemnts[currentElement];  

            query.selectClause.fieldsAll = value;
            const currentSOQLFieldSelection  =  createSOQLFieldSelection(queryState, currentElement);

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
            const queryState = structuredClone(get().queryState);
            const currentElement = queryState.indexCurrentElement;
            const { ownerIndex, relationshipPath } = whereOwner(queryState, currentElement);
            const query = queryState.queryElemnts[ownerIndex] as PrimaryQuery | NestedQuery;
            const provided = SimpleCondition.field.fieldApiName.split('.');
            const fieldApiName = provided.pop();
            if (!fieldApiName || (provided.length && provided.join('.') !== relationshipPath.join('.')))
                throw new Error('The field path does not match the current relationship.');
            const condition = { ...SimpleCondition, field: {
                ...SimpleCondition.field, fieldApiName, relationshipPath,
            } };
            if (!query.where) {
                query.where = [];
            }
            const previousCount = query.where.length;
            const previousLogic = query.whereLogic?.trim();
            query.where!.push(condition);
            query.whereLogic = !previousLogic || previousLogic === defaultWhereLogic(previousCount)
                ? defaultWhereLogic(query.where.length)
                : `(${previousLogic}) AND C${query.where.length}`;
            const currentSOQLFieldSelection = new Map(get().currentSOQLFieldSelection);
            const selected = currentSOQLFieldSelection.get(condition.field.fieldIndex);
            if (selected) currentSOQLFieldSelection.set(condition.field.fieldIndex, { ...selected, isWhere: true });
            set({queryState,
                sqlState: sqlState(queryState),
                currentSOQLFieldSelection,
            });
        },
        setWhereLogic: (elementIndex: number, expression: string) => {
            const current = get().queryState;
            const { ownerIndex } = whereOwner(current, elementIndex);
            const element = current.queryElemnts[ownerIndex] as PrimaryQuery | NestedQuery;
            if (!element?.where?.length) throw new Error('This query block has no WHERE conditions.');
            const normalized = expression.trim();
            parseWhereLogic(normalized, element.where.length);
            const queryState = structuredClone(current);
            (queryState.queryElemnts[ownerIndex] as PrimaryQuery | NestedQuery).whereLogic = normalized;
            set({queryState, sqlState: sqlState(queryState)});
        },
        setLimit: (elementIndex: number, limit: number | undefined) => {
            const current = get().queryState;
            const element = current.queryElemnts[elementIndex];
            if (!Number.isInteger(elementIndex) || !element || element.type === 'RELETED')
                throw new Error('Invalid SOQL query block.');
            if (limit !== undefined && (!Number.isSafeInteger(limit) || limit < 1 || limit > 2000))
                throw new Error('LIMIT must be a whole number from 1 to 2000.');
            const queryState = structuredClone(current);
            const block = queryState.queryElemnts[elementIndex] as PrimaryQuery | NestedQuery;
            if (limit === undefined) delete block.limit;
            else block.limit = limit;
            set({ queryState, sqlState: sqlState(queryState) });
        },
        addOrderBy: (field: GetFieldsIndex, direction: 'ASC' | 'DESC', nulls: 'FIRST' | 'LAST') => {
            if (field.sortable === false || fieldCapabilities(field.type).order === false)
                throw new Error('This field cannot be used in ORDER BY.');
            if (!['ASC', 'DESC'].includes(direction) || !['FIRST', 'LAST'].includes(nulls))
                throw new Error('Choose a direction and a NULLS policy.');
            const queryState = structuredClone(get().queryState);
            const { ownerIndex, relationshipPath } = whereOwner(queryState, queryState.indexCurrentElement);
            const owner = queryState.queryElemnts[ownerIndex] as PrimaryQuery | NestedQuery;
            const fieldId: FieldId = { fieldApiName: field.fieldApiName,
                fieldIndex: field.fieldLocalId, relationshipPath };
            const name = qualifiedFieldName(fieldId);
            if (owner.orderBy?.some(order => qualifiedFieldName(order.field) === name))
                throw new Error(`${name} is already used in ORDER BY for this query block.`);
            owner.orderBy = [...(owner.orderBy ?? []), { field: fieldId, direction, nulls }];
            set({ queryState, sqlState: sqlState(queryState),
                currentSOQLFieldSelection: createSOQLFieldSelection(queryState, queryState.indexCurrentElement) });
        },
        removeOrderBy: (elementIndex: number, orderIndex: number) => {
            const queryState = structuredClone(get().queryState);
            const { ownerIndex } = whereOwner(queryState, elementIndex);
            const owner = queryState.queryElemnts[ownerIndex] as PrimaryQuery | NestedQuery;
            if (!owner.orderBy || !Number.isInteger(orderIndex) || orderIndex < 0 || orderIndex >= owner.orderBy.length)
                throw new Error('The selected ORDER BY entry is unavailable.');
            owner.orderBy = owner.orderBy.filter((_, index) => index !== orderIndex);
            set({ queryState, sqlState: sqlState(queryState),
                currentSOQLFieldSelection: createSOQLFieldSelection(queryState, queryState.indexCurrentElement) });
        },
        moveOrderBy: (elementIndex: number, orderIndex: number, destination: number) => {
            const queryState = structuredClone(get().queryState);
            const { ownerIndex } = whereOwner(queryState, elementIndex);
            const owner = queryState.queryElemnts[ownerIndex] as PrimaryQuery | NestedQuery;
            const orders = owner.orderBy;
            if (!orders || !Number.isInteger(orderIndex) || !Number.isInteger(destination) ||
                orderIndex < 0 || destination < 0 || orderIndex >= orders.length || destination >= orders.length)
                throw new Error('The selected ORDER BY priority is unavailable.');
            const [moved] = orders.splice(orderIndex, 1);
            orders.splice(destination, 0, moved);
            set({ queryState, sqlState: sqlState(queryState) });
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


function createSOQLFieldSelection(queryState: QueryState, index: number): Map<FieldLocalId, SOQLFieldSelectionState> {
    const map = new Map<FieldLocalId, SOQLFieldSelectionState>();
    const query = queryState.queryElemnts[index];
    const { ownerIndex, relationshipPath } = whereOwner(queryState, index);
    const owner = queryState.queryElemnts[ownerIndex] as PrimaryQuery | NestedQuery;


    const { orgSfName, sObjectLocalId } = query.sObjectId;
    let fields: Fields[] = [];
    try {
        fields = modelReader.getSObject(orgSfName, sObjectLocalId).fields ?? [];
    } catch {
        // Navigation may precede loading metadata for the destination object.
    }

    // initialize the map with all fields of the object
    fields.forEach((field) => {
        map.set(field.fieldLocalId, {isSelected:false, isWhere: false, isOrderBy: false, isSelectNotAlled:false, selectFunction: []});
    });    

    // if we use "ALL" or "CUSTOM" or "STANDARD", we need to: remove teh acurate fields from current selection and mark them as not selectable
    if (query.selectClause?.fieldsAll!==undefined ) {
        fields.forEach((field) => {
            if ((query.selectClause?.fieldsAll === SelectAllFieldsEnum.ALL) || 
                (query.selectClause?.fieldsAll === SelectAllFieldsEnum.CUSTOM && field.custom) ||
                (query.selectClause?.fieldsAll === SelectAllFieldsEnum.STANDARD && !field.custom)) {
                    map.set(field.fieldLocalId, {isSelected:true, isWhere: false, isOrderBy: false, isSelectNotAlled:true, selectFunction: []});
            } 
        });
    }

    query.selectClause?.fields?.forEach((field) => {
        const current = map.get(field.fieldId.fieldIndex) ??
            {isSelected:false, isWhere: false, isOrderBy: false, isSelectNotAlled:false, selectFunction: []};
        map.set(field.fieldId.fieldIndex, {...current, isSelected: true,
            selectFunction: [...current.selectFunction, field.soqlFunction]});
    });

    owner.where?.filter(where => (where.field.relationshipPath ?? []).join('.') === relationshipPath.join('.'))
      .forEach((where) => {
        if (map.has(where.field.fieldIndex)) {
            const item = map.get(where.field.fieldIndex);
            item!.isWhere = true;
            map.set(where.field.fieldIndex, item!);
        } else {
            map.set(where.field.fieldIndex, {isSelected:true, isWhere: true, isOrderBy: false, isSelectNotAlled:false, selectFunction: []});
        }
      });

    owner.orderBy?.filter(order => (order.field.relationshipPath ?? []).join('.') === relationshipPath.join('.'))
    .forEach((orderBy) => {
        if (map.has(orderBy.field.fieldIndex)) {
            const item = map.get(orderBy.field.fieldIndex);
            item!.isOrderBy = true;
            map.set(orderBy.field.fieldIndex, item!);
        } else {
            map.set(orderBy.field.fieldIndex, {isSelected:true, isWhere: false, isOrderBy: true, isSelectNotAlled:false, selectFunction: []});
        }
    });
    
    return map;
}   


function sqlState(queryState: QueryState): SQLState {
    return legacySqlState(queryState);
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

