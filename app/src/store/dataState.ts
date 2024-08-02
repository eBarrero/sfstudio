import {create} from 'zustand';
import  Proxy  from '../services/salesforceSchema/proxy';


interface DataState {  
    action: string;                              // It indicates the action to be performed or it being performed
    sobjects: GetSObjectsIndex[];                // It contains the list of sObjects. Loaded from getSchema()
    sObjectFields: GetFieldsIndex[];              // It contains the list of fields of current sObject. Loaded from getFields() 
    childRelationships: GetChildRelationships[]; // It contains the list of child relationships of current sObject. Loaded from getChildRelationships() 
    sObjectsFilter: SObjectsFilter;                // It contains the filter to be applied to the sObjects

    //getSchema: (orgSfName: string, filterSObject?: SchemaFilter) => void;       // It retrieves the index of Salesforce objects based on the provided filter.
    loadSchema: (orgSfName: SchemaName) => void;       // It retrieves the index of Salesforce objects based on the provided filter.
    loadFields: (orgSfName: SchemaName,  sObjectIndex: SObjectLocalId) => void;              // It retrieves the fields of a Salesforce object based on the provided index. 
    loadChildRelationships: (orgSfName: SchemaName, objectIndex: SObjectLocalId) => void ;   // It retrieves the child relationships of a Salesforce object based on the provided index. 
}

const useDataState = create<DataState>((set, get) => {
    return  {
        action: 'GET_SCHEMA',
        sobjects:[],
        sObjectFields:[],
        childRelationships:[],
        sObjectsFilter: {searchText:'', custom:true,  queryable: true},

        loadSchema: (orgSfName: SchemaName) => {
            const f = get().sObjectsFilter;
            Proxy.getSObjectsAdapter(orgSfName, f).then((data) => {
                if (data!==null) set({sobjects: structuredClone(data)});
            });
        },
        loadFields: (orgSfName: SchemaName, sObjectIndex: SObjectLocalId) => {
            Proxy.getFields(orgSfName, sObjectIndex).then((data) => {
                if (data!==null) set({sObjectFields: structuredClone(data), childRelationships: Proxy.getChildRelationships(orgSfName, sObjectIndex) });
            });       
        },
        loadChildRelationships: (orgSfName: SchemaName, objectIndex: SObjectLocalId) => {
            const data = Proxy.getChildRelationships(orgSfName, objectIndex);
            if (data!==null) set({childRelationships: structuredClone(data)});            
        }
    }




});


export default useDataState;