export function filterChildRelationships(
  relationships: GetChildRelationships[], searchText: string | null,
): GetChildRelationships[] {
  const terms = (searchText ?? '').trim().toUpperCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return relationships;
  return relationships.filter(relation => {
    const names = [relation.childSObject, relation.relationshipName].map(name => name.toUpperCase());
    return terms.every(term => names.some(name => name.includes(term)));
  });
}
