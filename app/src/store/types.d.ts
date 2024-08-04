


type OperatorType = '=' | '!=' | '>' | '<' | '>=' | '<=' | 'LIKE' | 'IN' | 'NOT IN' | 'INCLUDES' | 'EXCLUDES' | string;



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


type AggregatorQuery = fromObject & {
    groupBy: FieldId[];
    having: SimpleCondition[];
    havingLogic: (LogicalOperator | number )[];
}

type QueryElementAbstract ={
    type: 'ROOT' | 'SUBQUERY' | 'RELETED' ;
    sObjectId: SObjectId;
    parent: number;
    selectClause?: SelectClause;
    where?: SimpleCondition[];
    whereLogic?: (LogicalOperator | number )[];
    level: 0|1|2|3|4|number;                       // It indicates the level of the query element in the query max. 5. ROOT and SUBQUERY are always level 0
}

type PrimaryQuery = QueryElement & {
    type: 'ROOT';
    agregatorQuery?: AgregatorQuery;
    orderBy?: OrderBy[];
    limit: number;
    offset?: number;
}

type NestedQuery = PrimaryQuery & {
    type: 'SUBQUERY';
    relationshipName: RelationshipName
}

type ReletedObject = QueryElement & {
    type: 'RELETED' ;
    relatedTo: RelationshipName ;
}

interface QueryState {
    queryElemnts: (PrimaryQuery | reletedObject | NestedQuery)[]; 
    indexCurrentElement: number;                                    // It indicates the index of the current element in the queryElemnts array
}
interface SQLState {        
    sql: string;
}