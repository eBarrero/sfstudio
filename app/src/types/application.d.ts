

interface ModelState {
    state: {
        action: string;
        orgSfName: SchemaName;
        sObjectApiName: SObjectApiName;
        sObjectLocalId: SObjectLocalId;
    };
    filerSObject?: SObjectsFilter
    queryState: QueryState; // It contains the query elements: main quiery, subqueries and releted objects
    currentSOQLFieldSelection: Map<FieldLocalId, SOQLFieldSelectionState>;  // It contains the fields selected in the current query. filled by createSOQLFieldSelection() fucntion
    sqlState: SQLState;    // It contains the SQL statement to be executed
    setOrg: (orgSfName: SchemaName) => void; 
    setSObject: (sObjectLocalId:SObjectLocalId) => void;
    gotoLookup: (field: GetFieldsIndex) => void; 
    gotoChild: (child: GetChildRelationships) => void;
    showByqueryElemntsIndex: (index: number) => void;
    doFieldAction: (fieldIndex: number, action: string) => void;
    setSelectAllFields: (value: SelectAllFields) => void;
    addWhere: (SimpleCondition: SimpleCondition) => void;
    initializeModel: () => void;
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
    setFieldFilterText: (orgSfName: SchemaName,  sObjectIndex: SObjectLocalId, searchText: string) => void; // set the filter value
    setFieldFilterType: (orgSfName: SchemaName,  sObjectIndex: SObjectLocalId, searchType: SalesforceFieldTypes) => void; // set the filter value
    setFieldFilter: (orgSfName: SchemaName,  sObjectIndex: SObjectLocalId, attrib: string, value: boolean|null) => void; // set the filter value
    loadFieldsFromLookup: (filed: GetFieldsIndex) => void; // call loadFields from a lookup field
    loadFieldsFromChild: (child: GetChildRelationships) => void; // call loadFields from a child relationship
    loadChildRelationships: (orgSfName: SchemaName, objectIndex: SObjectLocalId) => void ;   // It retrieves the child relationships of a Salesforce object based on the provided index. 
    initializeData: () => void; // It initializes the dataState
    createLookuoCommands: (data: GetFieldsIndex[]) => void; // It creates the lookup commands for the lookup's fields
    createChildRelationshipsCommands: (childs: GetChildRelationships[]) => void 
}

interface AcctionParams {
    data: DataState;
    model: ModelState;
    view: ViewState;
    application: ApplicationState;
}

interface CommandDefinition  {
    command: string;
    description: string;
    examples?: string[];
    context: string | null;
}

interface CommandImplementation extends CommandDefinition {
    action: (acctionParams: AcctionParams) => void;
}









