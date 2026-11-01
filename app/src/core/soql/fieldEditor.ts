import { SFFieldTypesEnum, SQLClauseAllowedByTypeField, salesforceFieldTypesDefinition } from '../constants/fields';
import { whereOwner } from './whereOwnership';

/** A field index is only meaningful inside one object and one query element. */
export interface FieldEditorContext {
  orgKey: string;
  elementIndex: number;
  ownerIndex: number;
  relationshipPath: string[];
  fieldApiName: string;
  fieldIndex: number;
}

export function fieldEditorContext(state: QueryState, elementIndex: number, field: GetFieldsIndex): FieldEditorContext {
  const element = state.queryElemnts[elementIndex];
  if (!element) throw new Error('The selected query block is unavailable.');
  const { ownerIndex, relationshipPath } = whereOwner(state, elementIndex);
  return { orgKey: element.sObjectId.orgSfName, elementIndex, ownerIndex,
    relationshipPath, fieldApiName: field.fieldApiName, fieldIndex: field.fieldLocalId };
}

export function selectedFunctions(state: QueryState, context: FieldEditorContext): string[] {
  const element = state.queryElemnts[context.elementIndex];
  if (!element || element.sObjectId.orgSfName !== context.orgKey) return [];
  return element.selectClause.fields
    .filter(selection => selection.fieldId.fieldApiName === context.fieldApiName)
    .map(selection => selection.soqlFunction);
}

export function fieldCapabilities(type: string) {
  const definition = salesforceFieldTypesDefinition.get(type as SFFieldTypesEnum);
  const select = (SQLClauseAllowedByTypeField.get(type as SFFieldTypesEnum) ?? [])
    .filter(option => option.keyWord.trim() === '%1' || option.keyWord === 'COUNT()' ||
      /^(COUNT|COUNT_DISTINCT|SUM|AVG|MIN|MAX|FORMAT|CALENDAR_MONTH|CALENDAR_QUARTER|CALENDAR_YEAR|DAY_ONLY|FISCAL_MONTH|FISCAL_QUARTER|FISCAL_YEAR|HOUR_IN_DAY|WEEK_IN_YEAR)\(%1\)$/.test(option.keyWord));
  return {
    select,
    where: definition?.selectComponent ?? 'NOT_ALLOWED',
    order: definition?.selectComponent !== 'NOT_ALLOWED' && definition !== undefined,
  };
}
