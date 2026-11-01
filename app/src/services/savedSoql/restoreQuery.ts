import Proxy, { modelReader } from '../salesforceSchema/proxy';
import { whereOwner } from '../../core/soql/whereOwnership';

/** Resolve transient local metadata indices from the saved API names. */
export async function restoreQuery(saved: QueryState, orgKey: string): Promise<QueryState> {
  const queryState = structuredClone(saved);
  if (!Array.isArray(queryState.queryElemnts) || !queryState.queryElemnts.length ||
      queryState.queryElemnts[0].type !== 'ROOT' ||
      queryState.indexCurrentElement < 0 || queryState.indexCurrentElement >= queryState.queryElemnts.length) {
    throw new Error('La consulta guardada no es válida.');
  }
  queryState.queryElemnts.forEach((_, index) => whereOwner(queryState, index));

  async function relationshipTarget(objectId: number, name: string): Promise<string> {
    const fields = await Proxy.getFieldsAdapter(orgKey, objectId, null);
    const matches = fields.filter(field => field.relationshipName === name && field.type === 'reference');
    if (matches.length !== 1) throw new Error(`La relación ${name} no existe o es ambigua en esta organización.`);
    const raw = modelReader.getField(orgKey, objectId, matches[0].fieldLocalId);
    if (!Array.isArray(raw.referenceTo) || raw.referenceTo.length !== 1)
      throw new Error(`La relación ${name} no existe o es ambigua en esta organización.`);
    return raw.referenceTo[0];
  }

  async function resolveConditionField(ownerObjectId: number, field: FieldId): Promise<void> {
    let objectId = ownerObjectId;
    for (const relation of field.relationshipPath ?? []) {
      const targetName = await relationshipTarget(objectId, relation);
      const targetId = modelReader.getSObjectLocalIdbyName(orgKey, targetName);
      if (targetId === null) throw new Error(`El objeto ${targetName} no existe en esta organización.`);
      objectId = targetId;
    }
    const fields = await Proxy.getFieldsAdapter(orgKey, objectId, null);
    const target = fields.find(item => item.fieldApiName === field.fieldApiName);
    if (!target) throw new Error(`El campo ${field.fieldApiName} no existe en esta organización.`);
    field.fieldIndex = target.fieldLocalId;
  }

  for (const element of queryState.queryElemnts) {
    const objectName = element.sObjectId.sObjectApiName;
    const objectId = modelReader.getSObjectLocalIdbyName(orgKey, objectName);
    if (objectId === null) throw new Error(`El objeto ${objectName} no existe en esta organización.`);
    const fields = await Proxy.getFieldsAdapter(orgKey, objectId, null);
    const indexes = new Map(fields.map(field => [field.fieldApiName, field.fieldLocalId]));
    const resolveField = (field: FieldId) => {
      const index = indexes.get(field.fieldApiName);
      if (index === undefined) throw new Error(`El campo ${objectName}.${field.fieldApiName} no existe en esta organización.`);
      field.fieldIndex = index;
    };

    if (element.type === 'RELETED') {
      const parent = queryState.queryElemnts[element.parent];
      const parentId = modelReader.getSObjectLocalIdbyName(orgKey, parent.sObjectId.sObjectApiName);
      if (parentId === null || await relationshipTarget(parentId, element.relatedTo) !== objectName)
        throw new Error(`La relación ${element.relatedTo} no apunta a ${objectName} en esta organización.`);
    }

    element.sObjectId = { orgSfName: orgKey, sObjectApiName: objectName, sObjectLocalId: objectId };
    element.selectClause.fields.forEach(field => resolveField(field.fieldId));
    if (element.type !== 'RELETED') {
      for (const condition of element.where ?? []) await resolveConditionField(objectId, condition.field);
    }
    element.orderBy?.forEach(order => resolveField(order.field));
    if (element.type === 'ROOT' || element.type === 'SUBQUERY') {
      element.aggregatorQuery?.groupBy.forEach(resolveField);
      element.aggregatorQuery?.having.forEach(condition => resolveField(condition.field));
    }
  }
  return queryState;
}
