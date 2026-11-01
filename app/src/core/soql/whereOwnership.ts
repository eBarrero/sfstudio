/** RELETED nodes are navigation only; ROOT and SUBQUERY own WHERE clauses. */
export function whereOwner(state: QueryState, startIndex: number): {
  ownerIndex: number; relationshipPath: string[];
} {
  const visited = new Set<number>();
  const relationshipPath: string[] = [];
  let ownerIndex: number | null = null;
  let index = startIndex;
  for (let depth = 0; depth <= state.queryElemnts.length; depth += 1) {
    if (!Number.isInteger(index) || index < 0 || index >= state.queryElemnts.length || visited.has(index))
      throw new Error('Invalid query tree.');
    visited.add(index);
    const element = state.queryElemnts[index];
    if (element.type === 'ROOT') {
      if (index !== 0 || element.parent !== -1) throw new Error('Invalid root query block.');
      return { ownerIndex: ownerIndex ?? index, relationshipPath };
    }
    if (element.type === 'SUBQUERY' && ownerIndex === null) ownerIndex = index;
    if (element.type === 'RELETED') {
      if (!element.relatedTo) throw new Error('Invalid parent relationship.');
      if (ownerIndex === null) relationshipPath.unshift(element.relatedTo);
    }
    if (!Number.isInteger(element.parent) || element.parent < 0 || element.parent >= index)
      throw new Error('Invalid query tree.');
    index = element.parent;
  }
  throw new Error('Invalid query tree.');
}

export function qualifiedFieldName(field: FieldId): string {
  return [...(field.relationshipPath ?? []), field.fieldApiName].join('.');
}
