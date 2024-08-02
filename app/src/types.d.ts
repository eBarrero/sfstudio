/* eslint-disable @typescript-eslint/no-explicit-any */

type SchemaName = string;
type SObjectApiName = string;
type FieldApiName = string;
type SObjectLocalId = number; // ID from Schema.sobject[ID]
type FieldLocalId = number;   // ID from Schema.sobject[x].fields[ID]

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
    fieldLocalId: FieldLocalId;   
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
    sObjectLocalId: SObjectLocalId;
    cascadeDelete: boolean;
    childSObject: string;
    deprecatedAndHidden: boolean;
    field: string;
    junctionIdListNames: string[];
    junctionReferenceTo: string[];
    relationshipName: string;
    restrictedDelete: boolean;
}

type SObject = {
    sObjectLocalId: SObjectLocalId;  
    childRelationships: ChildRelationships[] | null;
    fields: Fields[] | null;
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

type Schema = {
    name: string;
    sobjects: SObject[];
}

interface SObjectsFilter {
    searchText: string;
    queryable: boolean | null;
    custom: boolean | null;
}

// Adapaters


type FieldId = {
    orgSfName: string;
    sObjectIndex: number;
    fieldApiName: string;
    fieldIndex: number;
}    

type SObjectId = {
    orgSfName: string;
    sObjectIndex: number;
}

interface GetSObjectsIndex  {
    sObjectLocalId: number,
    name: string,
    label: string,
    keyPrefix: string
}

interface GetFieldsIndex {
    fieldLocalId: FieldLocalId, 
    name: SObjectApiName,
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
    sObjectLocalId: SObjectLocalId;
    childSObject: string,
    relationshipName: string,
    fieldNameAPI: string,
}


