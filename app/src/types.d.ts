/* eslint-disable @typescript-eslint/no-explicit-any */


type SalesforceFieldValues =
  | "id"
  | "datetime"
  | "date"
  | "reference"
;

type PicklistValue = {
    active: boolean;
    defaultValue: boolean;
    label: string;
    validFor: string | null;
    value: string;
  };


type Fields = {
    localId: number;
    aggregatable: boolean;
    autoNumber: boolean;
    byteLength: number;
    calculated: boolean;
    calculatedFormula: string | null;
    cascadeDelete: boolean;
    caseSensitive: boolean;
    compoundFieldName: string | null;
    controllerName: string | null;
    createable: boolean;
    custom: boolean;
    defaultValue: any;
    defaultValueFormula: string | null;
    defaultedOnCreate: boolean;
    dependentPicklist: boolean;
    deprecatedAndHidden: boolean;
    digits: number;
    displayLocationInDecimal: boolean;
    encrypted: boolean;
    externalId: boolean;
    extraTypeInfo: string | null;
    filterable: boolean;
    filteredLookupInfo: string | null;
    groupable: boolean;
    highScaleNumber: boolean;
    htmlFormatted: boolean;
    idLookup: boolean;
    inlineHelpText: string | null;
    label: string;
    length: number;
    mask: string | null;
    maskType: string | null;
    name: string;
    nameField: boolean;
    namePointing: boolean;
    nillable: boolean;
    permissionable: boolean;
    picklistValues: PicklistValue[] | [];
    polymorphicForeignKey: boolean;
    precision: number;
    queryByDistance: boolean;
    referenceTargetField: string | null;
    referenceTo: string[];
    relationshipName: string | null;
    relationshipOrder: string | null;
    restrictedDelete: boolean;
    restrictedPicklist: boolean;
    scale: number;
    searchPrefilterable: boolean;
    soapType: string;
    sortable: boolean;
    type: SalesforceFieldValues;
    unique: boolean;
    updateable: boolean;
    writeRequiresMasterRead: boolean;
  };
  
type ChildRelationships = {
    cascadeDelete: boolean
    childSObject: string
    deprecatedAndHidden: boolean
    field: string
    junctionIdListNames: string[]
    junctionReferenceTo: string[]
    relationshipName: string
    restrictedDelete: boolean
}


type SObject = {
    childRelationships: ChildRelationships[] | null;
    fields: Fields[] | null;
    localId: number;
    activateable: boolean;
    createable: boolean;
    custom: boolean;
    customSetting: boolean;
    deletable: boolean;
    deprecatedAndHidden: boolean;
    feedEnabled: boolean;
    hasSubtypes: boolean;
    isSubtype: boolean;
    keyPrefix: string | null;
    label: string;
    labelPlural: string;
    layoutable: boolean;
    mergeable: boolean;
    mruEnabled: boolean;
    name: string;
    queryable: boolean;
    replicateable: boolean;
    retrieveable: boolean;
    searchable: boolean;
    triggerable: boolean;
    undeletable: boolean;
    updateable: boolean;
}

type FilterSObject = {
    name: string;
    queryable: boolean;
    custom: boolean;
}


type Environment = {
    name: string;
    sobjects: SObject[];
}

interface GetSObjectsIndex  {
    index: number,
    name: string,
    label: string,
    keyPrefix: string
}

interface GetFieldsIndex {
    index: number,
    name: string,
    label: string,   
    type: SalesforceFieldValues,
    length: number,
    precision: number,
    scale: number,
    unique: boolean,
    custom: boolean,
    referenceTo: string,
}


interface GetChildRelationships {
    childSObject: string,
    relationshipName: string,
    field: string,
}

