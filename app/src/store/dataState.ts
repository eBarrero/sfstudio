import {create} from 'zustand';
import  Proxy  from '../services/salesforceSchema/proxy';
import { addCommand,deleteCommand,CONTEXT_LEVEL } from '../core/commandManager';
import { objectFilterOptions, fieldFilterOptions } from '../core/constants/filters';
import { SalesforceFieldTypes } from '../core/constants/fields';



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
        searchText: null,
        type:               null,
        aggregatable:       null,
        custom:             null,
        defaultedOnCreate:  null,
        dependentPicklist:  null,
        deprecatedAndHidden:null,
        encrypted:          null,
        externalId:         null,
        filterable:         null,
        idLookup:           null,
        groupable:          null,
        nillable:           null,
        queryByDistance:    null,
        sortable:           null,
        unique:             null,
    };
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
                if (data!==null) set({sobjects: structuredClone(data), dataLastErrorMessage: data.length>0?'':"CMD.NO_OBJECTS"});
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
                         
                         dataLastErrorMessage: '' 
                    });
                } else {
                    console.log('CMD.Object_not_found', sObjectIndex);
                    set({dataLastErrorMessage: `CMD.Object_not_found|${sObjectIndex}`});
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
                    set({sObjectFields:  structuredClone(data), dataLastErrorMessage: ''});
                    callBack(id);
                    get().createLookuoCommands(data);
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
        setFieldFilterType: (orgSfName: SchemaName,  sObjectIndex: SObjectLocalId, searchType: SalesforceFieldTypes) => {
            console.log('setFieldFilterType', searchType);
            const filter = get().fieldsFilter;
            filter.type = searchType;
            set({fieldsFilter: filter});
            get().loadFields(orgSfName, sObjectIndex);
        },            
        setFieldFilter: (orgSfName: SchemaName,  sObjectIndex: SObjectLocalId, attrib: string, value: boolean|null) => {  
            console.log('setFieldFilter', attrib, value);
            set({fieldsFilter: {...get().fieldsFilter, [attrib] :value    }} );
            get().loadFields(orgSfName, sObjectIndex);
        },
        loadFieldsFromLookup: (field: GetFieldsIndex) => {
            console.log('loadFieldsFromLookup');
            const {orgSfName, referenceToLocalId} = field;
            Proxy.getFieldsAdapter(orgSfName, referenceToLocalId![0], null).then((data) => {
                if (data!==null) { 
                    set({sObjectFields:  structuredClone(data), fieldsFilter: fieldFilterInit(), dataLastErrorMessage: ''});
                    get().createLookuoCommands(data);
                }
            });       
        },
        loadFieldsFromChild: (child: GetChildRelationships) => {
            console.log('loadFieldsFromChild');
            const {orgSfName, sObjectLocalId} = child;
            set({fieldsFilter: fieldFilterInit()});
            get().loadFields(orgSfName, sObjectLocalId);
        },
        loadChildRelationships: (orgSfName: SchemaName, objectIndex: SObjectLocalId) => {
            console.log('loadChildRelationships', orgSfName, objectIndex);
            const data = Proxy.getChildRelationships(orgSfName, objectIndex);
            if (data!==null) {
                get().createChildRelationshipsCommands(data);
                set({childRelationships: structuredClone(data)});            
            }
        },

        initializeData: () => {
            // Create the commands for the object filter
            for (const key of objectFilterOptions) {
                const cmdText = '.'+key.name;
                addCommand({command: cmdText, description: 'sObject.filter.' + key.name, context:CONTEXT_LEVEL.ORG, 
                        action: (actionParams: AcctionParams) => {
                            const {model,  application} = actionParams;
                            get().setObjectFilter(model.state.orgSfName, key.name,  extractValue(application.currentCommand));
                        }
                });
            }
            // Create the commands for the field filter
            for (const key of fieldFilterOptions) {
                const cmdText = '.'+key.name;
                addCommand({command: cmdText, description: 'field.filter.' + key.name, context:CONTEXT_LEVEL.OBJECT, 
                    action: (actionParams: AcctionParams) => {
                        const {model,  application} = actionParams;
                        get().setFieldFilter(model.state.orgSfName, model.state.sObjectLocalId , key.name,  extractValue(application.currentCommand));
                    }
                });
            }
            // Create the commands for the field filter (field types)
            for (const key of Object.values(SalesforceFieldTypes)) {
                const cmdText = '.type.'+key;
                addCommand({command: cmdText, description: 'field.filter.type.' + key, context:CONTEXT_LEVEL.OBJECT, 
                    action: (actionParams: AcctionParams) => {
                        const {model} = actionParams;
                    get().setFieldFilterType(model.state.orgSfName, model.state.sObjectLocalId,  key);
                    }
                });
            }
        },
        createFieldsCommands: (data: GetFieldsIndex[]): void => {
            deleteCommand('._');
            for (const field of data) {
                const cmdText = '._'+field.fieldApiName;
                addCommand({command: cmdText, description: 'field.config', context:CONTEXT_LEVEL.OBJECT, 
                    action: (actionParams: AcctionParams) => {
                        const {model, view} = actionParams;
                        model.setField(field);
                        view.pushDialog('DataTime');
                    }
                });
            }
        },
        createLookuoCommands: (data: GetFieldsIndex[]): void => {
            deleteCommand('.lookup');
            for (const field of data) {
                const cmdText = '.lookup_'+field.fieldApiName;
                if (field.type!==SalesforceFieldTypes.Reference) continue;
                addCommand({command: cmdText, description: 'field.go.lookup', context:CONTEXT_LEVEL.OBJECT, 
                    action: (actionParams: AcctionParams) => {
                        const {model} = actionParams;
                        get().loadFieldsFromLookup(field);
                        model.gotoLookup(field);
                    }
                });
            }
        },
        createChildRelationshipsCommands: (childs: GetChildRelationships[]): void => {
            deleteCommand('.child_');
            for (const child of childs) {
                const cmdText = '.child_'+ child.childSObject;
                addCommand({command: cmdText, description: 'field.go.child', context:CONTEXT_LEVEL.OBJECT, 
                    action: (actionParams: AcctionParams ) => {
                        const {model} = actionParams;
                        get().loadFieldsFromChild(child);
                        model.gotoChild(child);
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



