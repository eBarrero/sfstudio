


interface CommandDefinition  {
    command: string;
    description: string;
    action: number;
    parameters?: string[];
    examples?: string[];
  }


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
    orderBy?: OrderBy[];
    level: 0|1|2|3|4|number;                       // It indicates the level of the query element in the query max. 5. ROOT and SUBQUERY are always level 0
}

type PrimaryQuery = QueryElementAbstract & {
    type: 'ROOT';
    aggregatorQuery?: AggregatorQuery;
    limit: number;
    offset?: number;
}

type NestedQuery = QueryElementAbstract & {
    type: 'SUBQUERY';
    aggregatorQuery?: AggregatorQuery;
    limit: number;
    offset?: number;    
    relationshipName: RelationshipName;
}

type ReletedObject = QueryElementAbstract & {
    type: 'RELETED' ;
    relatedTo: RelationshipName ;
}

type QueryElement = PrimaryQuery | NestedQuery | ReletedObject;

interface QueryState {
    queryElemnts: QueryElement[]; 
    indexCurrentElement: number;                                    // It indicates the index of the current element in the queryElemnts array
}
interface SQLState {        
    sql: string;
}


interface SOQLFieldSelectionState {
    isSelected: boolean;
    isWhere: boolean;
    isOrderBy: boolean;
}

