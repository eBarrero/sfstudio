


type SFFieldTypesEnum  = 
    id       | address  | autoNumber     | rollUpSummary  | summary        | masterDetail  | boolean   | currency  | 
    date     | datetime | double         | email          | Geolocation    | percent       | phone     | 
    picklist | multiselectPicklist       | string         | textArea       | longTextArea  | reference | richTextArea  | 
    url      | time     | encryptedText  | externalLookup | indirectLookup | metadataRelationship;







type SchemaName = string;       // Salesforce Org Name
type SObjectApiName = string;   // Salesforce Object API Name
type RelationshipName = string; // Salesforce Relationship Name
type SObjectReferenceId = string;
type FieldApiName = string;
type SObjectLocalId = number; // ID from Schema.sobject[ID]
type FieldLocalId = number;   // ID from Schema.sobject[x].fields[ID]

type FilterValue = boolean | null;




type SalesforceFieldTypes = SFFieldTypesEnum


interface PicklistValue  {
    active: boolean;
    defaultValue: boolean;
    label: string;
    validFor: string | null;
    value: string;
  }

interface Salesforce_Fields  {
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
    defaultValue: string | null;
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
    type: SalesforceFieldTypes;
    unique: boolean;
    updateable: boolean;
    writeRequiresMasterRead: boolean;
    // Metadata
    description: string | null;
}

interface Fields extends Salesforce_Fields { 
    fieldLocalId: FieldLocalId
    sobObjectLocalId: SObjectLocalId;
    orgSfName: SchemaName;
    referenceToLocalId: SObjectLocalId[] | null;
}

  
interface ChildRelationships  {
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

interface Salesforce_SObject  {
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


type MetadataFieldDownloaded = 'DOWNLOADING' | 'DOWNLOADED' | 'ERROR';

interface SObject extends Salesforce_SObject  {
    orgSfName: SchemaName;
    sObjectLocalId: SObjectLocalId;  
    mapFields: Map<FieldApiName, FieldLocalId>; // This a index of fields by name
    metadataFieldDownloaded: MetadataFieldDownloaded | null;
}

interface Schema  {
    name: SchemaName;
    sobjects: SObject[];
    indexMap: Map<SObjectApiName, SObjectLocalId>;
}

interface SObjectsFilter  {
    searchText: string;
    activateable:       FilterValue;
    createable:         FilterValue;
    custom:             FilterValue;
    customSetting:      FilterValue;
    deletable:          FilterValue;
    deprecatedAndHidden:FilterValue;
    feedEnabled:        FilterValue;
    hasSubtypes:        FilterValue;
    isSubtype:          FilterValue;
    layoutable:         FilterValue;
    mergeable:          FilterValue;
    mruEnabled:         FilterValue;
    queryable:          FilterValue;
    replicateable:      FilterValue;
    retrieveable:       FilterValue;
    searchable:         FilterValue;
    triggerable:        FilterValue;
    undeletable:        FilterValue;
    updateable:         FilterValue;    
}

interface FieldsFilter {
    searchText:             string | null;
    type:                   SalesforceFieldTypes | null;
    aggregatable:           FilterValue;
    custom:                 FilterValue;
    defaultedOnCreate:      FilterValue;
    dependentPicklist:      FilterValue;
    deprecatedAndHidden:    FilterValue;
    encrypted:              FilterValue;
    externalId:             FilterValue;
    filterable:             FilterValue;
    idLookup:               FilterValue;
    groupable:              FilterValue;
    nillable:               FilterValue;
    queryByDistance:        FilterValue;
    sortable:               FilterValue;
    unique:                 FilterValue;
}  

// Adapaters


interface FieldId  {
    fieldApiName: FieldApiName;
    fieldIndex: FieldLocalId;
}    

interface SObjectId {
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
    orgSfName: SchemaName,
    sObjectLocalId: SObjectLocalId,
    fieldLocalId: FieldLocalId, 
    isTechnicalField: boolean, 
    fieldApiName: FieldApiName,
    label: string,   
    type: SalesforceFieldTypes,
    length: number,
    precision: number,
    scale: number,
    unique: boolean,
    custom: boolean,
    referenceTo: SObjectApiName,
    relationshipName: RelationshipName | null
    referenceToLocalId: SObjectLocalId[] | null;
    description: string | null;
    picklistValues: PicklistValue[] | [];
}

interface GetChildRelationships {
    orgSfName: SchemaName,
    sObjectLocalId: SObjectLocalId,
    childSObject: SObjectApiName,
    relationshipName: RelationshipName,
    fieldNameAPI: FieldApiName,
}


type typeInputDates = 'date' | 'time' | 'datetime-local' | 'month' | 'week' | 'year';



interface Rows {
    col: string[];
}

interface Captions{
    objectName?: string;
    fieldName: string;
    quantity: number;
}

interface InlineJsonArray {
    captions: Captions[];
    rows: Rows[];
}



interface DataState {  
    action: string;                                // It indicates the action to be performed or it being performed
    sobjects: GetSObjectsIndex[];                  // It contains the list of sObjects. Loaded from getSchema()
    sObjectFields: GetFieldsIndex[];               // It contains the list of fields of current sObject. Loaded from getFields() 
    childRelationships: GetChildRelationships[];   // It contains the list of child relationships of current sObject. Loaded from getChildRelationships() 
    sObjectsFilter: SObjectsFilter;                // It contains the filter to be applied to the sObjects
    fieldsFilter: FieldsFilter;                    // It contains the filter to be applied to the fields
    dataLastErrorMessage: string;                  // It contains the last error message
    

    //getSchema: (orgSfName: string, filterSObject?: SchemaFilter) => void;       // It retrieves the index of Salesforce objects based on the provided filter.
    loadSchema: (orgSfName: SchemaName) => void;       // It retrieves the index of Salesforce objects based on the provided filter.
    setObjectFilterText: (orgSfName: SchemaName, searchText: string) => void;       // It retrieves the index of Salesforce objects based on the provided filter.
    setObjectFilter:  (orgSfName: SchemaName, attrib: string, value: boolean|null) => void;  // set the filter value    
   
    loadFields: (orgSfName: SchemaName,  sObjectIndex: SObjectLocalId) => void;              // It retrieves the fields of a Salesforce object based on the provided index. 
    loadFieldsByName: (orgSfName: SchemaName, sObjectName: string, callBack: (sObjectLocalId: SObjectLocalId) => void) => void; // It retrieves the fields of a Salesforce object based on the provided name.
    loadMetadataFields: (orgSfName: SchemaName,  sObjectIndex: SObjectLocalId) => void;      // update the metadata of the fields of a Salesforce object based on the provided index.
    setFieldFilterText: (orgSfName: SchemaName,  sObjectIndex: SObjectLocalId, searchText: string) => void; // set the filter value
    setFieldFilterType: (orgSfName: SchemaName,  sObjectIndex: SObjectLocalId, searchType: SalesforceFieldTypes) => void; // set the filter value
    setFieldFilter: (orgSfName: SchemaName,  sObjectIndex: SObjectLocalId, attrib: string, value: boolean|null) => void; // set the filter value
    loadFieldsFromLookup: (filed: GetFieldsIndex) => void; // call loadFields from a lookup field
    loadFieldsFromChild: (child: GetChildRelationships) => void; // call loadFields from a child relationship
    loadChildRelationships: (orgSfName: SchemaName, objectIndex: SObjectLocalId) => void ;   // It retrieves the child relationships of a Salesforce object based on the provided index. 
    initializeData: () => void; // It initializes the dataState
    createLookuoCommands: (data: GetFieldsIndex[]) => void; // It creates the lookup commands for the lookup's fields
    createChildRelationshipsCommands: (childs: GetChildRelationships[]) => void 
    createFieldsCommands: (data: GetFieldsIndex[]) => void; // It creates the fields commands for the fields
}