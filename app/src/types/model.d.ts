






type OperatorType = '=' | '!=' | '>' | '<' | '>=' | '<=' | 'LIKE' | 'IN' | 'NOT IN' | 'INCLUDES' | 'EXCLUDES' | string;
type LogicalOperator = 'AND' | 'OR' | '(' | ')';
  

interface SimpleCondition {
    sqlString: string;
    field: FieldId;
    operator: OperatorType;
    value: Any;
}
interface pairCondition extends SimpleCondition {
    logicalOperator: LogicalOperator;
    operatorTo: OperatorType;
    valueTo: Any;
}

interface OrderBy {
    field: FieldId;
    direction: 'ASC' | 'DESC';
  }




type SelectAllFields = SelectAllFieldsEnum.ALL | SelectAllFieldsEnum.CUSTOM | SelectAllFieldsEnum.STANDARD;

type SelectClauseField = {
    fieldId: FieldId;
    alias?: string;
    isAggregateFunction: boolean; 
    soqlFunction: SOQL_FUN_KEYWORDS;  
}

type SelectClause = {
    fields: SelectClauseField[];
    fieldsAll?: SelectAllFields;
}   


interface AggregatorQuery  {
    groupBy: FieldId[];
    having: SimpleCondition[];
    havingLogic: (LogicalOperator | number )[];
}

interface QueryElementAbstract {
    type: 'ROOT' | 'SUBQUERY' | 'RELETED' ;
    sObjectId: SObjectId;
    parent: number;
    selectClause: SelectClause;
    where?: (SimpleCondition | pairCondition)[];
    whereLogic?: (LogicalOperator | number )[];
    orderBy?: OrderBy[];
    level: 0|1|2|3|4|number;                       // It indicates the level of the query element in the query max. 5. ROOT and SUBQUERY are always level 0
}

interface PrimaryQuery extends QueryElementAbstract  {
    type: 'ROOT';
    aggregatorQuery?: AggregatorQuery;
    limit: number;
    offset?: number;
}

interface NestedQuery extends QueryElementAbstract  {
    type: 'SUBQUERY';
    aggregatorQuery?: AggregatorQuery;
    limit: number;
    offset?: number;    
    relationshipName: RelationshipName;
}

interface ReletedObject extends QueryElementAbstract  {
    type: 'RELETED' ;
    relatedTo: RelationshipName ;
    path: string;
}

type QueryElement = PrimaryQuery | NestedQuery | ReletedObject;
interface QueryState {
    queryElemnts: QueryElement[];   // It contains the list of query elements
    indexCurrentElement: number;    // It indicates the index of the current element in the queryElemnts array
}
interface SOQLFieldSelectionState {
    isSelected: boolean;
    isWhere: boolean;
    isOrderBy: boolean;
    isSelectNotAlled: boolean;
    selectFunction: string[]; 
}
interface SQLState {        
    sql: string;
    isValid: boolean;
}



type RankQueryElements =  [string,  number];

interface ModelState {
    state: {
        action: string;
        orgSfName: SchemaName;
        sObjectApiName: SObjectApiName;
        sObjectLocalId: SObjectLocalId;
        currentField?: GetFieldsIndex | null;
        currentPath: string;
    };
    filerSObject?: SObjectsFilter
    queryState: QueryState; // It contains the query elements: main quiery, subqueries and releted objects
    currentSOQLFieldSelection: Map<FieldLocalId, SOQLFieldSelectionState>;  // It contains the fields selected in the current query. filled by createSOQLFieldSelection() fucntion
    sqlState: SQLState;    // It contains the SQL statement to be executed
    rankQueryElements?: RankQueryElements[]; // It ranks the query elements to be displayed in the SOQLPath component
    setOrg: (orgSfName: SchemaName) => void; 
    setSObject: (sObjectLocalId:SObjectLocalId) => void;
    setField: (field: GetFieldsIndex) => void;
    gotoLookup: (field: GetFieldsIndex) => void; 
    gotoChild: (child: GetChildRelationships) => void;
    showByqueryElemntsIndex: (index: number) => void;
    doFieldAction: (fieldIndex: number, action: string, string = '%1', isAggregateFunction: boolean = false) => void;
    setSelectAllFields: (value: SelectAllFields) => void;
    addWhere: (SimpleCondition: SimpleCondition) => void;
    initializeModel: () => void;
  } 