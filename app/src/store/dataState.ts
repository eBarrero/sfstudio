import {create} from 'zustand';
import  Proxy  from '../services/salesforceSchema/proxy';
import { addCommand,removeCommand,CONTEXT_LEVEL } from '../core/commandManager';
import { objectFilterOptions, fieldFilterOptions } from '../core/constants/filters';
import { Dialog } from '../components/constants'
import { SFFieldTypesEnum } from '../core/constants/fields';

let schemaRequestVersion = 0;
let fieldRequestVersion = 0;
const filtersByOrg = new Map<string, { objects: SObjectsFilter; fields: FieldsFilter }>();
const fieldCommands = new Set<string>();
const lookupCommands = new Set<string>();
const childCommands = new Set<string>();
function clearDynamicCommands(): void {
    for (const command of [...fieldCommands, ...lookupCommands, ...childCommands])
        removeCommand(command, CONTEXT_LEVEL.OBJECT);
    fieldCommands.clear(); lookupCommands.clear(); childCommands.clear();
}


function objectsFilterInit(): SObjectsFilter {
    return {
        searchText:'',
        activateable:       null,
        createable:         null,
        custom:             true,
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
        activeOrgKey: null,
        sobjects:[],
        sObjectFields:[],
        childRelationships:[],
        sObjectsFilter: objectsFilterInit(),
        fieldsFilter: fieldFilterInit(),
        dataLastErrorMessage: '',
        clearSchema: () => {
            clearDynamicCommands();
            const previous = get().activeOrgKey;
            if (previous) filtersByOrg.set(previous, {
                objects: { ...get().sObjectsFilter }, fields: { ...get().fieldsFilter },
            });
            schemaRequestVersion += 1;
            fieldRequestVersion += 1;
            set({ activeOrgKey: null, sobjects: [], sObjectFields: [], childRelationships: [], dataLastErrorMessage: '' });
        },
        activateOrg: (orgKey: string) => {
            const previous = get().activeOrgKey;
            if (previous === orgKey) return;
            clearDynamicCommands();
            if (previous) filtersByOrg.set(previous, {
                objects: { ...get().sObjectsFilter }, fields: { ...get().fieldsFilter },
            });
            const stored = filtersByOrg.get(orgKey);
            schemaRequestVersion += 1;
            fieldRequestVersion += 1;
            set({ activeOrgKey: orgKey,
                sObjectsFilter: stored ? { ...stored.objects } : objectsFilterInit(),
                fieldsFilter: stored ? { ...stored.fields } : fieldFilterInit(),
                sobjects: [], sObjectFields: [], childRelationships: [],
                dataLastErrorMessage: '' });
        },
        refreshMetadata: async (orgKey: string) => {
            try {
                await Proxy.refreshMetadata(orgKey);
                get().loadSchema(orgKey);
            } catch {
                set({ dataLastErrorMessage: 'No se pudo actualizar la metadata. Se conserva la copia anterior.' });
                throw new Error('Metadata refresh failed');
            }
        },
        loadSchema: (orgSfName: SchemaName) => {
            if (orgSfName !== get().activeOrgKey) return;
            const version = ++schemaRequestVersion;
            set({ sobjects: [], sObjectFields: [], childRelationships: [], dataLastErrorMessage: '' });
            const f = get().sObjectsFilter;
            Proxy.getSObjectsAdapter(orgSfName, f).then((data) => {
                if (version === schemaRequestVersion && orgSfName === get().activeOrgKey && data!==null) {
                    set({sobjects: structuredClone(data), dataLastErrorMessage: data.length>0?'':"#CMD.NO_OBJECTS"});
                }
            }).catch(() => {
                if (version === schemaRequestVersion && orgSfName === get().activeOrgKey) set({ dataLastErrorMessage: 'No se pudo cargar el esquema.' });
            });
        },
        setObjectFilterText: (orgSfName: SchemaName, searchText: string) => {
            set({sObjectsFilter: { ...get().sObjectsFilter, searchText }});
            get().loadSchema(orgSfName);
        },
        setObjectFilter: (orgSfName: SchemaName, attrib: string, value: boolean|null) => {
            set({sObjectsFilter: {...get().sObjectsFilter, [attrib] :value    }} );
            get().loadSchema(orgSfName);
        },
        loadFields: (orgSfName: SchemaName, sObjectIndex: SObjectLocalId) => {
            if (orgSfName !== get().activeOrgKey) return;
            const version = ++fieldRequestVersion;
            if (sObjectIndex===undefined || sObjectIndex===null) throw new Error('sObjectIndex is undefined or null');
            const filter = get().fieldsFilter;
            Proxy.getFieldsAdapter(orgSfName, sObjectIndex, filter).then((data) => {
                if (version === fieldRequestVersion && orgSfName === get().activeOrgKey && data!==null) {
                    set({
                         sObjectFields:  structuredClone(data), 
                         dataLastErrorMessage: '' 
                    });
                } else if (version === fieldRequestVersion && orgSfName === get().activeOrgKey) {
                    set({dataLastErrorMessage: `#CMD.Object_not_found|${sObjectIndex}`});
                }
            }).catch(() => {
                if (version === fieldRequestVersion && orgSfName === get().activeOrgKey)
                    set({ dataLastErrorMessage: 'No se pudieron cargar los campos.' });
            });
        },
        loadMetadataFields: (orgSfName: SchemaName, sObjectIndex: SObjectLocalId) => {
            if (orgSfName !== get().activeOrgKey) return;
            Proxy.getFieldsMetadata(orgSfName,  sObjectIndex);
            get().loadFields(orgSfName, sObjectIndex);
            
        },
        loadFieldsByName: (orgSfName: SchemaName, sObjectName: string, callBack: (sObjectLocalId: SObjectLocalId) => void)  => {
            if (orgSfName !== get().activeOrgKey) return;
            const version = ++fieldRequestVersion;
            const id = Proxy.getSobjectIdByName(orgSfName, sObjectName);
            if (id===null) { 
                set({dataLastErrorMessage: `#CMD.Object_not_found|${sObjectName}`});
                return;
            }

            Proxy.getFieldsAdapter(orgSfName,  id, null).then((data) => {
                if (data!==null && version === fieldRequestVersion && orgSfName === get().activeOrgKey) {
                    set({sObjectFields:  structuredClone(data), dataLastErrorMessage: ''});
                    callBack(id);
                    get().createLookuoCommands(data);
                    get().createFieldsCommands(data);
                } else if (version === fieldRequestVersion && orgSfName === get().activeOrgKey) {
                    set({dataLastErrorMessage: `#CMD.Object_not_found|${sObjectName}`}); 
                }
            }).catch(() => {
                if (version === fieldRequestVersion && orgSfName === get().activeOrgKey)
                    set({dataLastErrorMessage: 'No se pudo cargar el objeto.'});
            });
        },
        setFieldFilterText: (orgSfName: SchemaName,  sObjectIndex: SObjectLocalId, searchText: string) => {
            set({fieldsFilter: { ...get().fieldsFilter, searchText }});
            get().loadFields(orgSfName, sObjectIndex);
        },    
        setFieldFilterType: (orgSfName: SchemaName,  sObjectIndex: SObjectLocalId, searchType: SalesforceFieldTypes) => {
            set({fieldsFilter: { ...get().fieldsFilter, type: searchType }});
            get().loadFields(orgSfName, sObjectIndex);
        },            
        setFieldFilter: (orgSfName: SchemaName,  sObjectIndex: SObjectLocalId, attrib: string, value: boolean|null) => {  
            set({fieldsFilter: {...get().fieldsFilter, [attrib] :value    }} );
            get().loadFields(orgSfName, sObjectIndex);
        },
        loadFieldsFromLookup: (field: GetFieldsIndex) => {
            const {orgSfName, referenceToLocalId} = field;
            if (orgSfName !== get().activeOrgKey) return;
            const version = ++fieldRequestVersion;
            Proxy.getFieldsAdapter(orgSfName, referenceToLocalId![0], null).then((data) => {
                if (data!==null && version === fieldRequestVersion && orgSfName === get().activeOrgKey) {
                    set({sObjectFields:  structuredClone(data), fieldsFilter: fieldFilterInit(), dataLastErrorMessage: ''});
                    get().createLookuoCommands(data);
                }
            }).catch(() => {
                if (version === fieldRequestVersion && orgSfName === get().activeOrgKey)
                    set({ dataLastErrorMessage: 'No se pudieron cargar los campos relacionados.' });
            });
        },
        loadFieldsFromChild: (child: GetChildRelationships) => {
            const {orgSfName, sObjectLocalId} = child;
            if (orgSfName !== get().activeOrgKey) return;
            set({fieldsFilter: fieldFilterInit()});
            get().loadFields(orgSfName, sObjectLocalId);
        },
        loadChildRelationships: (orgSfName: SchemaName, objectIndex: SObjectLocalId) => {
            if (orgSfName !== get().activeOrgKey) return;
            const data = Proxy.getChildRelationships(orgSfName, objectIndex);
            if (data!==null) {
                get().createChildRelationshipsCommands(data);
                set({childRelationships: structuredClone(data)});            
            }
        },
        initializeData: () => {
            // Create the commands for the object filter
            for (const key of objectFilterOptions) {
                const cmdText = key.name;
                addCommand({command: cmdText, description: '#sObject.filter.' + key.name, context:CONTEXT_LEVEL.ORG, 
                        action: (actionParams: AcctionParams) => {
                            const {model,  application} = actionParams;
                            get().setObjectFilter(model.state.orgSfName, key.name,  extractValue(application.currentCommand));
                        }
                });
            }
            // Create the commands for the field filter
            for (const key of fieldFilterOptions) {
                const cmdText = key.name;
                addCommand({menuItem:'Select', menuOption:'Field type', command: cmdText, menuCaption: key.name, description: '#field.filter.' + key.name, context:CONTEXT_LEVEL.OBJECT, 
                    action: (actionParams: AcctionParams) => {
                        const {model,  application} = actionParams;
                        get().setFieldFilter(model.state.orgSfName, model.state.sObjectLocalId , key.name,  extractValue(application.currentCommand));
                    }
                });
            }
            // Create the commands for the field filter (field types)
            for (const key of Object.values(SFFieldTypesEnum)) {
                const cmdText = 'type.'+key;
                addCommand({ menuItem:'Select', menuOption:'Value type', command: cmdText, menuCaption: key,  description: '#field.filter.type.' + key, context:CONTEXT_LEVEL.OBJECT, 
                    action: (actionParams: AcctionParams) => {
                        const {model} = actionParams;
                        get().setFieldFilterType(model.state.orgSfName, model.state.sObjectLocalId, key);
                    }
                });
            }
        },
        createFieldsCommands: (data: GetFieldsIndex[]): void => {
            for (const command of fieldCommands) removeCommand(command, CONTEXT_LEVEL.OBJECT);
            fieldCommands.clear();
            for (const field of data) {
                const cmdText = field.fieldApiName;
                fieldCommands.add(cmdText);
                addCommand({command: cmdText, description: 'field.config', context:CONTEXT_LEVEL.OBJECT, 
                    action: (actionParams: AcctionParams) => {
                        const {model, view} = actionParams;
                        model.setField(field);
                        view.pushDialog(Dialog.WhereDialog);
                    }
                });
            }
        },
        createLookuoCommands: (data: GetFieldsIndex[]): void => {
            for (const command of lookupCommands) removeCommand(command, CONTEXT_LEVEL.OBJECT);
            lookupCommands.clear();
            for (const field of data) {
                const cmdText = 'lookup_'+field.fieldApiName;
                if (field.type!==SFFieldTypesEnum.Reference) continue;
                lookupCommands.add(cmdText);
                addCommand({menuItem:'Goto', menuOption:'Related object', command: cmdText, menuCaption: field.fieldApiName,  description: 'field.go.lookup', context:CONTEXT_LEVEL.OBJECT, 
                    action: (actionParams: AcctionParams) => {
                        const {model} = actionParams;
                        get().loadFieldsFromLookup(field);
                        model.gotoLookup(field);
                    }
                });
            }
        },
        createChildRelationshipsCommands: (childs: GetChildRelationships[]): void => {
            for (const command of childCommands) removeCommand(command, CONTEXT_LEVEL.OBJECT);
            childCommands.clear();
            for (const child of childs) {
                const cmdText = 'child_'+ child.childSObject;
                childCommands.add(cmdText);
                addCommand({menuItem:'Goto', menuOption:'Child objects',command: cmdText, menuCaption: child.childSObject, description: 'field.go.child', context:CONTEXT_LEVEL.OBJECT, 
                    action: (actionParams: AcctionParams ) => {
                        const {model} = actionParams;
                        model.gotoChild(child);
                        get().loadFieldsFromChild(child);
                    }
                });
            }
        }

    }
});




function extractValue(commandText: string): boolean|null {
    if (commandText===null) throw Error("#Error.Command_is_null");
    const [, valueString] = commandText.split(' ');
    if (valueString===undefined || valueString==='on') return true; 
    if (valueString==='off')  return false;
    if (valueString==='rm')   return null;
    throw Error(`#Error.WrongParam|${valueString}`);
    }

export default dataState;



