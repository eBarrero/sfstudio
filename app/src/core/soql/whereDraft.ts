import type { Literal } from './domain';
import { renderPredicate } from './domain';
import { legacyConditionToPredicate } from './legacyAdapter';

export type WhereMode = 'null' | 'single' | 'range' | 'list' | 'literal';
export type WhereKind = 'text' | 'number' | 'date' | 'datetime' | 'boolean' | 'picklist' | 'multiselect';
export interface WhereDraft {
  field: FieldId;
  kind: WhereKind;
  mode: WhereMode;
  operator: string;
  from: string;
  to: string;
  values: string[];
  dateLiteral: string;
}

export const supportedDateLiterals = ['TODAY', 'YESTERDAY', 'TOMORROW', 'THIS_WEEK', 'LAST_WEEK',
  'NEXT_WEEK', 'THIS_MONTH', 'LAST_MONTH', 'NEXT_MONTH', 'THIS_YEAR', 'LAST_YEAR', 'NEXT_YEAR'];
const comparisonOperators = ['=', '!=', '>', '<', '>=', '<='];

function typedLiteral(kind: WhereKind, raw: string): Literal {
  if (raw.trim() === '') throw new Error('Enter a value before applying the condition.');
  if (kind === 'number') {
    const value = Number(raw);
    if (!Number.isFinite(value)) throw new Error('Enter a valid number.');
    return { kind: 'number', value };
  }
  if (kind === 'boolean') {
    if (raw !== 'true' && raw !== 'false') throw new Error('Choose True or False.');
    return { kind: 'boolean', value: raw === 'true' };
  }
  if (kind === 'date') {
    const parsed = new Date(`${raw}T00:00:00Z`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(raw) || Number.isNaN(parsed.getTime()) ||
      parsed.toISOString().slice(0, 10) !== raw)
      throw new Error('Enter a valid date in YYYY-MM-DD format.');
    return { kind: 'date', value: raw };
  }
  if (kind === 'datetime') {
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(raw) || Number.isNaN(Date.parse(raw)) ||
      new Date(raw).toISOString().slice(0, 19) !== raw.slice(0, 19))
      throw new Error('Enter a UTC date and time in YYYY-MM-DDTHH:mm:ssZ format.');
    return { kind: 'date', value: raw };
  }
  return { kind: 'text', value: raw };
}

export function buildWhereCondition(draft: WhereDraft): SimpleCondition | pairCondition {
  const { field, kind, mode, operator, from, to, values, dateLiteral } = draft;
  let condition: SimpleCondition | pairCondition;
  if (mode === 'null') {
    if (operator !== '=' && operator !== '!=') throw new Error('Choose Equals or Not equal for NULL.');
    condition = { field, operator, value: { kind: 'null' }, sqlString: '' };
  } else if (mode === 'literal') {
    if ((kind !== 'date' && kind !== 'datetime') || !supportedDateLiterals.includes(dateLiteral))
      throw new Error('Choose a supported date literal.');
    if (!comparisonOperators.includes(operator)) throw new Error('Choose a comparison operator.');
    condition = { field, operator, value: { kind: 'dateLiteral', value: dateLiteral }, sqlString: '' };
  } else if (mode === 'list') {
    if (kind !== 'text' && kind !== 'picklist' && kind !== 'multiselect')
      throw new Error('Lists are not supported for this field type.');
    if (!(kind === 'multiselect' ? ['INCLUDES', 'EXCLUDES'] : ['IN', 'NOT IN']).includes(operator))
      throw new Error('Choose a list operator.');
    if (!values.length || values.some(value => value.trim() === ''))
      throw new Error('Select at least one value.');
    condition = { field, operator, value: values.map(value => typedLiteral(kind, value)), sqlString: '' };
  } else if (mode === 'range') {
    if (!['=', '!='].includes(operator)) throw new Error('Choose Equals or Not equal for a range.');
    const first = typedLiteral(kind, from);
    const last = typedLiteral(kind, to);
    if (kind === 'number' ? Number(from) > Number(to) : from > to)
      throw new Error('From must be less than or equal to To.');
    condition = operator === '='
      ? { field, operator: '>=', value: first, logicalOperator: 'AND', operatorTo: '<=', valueTo: last, sqlString: '' }
      : { field, operator: '<', value: first, logicalOperator: 'OR', operatorTo: '>', valueTo: last, sqlString: '' };
  } else {
    if (!['=', '!=', '>', '<', '>=', '<=', 'LIKE'].includes(operator))
      throw new Error('Choose a comparison operator.');
    if (operator === 'LIKE' && kind !== 'text') throw new Error('LIKE is only available for text fields.');
    condition = { field, operator, value: typedLiteral(kind, from), sqlString: '' };
  }
  return { ...condition, sqlString: renderPredicate(legacyConditionToPredicate(condition)) };
}
