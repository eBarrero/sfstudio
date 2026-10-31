import Proxy, { modelReader } from '../salesforceSchema/proxy';

/** Resolve transient local metadata indices from the saved API names. */
export async function restoreQuery(saved: QueryState, orgKey: string): Promise<QueryState> {
  const queryState = structuredClone(saved);
  if (!Array.isArray(queryState.queryElemnts) || !queryState.queryElemnts.length ||
      queryState.queryElemnts[0].type !== 'ROOT' ||
      queryState.indexCurrentElement < 0 || queryState.indexCurrentElement >= queryState.queryElemnts.length) {
    throw new Error('La consulta guardada no es válida.');
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

    element.sObjectId = { orgSfName: orgKey, sObjectApiName: objectName, sObjectLocalId: objectId };
    element.selectClause.fields.forEach(field => resolveField(field.fieldId));
    element.where?.forEach(condition => resolveField(condition.field));
    element.orderBy?.forEach(order => resolveField(order.field));
    if (element.type === 'ROOT' || element.type === 'SUBQUERY') {
      element.aggregatorQuery?.groupBy.forEach(resolveField);
      element.aggregatorQuery?.having.forEach(condition => resolveField(condition.field));
    }
  }
  return queryState;
}
