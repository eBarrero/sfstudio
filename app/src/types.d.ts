/* eslint-disable @typescript-eslint/no-explicit-any */

type SchemaName = string;
type SObjectApiName = string;
type RelationshipName = string;
type FieldApiName = string;
type SObjectLocalId = number; // ID from Schema.sobject[ID]
type FieldLocalId = number;   // ID from Schema.sobject[x].fields[ID]

type SalesforceFieldValues =
  | "TECHNICAL_FIELD" 
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

type Salesforce_Fields = {
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
    referenceTo: SObjectApiName[];
    relationshipName: RelationshipName | null;
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

type Fields = Salesforce_Fields & { 
    fieldLocalId: FieldLocalId
};

  
type ChildRelationships = {
    sObjectLocalId: SObjectLocalId;
    cascadeDelete: boolean;
    childSObject: SObjectApiName;
    deprecatedAndHidden: boolean;
    field: string;
    junctionIdListNames: string[];
    junctionReferenceTo: string[];
    relationshipName: string;
    restrictedDelete: boolean;
}

type Salesforce_SObject = {
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

type SObject = Salesforce_SObject & {
    sObjectLocalId: SObjectLocalId;  
    mapFields: Map<FieldApiName, FieldLocalId>;
}

type Schema = {
    name: string;
    sobjects: SObject[];
    indexMap: Map<SObjectApiName, SObjectLocalId>;
}

interface SObjectsFilter {
    searchText: string;
    queryable: boolean | null;
    custom: boolean | null;
}

// Adapaters


type FieldId = {
    fieldApiName: string;
    fieldIndex: number;
}    

type SObjectId = {
    orgSfName: string;
    sObjectApiName: SObjectApiName;    
    sObjectLocalId: SObjectLocalId;
}

interface GetSObjectsIndex  {
    sObjectLocalId: number,
    name: string,
    label: string,
    keyPrefix: string
}

interface GetFieldsIndex {
    fieldLocalId: FieldLocalId, 
    isTechnicalField: boolean, 
    sObjectApiName: SObjectApiName,
    label: string,   
    type: SalesforceFieldValues,
    length: number,
    precision: number,
    scale: number,
    unique: boolean,
    custom: boolean,
    referenceTo: SObjectApiName,
    relationshipName: RelationshipName | null
}

interface GetChildRelationships {
    sObjectLocalId: SObjectLocalId;
    childSObject: string,
    relationshipName: string,
    fieldNameAPI: string,
}


