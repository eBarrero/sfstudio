/** The supported, deliberately small SOQL syntax tree. No UI or transport types live here. */
export type Literal =
  | { kind: 'text'; value: string }
  | { kind: 'number'; value: number }
  | { kind: 'boolean'; value: boolean }
  | { kind: 'null' }
  | { kind: 'date'; value: string }
  | { kind: 'dateLiteral'; value: string };

export type Expression =
  | { kind: 'field'; path: string }
  | { kind: 'function'; name: AggregateFunction; field?: string };

export type AggregateFunction = 'COUNT' | 'COUNT_DISTINCT' | 'SUM' | 'AVG' | 'MIN' | 'MAX' | 'FORMAT' |
  'CALENDAR_MONTH' | 'CALENDAR_QUARTER' | 'CALENDAR_YEAR' | 'DAY_ONLY' |
  'FISCAL_MONTH' | 'FISCAL_QUARTER' | 'FISCAL_YEAR' | 'HOUR_IN_DAY' | 'WEEK_IN_YEAR';

export type Predicate =
  | { kind: 'comparison'; field: string; operator: '=' | '!=' | '>' | '<' | '>=' | '<=' | 'LIKE'; value: Literal }
  | { kind: 'set'; field: string; operator: 'IN' | 'NOT IN' | 'INCLUDES' | 'EXCLUDES'; values: Literal[] }
  | { kind: 'logical'; operator: 'AND' | 'OR'; operands: Predicate[] };

export type Selection =
  | { kind: 'expression'; expression: Expression; alias?: string }
  | { kind: 'fields'; scope: 'ALL' | 'CUSTOM' | 'STANDARD' }
  | { kind: 'subquery'; query: ChildQuery };

interface QueryClauses {
  select: Selection[];
  where?: Predicate;
  orderBy?: { field: string; direction: 'ASC' | 'DESC' }[];
  limit?: number;
  offset?: number;
}

export interface RootQuery extends QueryClauses {
  kind: 'root';
  from: string;
  groupBy?: Expression[];
}

export interface ChildQuery extends QueryClauses {
  kind: 'child';
  relationship: string;
}

export interface SoqlError { code: string; path: string; message: string }

const identifier = /^[A-Za-z][A-Za-z0-9_]*$/;
const pathIdentifier = /^[A-Za-z][A-Za-z0-9_]*(\.[A-Za-z][A-Za-z0-9_]*)*$/;
const dateValue = /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z)?$/;
const dateLiteral = /^(?:TODAY|YESTERDAY|TOMORROW|THIS_WEEK|LAST_WEEK|NEXT_WEEK|THIS_MONTH|LAST_MONTH|NEXT_MONTH|THIS_YEAR|LAST_YEAR|NEXT_YEAR|LAST_N_DAYS:\d{1,3}|NEXT_N_DAYS:\d{1,3}|N_DAYS_AGO:\d{1,3})$/;

export function validateQuery(query: RootQuery): SoqlError[] {
  const errors: SoqlError[] = [];
  const add = (code: string, path: string) => errors.push({ code, path, message: `${code} at ${path}` });
  const name = (value: string, path: string, dotted = false) => {
    if (!(dotted ? pathIdentifier : identifier).test(value)) add('INVALID_IDENTIFIER', path);
  };
  const expression = (value: Expression, path: string) => {
    if (value.kind === 'field') name(value.path, path, true);
    else {
      if (!['COUNT', 'COUNT_DISTINCT', 'SUM', 'AVG', 'MIN', 'MAX', 'FORMAT',
        'CALENDAR_MONTH', 'CALENDAR_QUARTER', 'CALENDAR_YEAR', 'DAY_ONLY',
        'FISCAL_MONTH', 'FISCAL_QUARTER', 'FISCAL_YEAR', 'HOUR_IN_DAY', 'WEEK_IN_YEAR'].includes(value.name)) add('INVALID_FUNCTION', path);
      if (value.field) name(value.field, `${path}.field`, true);
      else if (value.name !== 'COUNT') add('FIELD_REQUIRED', path);
    }
  };
  const predicate = (value: Predicate, path: string) => {
    if (value.kind === 'logical') {
      if (value.operands.length < 2) add('LOGICAL_OPERANDS_REQUIRED', path);
      value.operands.forEach((part, i) => predicate(part, `${path}.operands[${i}]`));
      return;
    }
    name(value.field, `${path}.field`, true);
    if (value.kind === 'comparison' && !['=', '!=', '>', '<', '>=', '<=', 'LIKE'].includes(value.operator)) add('INVALID_OPERATOR', `${path}.operator`);
    if (value.kind === 'set' && !['IN', 'NOT IN', 'INCLUDES', 'EXCLUDES'].includes(value.operator)) add('INVALID_OPERATOR', `${path}.operator`);
    const values = value.kind === 'set' ? value.values : [value.value];
    if (!values.length) add('VALUES_REQUIRED', path);
    values.forEach((literal, i) => {
      if (literal.kind === 'number' && !Number.isFinite(literal.value)) add('INVALID_NUMBER', `${path}.values[${i}]`);
      if (literal.kind === 'date' && !dateValue.test(literal.value)) add('INVALID_DATE', `${path}.values[${i}]`);
      if (literal.kind === 'dateLiteral' && !dateLiteral.test(literal.value)) add('INVALID_DATE_LITERAL', `${path}.values[${i}]`);
      if (value.kind === 'set' && literal.kind === 'null') add('INVALID_SET_VALUE', `${path}.values[${i}]`);
    });
  };
  const clauses = (value: QueryClauses, path: string, child: boolean) => {
    if (!value.select.length) add('SELECT_REQUIRED', `${path}.select`);
    const fields = value.select.filter(item => item.kind === 'fields');
    if (fields.length && (value.select.length !== 1 || child)) add('FIELDS_MUST_STAND_ALONE', `${path}.select`);
    value.select.forEach((item, i) => {
      const at = `${path}.select[${i}]`;
      if (item.kind === 'expression') {
        expression(item.expression, `${at}.expression`);
        if (item.alias) name(item.alias, `${at}.alias`);
      } else if (item.kind === 'subquery') {
        if (child) add('NESTED_SUBQUERY_UNSUPPORTED', at);
        name(item.query.relationship, `${at}.relationship`);
        clauses(item.query, at, true);
      } else if (!['ALL', 'CUSTOM', 'STANDARD'].includes(item.scope)) {
        add('INVALID_FIELDS_SCOPE', `${at}.scope`);
      }
    });
    if (value.where) predicate(value.where, `${path}.where`);
    value.orderBy?.forEach((order, i) => name(order.field, `${path}.orderBy[${i}].field`, true));
    if (value.limit !== undefined && (!Number.isSafeInteger(value.limit) || value.limit < 1 || value.limit > 2000)) add('INVALID_LIMIT', `${path}.limit`);
    if (value.offset !== undefined && (!Number.isSafeInteger(value.offset) || value.offset < 0 || value.offset > 2000)) add('INVALID_OFFSET', `${path}.offset`);
  };
  name(query.from, 'query.from');
  clauses(query, 'query', false);
  query.groupBy?.forEach((part, i) => expression(part, `query.groupBy[${i}]`));
  const hasAggregate = query.select.some(item => item.kind === 'expression' && item.expression.kind === 'function' &&
    ['COUNT', 'COUNT_DISTINCT', 'SUM', 'AVG', 'MIN', 'MAX'].includes(item.expression.name));
  if (hasAggregate && query.select.some(item => item.kind === 'subquery')) add('AGGREGATE_SUBQUERY_UNSUPPORTED', 'query.select');
  if (hasAggregate && query.select.some(item => {
    if (item.kind !== 'expression' || item.expression.kind !== 'field') return false;
    const selectedPath = item.expression.path;
    return !query.groupBy?.some(group => group.kind === 'field' && group.path === selectedPath);
  })) add('GROUP_BY_REQUIRED', 'query.groupBy');
  return errors;
}

export function escapeLiteral(value: Literal): string {
  switch (value.kind) {
    case 'null': return 'NULL';
    case 'number': return String(value.value);
    case 'boolean': return value.value ? 'TRUE' : 'FALSE';
    case 'date':
    case 'dateLiteral': return value.value;
    case 'text': return `'${value.value.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n').replace(/\r/g, '\\r')}'`;
  }
}

export function renderQuery(query: RootQuery): string {
  const errors = validateQuery(query);
  if (errors.length) throw new SoqlValidationError(errors);
  const expression = (value: Expression): string => value.kind === 'field' ? value.path :
    `${value.name}(${value.field ?? ''})`;
  const predicate = (value: Predicate): string => {
    if (value.kind === 'logical') return `(${value.operands.map(predicate).join(` ${value.operator} `)})`;
    if (value.kind === 'set') return `${value.field} ${value.operator} (${value.values.map(escapeLiteral).join(', ')})`;
    return `${value.field} ${value.operator} ${escapeLiteral(value.value)}`;
  };
  const clauses = (value: QueryClauses): string => [
    value.where && `WHERE ${predicate(value.where)}`,
    value.orderBy?.length && `ORDER BY ${value.orderBy.map(order => `${order.field} ${order.direction}`).join(', ')}`,
    value.limit !== undefined && `LIMIT ${value.limit}`,
    value.offset !== undefined && `OFFSET ${value.offset}`,
  ].filter(Boolean).join(' ');
  const select = (value: Selection): string => {
    if (value.kind === 'fields') return `FIELDS(${value.scope})`;
    if (value.kind === 'expression') return `${expression(value.expression)}${value.alias ? ` ${value.alias}` : ''}`;
    return `(SELECT ${value.query.select.map(select).join(', ')} FROM ${value.query.relationship}${clauses(value.query) ? ` ${clauses(value.query)}` : ''})`;
  };
  return [`SELECT ${query.select.map(select).join(', ')} FROM ${query.from}`,
    query.where && `WHERE ${predicate(query.where)}`,
    query.groupBy?.length && `GROUP BY ${query.groupBy.map(expression).join(', ')}`,
    query.orderBy?.length && `ORDER BY ${query.orderBy.map(order => `${order.field} ${order.direction}`).join(', ')}`,
    query.limit !== undefined && `LIMIT ${query.limit}`,
    query.offset !== undefined && `OFFSET ${query.offset}`].filter(Boolean).join(' ');
}

export class SoqlValidationError extends Error {
  constructor(public readonly errors: SoqlError[]) { super('Invalid SOQL query'); }
}
