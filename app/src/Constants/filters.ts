



// src/constants/filters.ts

export type FilterOption = {
  name: keyof Salesforce_SObject;
  description: string;
};

export const objectFilterOptions: FilterOption[] = [
  { name: 'activateable', description: 'Activatable' },
  { name: 'createable', description: 'Creatable' },
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
