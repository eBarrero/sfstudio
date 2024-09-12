






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


type SelectAllFields = SelectAllFieldsEnum.ALL | SelectAllFieldsEnum.CUSTOM | SelectAllFieldsEnum.STANDARD;

type SelectClauseField = {
    fieldId: FieldId;
    alias?: string;
    aggregateFunction?: AggregateFunction
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
    where?: SimpleCondition[];
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
}
interface SQLState {        
    sql: string;
    isValid: boolean;
}



