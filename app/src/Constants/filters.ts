



// src/constants/filters.ts
interface ObjectFilterOptions  {
  name: keyof SObjectsFilter;
  description: string;
}

export const objectFilterOptions: ObjectFilterOptions[] = [
  { name: 'activateable', description: 'Activateable' },
  { name: 'createable', description: 'Createable' },
  { name: 'custom', description: 'Custom' },
  { name: 'customSetting', description: 'Custom Setting' },
  { name: 'deletable', description: 'Deletable' },
  { name: 'deprecatedAndHidden', description: 'Deprecated and Hidden' },
  { name: 'feedEnabled', description: 'Feed Enabled' },
  { name: 'hasSubtypes', description: 'Has Subtypes' },
  { name: 'isSubtype', description: 'Is Subtype' },
  { name: 'layoutable', description: 'Layoutable' },
  { name: 'mergeable', description: 'Mergeable' },
  { name: 'mruEnabled', description: 'MRU Enabled' },
  { name: 'queryable', description: 'Queryable' },
  { name: 'replicateable', description: 'Replicateable' },
  { name: 'retrieveable', description: 'Retrieveable' },
  { name: 'searchable', description: 'Searchable' },
  { name: 'triggerable', description: 'Triggerable' },
  { name: 'undeletable', description: 'Undeletable' },
  { name: 'updateable', description: 'Updateable' },
];

interface FieldFilterOptions {
  name: keyof FieldsFilter;
  description: string;
}

export const fieldFilterOptions: FieldFilterOptions[] = [
  { name: 'aggregatable', description: 'Aggregatable' },
  { name: 'custom', description: 'Custom' },
  { name: 'defaultedOnCreate', description: 'Defaulted on Create' },
  { name: 'dependentPicklist', description: 'Dependent Picklist' },
  { name: 'deprecatedAndHidden', description: 'Deprecated and Hidden' },
  { name: 'encrypted', description: 'Encrypted' },
  { name: 'externalId', description: 'External Id' },
  { name: 'filterable', description: 'Filterable' },
  { name: 'idLookup', description: 'Id Lookup' },
  { name: 'groupable', description: 'Groupable' },
  { name: 'nillable', description: 'Nillable' },
  { name: 'queryByDistance', description: 'Query by Distance' },
  { name: 'sortable', description: 'Sortable' },
  { name: 'unique', description: 'Unique' },
];


