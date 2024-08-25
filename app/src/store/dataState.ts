import {create} from 'zustand';
import  Proxy  from '../services/salesforceSchema/proxy';
import { allCommandsList, CONTEXT_LEVEL } from '../constants/application';
import { objectFilterOptions } from '../constants/filters';
import i18next from 'i18next';


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
    dataLastErrorMessage: string;                  // It contains the last error message

    //getSchema: (orgSfName: string, filterSObject?: SchemaFilter) => void;       // It retrieves the index of Salesforce objects based on the provided filter.
    loadSchema: (orgSfName: SchemaName) => void;       // It retrieves the index of Salesforce objects based on the provided filter.
    setObjectFilterText: (orgSfName: SchemaName, searchText: string) => void;       // It retrieves the index of Salesforce objects based on the provided filter.
    setObjectFilter:  (orgSfName: SchemaName, attrib: string, value: boolean|null) => void;  // set the filter value    
   
    loadFields: (orgSfName: SchemaName,  sObjectIndex: SObjectLocalId) => void;              // It retrieves the fields of a Salesforce object based on the provided index. 
    loadFieldsByName: (orgSfName: SchemaName, sObjectName: string, callBack: (sObjectLocalId: SObjectLocalId) => void) => void; // It retrieves the fields of a Salesforce object based on the provided name.
    setFieldFilterText: (orgSfName: SchemaName,  sObjectIndex: SObjectLocalId, searchText: string) => void; // set the filter value
    loadFieldsFromReference: (orgSfName: SchemaName,  sObjectIndex: SObjectLocalId) => void; // same as loadFields but without child relationships after Reference has been selected
    loadChildRelationships: (orgSfName: SchemaName, objectIndex: SObjectLocalId) => void ;   // It retrieves the child relationships of a Salesforce object based on the provided index. 
    initializeData: () => void; // It initializes the dataState
}

const dataState = create<DataState>((set, get) => {
    return  {
        action: 'GET_SCHEMA',
        sobjects:[],
        sObjectFields:[],
        childRelationships:[],
        sObjectsFilter: objectsFilterInit(),
        fieldsFilter: fieldFilterInit(),
        dataLastErrorMessage: '',
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
            console.log('setObjectFilter', attrib, value);
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
                         sObjectFields:  structuredClone(data), 
                         childRelationships: Proxy.getChildRelationships(orgSfName, sObjectIndex) 
                    });
                }
            });       
        },
        loadFieldsByName: (orgSfName: SchemaName, sObjectName: string, callBack: (sObjectLocalId: SObjectLocalId) => void)  => {
            const id = Proxy.getSobjectIdByName(orgSfName, sObjectName);
            if (id===null) { 
                set({dataLastErrorMessage: `CMD.Object_not_found|${sObjectName}`});
                return;
            }

            Proxy.getFieldsAdapter(orgSfName,  id, null).then((data) => {
                if (data!==null) { 
                    set({sObjectFields:  structuredClone(data)});
                    callBack(id);
                } else {
                    console.log('CMD.Object_not_found', sObjectName);
                    set({dataLastErrorMessage: `CMD.Object_not_found|${sObjectName}`}); 
                }
            }).catch((e) => { set({dataLastErrorMessage: `CMD.generalError|${(e as Error).message}`}) }); 
        },
        setFieldFilterText: (orgSfName: SchemaName,  sObjectIndex: SObjectLocalId, searchText: string) => {
            console.log('setFieldFilterText', searchText);
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
            console.log('loadChildRelationships', orgSfName, objectIndex);
            const data = Proxy.getChildRelationships(orgSfName, objectIndex);
            if (data!==null) set({childRelationships: structuredClone(data)});            
        },
        initializeData: () => {
            // Create the commands for the object filter
            for (const key of objectFilterOptions) {
                const cmdText = '.'+key.name;
                allCommandsList.set(cmdText, {command: cmdText, description: 'sObject.filter.' + key.name, context:CONTEXT_LEVEL.ORG, 
                    action: (orgSfName:string, commandText: string) => {
                    get().setObjectFilter(orgSfName, key.name,  extractValue(commandText));
                    }
                });
            }
        }
    }
});

function extractValue(commandText: string): boolean|null {
    console.log('extractValue', commandText);
    if (commandText===null) throw Error("Error.Command_is_null");
    const [, valueString] = commandText.split(' ');
    if (valueString===undefined || valueString==='on') return true; 
    if (valueString==='off')  return false;
    if (valueString==='rm')   return null;
    throw Error(`Error.WrongParam|${valueString}`);
    }

export default dataState;



