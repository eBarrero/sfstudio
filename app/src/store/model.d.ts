


type OperatorType = '=' | '!=' | '>' | '<' | '>=' | '<=' | 'LIKE' | 'IN' | 'NOT IN' | 'INCLUDES' | 'EXCLUDES';



enum LogicalOperator {
    And = 'AND',
    Or = 'OR',
    Open = '(',
    Close = ')'
  }

interface SimpleCondition {
    field: FieldId;
    operator: OperatorType;
    value: Any;
}

interface OrderBy {
    field: FieldId;
    direction: 'ASC' | 'DESC';
  }

type AggregateFunction = 'COUNT' | 'SUM' | 'AVG' | 'MIN' | 'MAX' | 'COUNT_DISTINCT';
type SelectAllFields = 'FIELDS(ALL)' | 'FIELDS(CUSTOM)' | 'FIELDS(STABDARD)';

type SelectClauseField = {
    fields: FieldId;
    alias?: string;
    aggregateFunction?: AggregateFunction
}

type SelectClause = {
    fields: SelectClauseField[];
    fieldsAll?: SelectAllFields;
}   

type QueryElement ={
    type: 'ROOT' | 'SUBQUERY' | 'RELETED' ;
    sObjectId: SObjectId | SObjectReferenceId
    parent: number;
    selectClause?: SelectClause;
}

type fromObject = QueryElement & {
    isAgregator: boolean;
    where?: SimpleCondition[];
    whereLogic?: (LogicalOperator | number )[];
    orderBy?: OrderBy[];
    limit: number;
    offset?: number;
}

type agregatorQuery = fromObject & {
    groupBy: FieldId[];
    having: SimpleCondition[];
    havingLogic: (LogicalOperator | number )[];
}

type reletedObject = QueryElement & {
    level: 0|1|2|3|4|number;
}


type FieldId = {
    orgSfName: string;
    sObjectIndex: number;
    fieldApiName: string;
    fieldIndex: number;
}    

type SObjectId = {
    orgSfName: string;
    sObjectApiName: string;
    sObjectIndex: number;
}

type SObjectReferenceId = & SObjectId & {
    referenceName: string;
}

interface QueryState {
    queryElemnts: (fromObject | reletedObject | agregatorQuery)[]; 
    currentElement: number;  
}
interface sqlState {        
    sql: string;
}