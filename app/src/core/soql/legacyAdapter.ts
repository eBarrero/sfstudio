import type { ChildQuery, Expression, Literal, Predicate, RootQuery, Selection } from './domain';
import { renderQuery, validateQuery } from './domain';

const aggregateNames = new Set(['COUNT', 'COUNT_DISTINCT', 'SUM', 'AVG', 'MIN', 'MAX', 'FORMAT',
  'CALENDAR_MONTH', 'CALENDAR_QUARTER', 'CALENDAR_YEAR', 'DAY_ONLY', 'FISCAL_MONTH',
  'FISCAL_QUARTER', 'FISCAL_YEAR', 'HOUR_IN_DAY', 'WEEK_IN_YEAR']);

function expression(field: SelectClauseField, prefix = ''): Expression {
  const path = `${prefix}${field.fieldId.fieldApiName}`;
  const template = field.soqlFunction.trim();
  if (template === '%1') return { kind: 'field', path };
  if (template === 'COUNT()') return { kind: 'function', name: 'COUNT' };
  const match = /^([A-Za-z_]+)\(%1\)$/.exec(template);
  if (!match || !aggregateNames.has(match[1].toUpperCase())) return { kind: 'field', path: `INVALID_FUNCTION.${template}` };
  return { kind: 'function', name: match[1].toUpperCase() as Extract<Expression, { kind: 'function' }>['name'], field: path };
}

function literal(value: unknown): Literal {
  if (value === null || value === 'null') return { kind: 'null' };
  if (typeof value === 'boolean') return { kind: 'boolean', value };
  if (typeof value === 'number' || typeof value === 'string' && /^-?\d+(?:\.\d+)?$/.test(value))
    return { kind: 'number', value: Number(value) };
  if (typeof value !== 'string') return { kind: 'text', value: String(value) };
  if (value.startsWith("'") && value.endsWith("'")) return { kind: 'text', value: value.slice(1, -1) };
  if (/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}Z)?$/.test(value)) return { kind: 'date', value };
  if (/^[A-Z_]+(?::\d{1,3})?$/.test(value)) return { kind: 'dateLiteral', value };
  return { kind: 'text', value };
}

function predicate(condition: SimpleCondition | pairCondition): Predicate {
  const field = condition.field.fieldApiName;
  if ('operatorTo' in condition) return { kind: 'logical', operator: condition.logicalOperator === 'OR' ? 'OR' : 'AND', operands: [
    { kind: 'comparison', field, operator: condition.operator as '=' , value: literal(condition.value) },
    { kind: 'comparison', field, operator: condition.operatorTo as '=', value: literal(condition.valueTo) },
  ] };
  if (['IN', 'NOT IN', 'INCLUDES', 'EXCLUDES'].includes(condition.operator)) return {
    kind: 'set', field, operator: condition.operator as 'IN',
    values: String(condition.value ?? '').split(/[\n,]/).filter(Boolean).map(value => literal(`'${value.trim()}'`)),
  };
  return { kind: 'comparison', field, operator: condition.operator as '=', value: literal(condition.value) };
}

function conditions(conditions: (SimpleCondition | pairCondition)[] | undefined): Predicate | undefined {
  if (!conditions?.length) return undefined;
  if (conditions.length === 1) return predicate(conditions[0]);
  return { kind: 'logical', operator: 'AND', operands: conditions.map(predicate) };
}

export function legacyQueryToAst(state: QueryState): RootQuery | undefined {
  const elements = state.queryElemnts;
  const root = elements.find(element => element.type === 'ROOT') as PrimaryQuery | undefined;
  if (!root) return undefined;
  const fields = (parent: number, prefix = ''): Selection[] => {
    const own = elements[parent];
    return [
      ...own.selectClause.fields.map(field => ({ kind: 'expression' as const, expression: expression(field, prefix), alias: field.alias })),
      ...elements.flatMap((element, index) => element.type === 'RELETED' && element.parent === parent ?
        fields(index, `${prefix}${element.relatedTo}.`) : []),
    ];
  };
  const select: Selection[] = root.selectClause.fieldsAll ?
    [{ kind: 'fields', scope: root.selectClause.fieldsAll.replace(/^FIELDS\(|\)$/g, '') as 'ALL' }] : fields(elements.indexOf(root));
  elements.forEach((element, index) => {
    if (element.type !== 'SUBQUERY') return;
    const child: ChildQuery = { kind: 'child', relationship: element.relationshipName,
      select: fields(index), where: conditions(element.where), limit: element.limit, offset: element.offset,
      orderBy: element.orderBy?.map(order => ({ field: order.field.fieldApiName, direction: order.direction })) };
    select.push({ kind: 'subquery', query: child });
  });
  return { kind: 'root', from: root.sObjectId.sObjectApiName, select,
    where: conditions(root.where), limit: root.limit, offset: root.offset,
    groupBy: root.selectClause.fields.filter(field => field.makeGroupBy).map(field => expression(field)),
    orderBy: root.orderBy?.map(order => ({ field: order.field.fieldApiName, direction: order.direction })) };
}

export function legacySqlState(state: QueryState): SQLState {
  const ast = legacyQueryToAst(state);
  if (!ast || validateQuery(ast).length) return { sql: '', isValid: false };
  return { sql: renderQuery(ast), isValid: true };
}
