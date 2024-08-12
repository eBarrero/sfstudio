import {create} from 'zustand';
import  Proxy  from '../services/salesforceSchema/proxy';



function objectsFilterInit(): SObjectsFilter {
    return {
        searchText:'',
        activateable:       null,
        createable:         null,
        custom:             null,
        customSetting:      null,
        deletable:          null,
        deprecatedAndHidden:null,
        feedEnabled:        null,
        hasSubtypes:        null,
        isSubtype:          null,
        layoutable:         null,
        mergeable:          null,
        mruEnabled:         null,
        queryable:          true,
        replicateable:      null,
        retrieveable:       null,
        searchable:         null,
        triggerable:        null,
        undeletable:        null,
        updateable:         null            
     };
}


function fieldFilterInit(): FieldsFilter {
    return {
        searchText:'',
        type:               '',
        aggregatable:       null,
        custom:             null,
        defaultedOnCreate:  null,
        dependentPicklist:  null,
        deprecatedAndHidden:null,
        encrypted:          null,
        externalId:         null,
        filterable:         null,
        groupable:          null,
        nillable:           null,
        queryByDistance:    null,
        sortable:           null,
        unique:             null,
    };
}


interface DataState {  
    action: string;                                // It indicates the action to be performed or it being performed
    sobjects: GetSObjectsIndex[];                  // It contains the list of sObjects. Loaded from getSchema()
    sObjectFields: GetFieldsIndex[];               // It contains the list of fields of current sObject. Loaded from getFields() 
    childRelationships: GetChildRelationships[];   // It contains the list of child relationships of current sObject. Loaded from getChildRelationships() 
    sObjectsFilter: SObjectsFilter;                // It contains the filter to be applied to the sObjects
    fieldsFilter: FieldsFilter;                   // It contains the filter to be applied to the fields

    //getSchema: (orgSfName: string, filterSObject?: SchemaFilter) => void;       // It retrieves the index of Salesforce objects based on the provided filter.
    loadSchema: (orgSfName: SchemaName) => void;       // It retrieves the index of Salesforce objects based on the provided filter.
    setObjectFilterText: (orgSfName: SchemaName, searchText: string) => void;       // It retrieves the index of Salesforce objects based on the provided filter.
    setObjectFilter:  (orgSfName: SchemaName, attrib: string, value: boolean|null) => void;  // set the filter value    
   
    loadFields: (orgSfName: SchemaName,  sObjectIndex: SObjectLocalId) => void;              // It retrieves the fields of a Salesforce object based on the provided index. 
    setFieldFilterText: (orgSfName: SchemaName,  sObjectIndex: SObjectLocalId, searchText: string) => void; // set the filter value
    loadFieldsFromReference: (orgSfName: SchemaName,  sObjectIndex: SObjectLocalId) => void; // same as loadFields but without child relationships after Reference has been selected
    loadChildRelationships: (orgSfName: SchemaName, objectIndex: SObjectLocalId) => void ;   // It retrieves the child relationships of a Salesforce object based on the provided index. 
}

const dataState = create<DataState>((set, get) => {
    return  {
        action: 'GET_SCHEMA',
        sobjects:[],
        sObjectFields:[],
        childRelationships:[],
        sObjectsFilter: objectsFilterInit(),
        fieldsFilter: fieldFilterInit(),
        loadSchema: (orgSfName: SchemaName) => {
            const f = get().sObjectsFilter;
            Proxy.getSObjectsAdapter(orgSfName, f).then((data) => {
                if (data!==null) set({sobjects: structuredClone(data)});
            });
        },
        setObjectFilterText: (orgSfName: SchemaName, searchText: string) => {
            const filter = get().sObjectsFilter;
            filter.searchText = searchText;
            set({sObjectsFilter: filter});
            get().loadSchema(orgSfName);
        },
        setObjectFilter: (orgSfName: SchemaName, attrib: string, value: boolean|null) => {
            set({sObjectsFilter: {...get().sObjectsFilter, [attrib] :value    }} );
            get().loadSchema(orgSfName);
        },
        loadFields: (orgSfName: SchemaName, sObjectIndex: SObjectLocalId) => {
            console.log('loadFields', orgSfName, sObjectIndex);
            if (sObjectIndex===undefined || sObjectIndex===null) throw new Error('sObjectIndex is undefined or null');
            const filter = get().fieldsFilter;
            Proxy.getFieldsAdapter(orgSfName, sObjectIndex, filter).then((data) => {
                if (data!==null) {
                    set({
                         sObjectFields:  getTechnicalFealds().concat(structuredClone(data)), 
                         childRelationships: Proxy.getChildRelationships(orgSfName, sObjectIndex) 
                    });
                }
            });       
        },
        setFieldFilterText: (orgSfName: SchemaName,  sObjectIndex: SObjectLocalId, searchText: string) => {
            const filter = get().fieldsFilter;
            filter.searchText = searchText;
            set({fieldsFilter: filter});
            get().loadFields(orgSfName, sObjectIndex);
        },        
        loadFieldsFromReference: (orgSfName: SchemaName, sObjectIndex: SObjectLocalId) => {
            console.log('loadFieldsFromReference', orgSfName, sObjectIndex);
            const filter = get().fieldsFilter;
            Proxy.getFieldsAdapter(orgSfName, sObjectIndex, filter).then((data) => {
                if (data!==null) set({sObjectFields:  structuredClone(data)});
            });       
        },

        loadChildRelationships: (orgSfName: SchemaName, objectIndex: SObjectLocalId) => {
            const data = Proxy.getChildRelationships(orgSfName, objectIndex);
            if (data!==null) set({childRelationships: structuredClone(data)});            
        }
    }
});


function getTechnicalFealds(): GetFieldsIndex[] {
    return [
        {fieldLocalId: 1001, isTechnicalField: true, sObjectApiName: 'FIELDS(ALL)',      label: '', type: 'TECHNICAL_FIELD', length: 0, precision: 0, scale: 0, unique: false, custom: false, referenceTo: '', relationshipName:null},
        {fieldLocalId: 1002, isTechnicalField: true, sObjectApiName: 'FIELDS(STANDARD)', label: '', type: 'TECHNICAL_FIELD', length: 0, precision: 0, scale: 0, unique: false, custom: false, referenceTo: '', relationshipName:null},
        {fieldLocalId: 1003, isTechnicalField: true, sObjectApiName: 'FIELDS(CUSTOM)',   label: '', type: 'TECHNICAL_FIELD', length: 0, precision: 0, scale: 0, unique: false, custom: false, referenceTo: '', relationshipName:null},
    ];
}   

export default dataState;