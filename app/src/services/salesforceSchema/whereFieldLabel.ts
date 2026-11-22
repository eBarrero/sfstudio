import { modelReader } from './proxy';

/** Resolve presentation text from the current org's metadata, never from a saved query. */
export function whereFieldLabel(state: QueryState, ownerIndex: number, field: FieldId): string | null {
  let elementIndex = ownerIndex;
  for (const relation of field.relationshipPath ?? []) {
    const next = state.queryElemnts.findIndex(element => element.type === 'RELETED' &&
      element.parent === elementIndex && element.relatedTo === relation);
    if (next < 0) return null;
    elementIndex = next;
  }
  const object = state.queryElemnts[elementIndex]?.sObjectId;
  if (!object) return null;
  try {
    return modelReader.getSObject(object.orgSfName, object.sObjectLocalId).fields
      ?.find(item => item.name === field.fieldApiName)?.label ?? null;
  } catch {
    return null;
  }
}
