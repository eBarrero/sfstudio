import { sendQuery, getMetadataObject  } from './controller'
import type { SalesforceQueryResponse } from './controller'
import { ModelReader } from './modelReader'
import { loadGlobal, loadObject, metadataStatus, refreshGlobal } from './snapshotAdapter'


const cache: Map<SchemaName, Schema> = new Map(); 
const cacheFetchedAt = new Map<SchemaName, number>();
export const modelReader = new ModelReader(cache);






export default class Proxy {

    public static async refreshMetadata(orgKey: string): Promise<void> {
        const response = await refreshGlobal(orgKey);
        const sobjects: SObject[] = response.map((sobject, index) => ({
            ...sobject, orgSfName: orgKey, sObjectLocalId: index,
            mapFields: new Map(), metadataFieldDownloaded: null,
        }));
        cache.set(orgKey, { name: orgKey, sobjects,
            indexMap: new Map(sobjects.map(object => [object.name, object.sObjectLocalId])) });
        cacheFetchedAt.set(orgKey, metadataStatus(orgKey).fetchedAt ?? 0);
    }


    /**
     * Retrieves the index of Salesforce objects based on the provided filter.
     * @param orgSfName - The name of the Salesforce organization.
     * @param filter - The filter object used to filter the Salesforce objects.
     * @returns A promise that resolves to an array of GetSObjectsIndex objects or null.
     * @throws Error if the orgSfName is invalid or if the Salesforce objects are not found.
     */
    public static async getSObjectsAdapter(orgSfName: SchemaName, filter: SObjectsFilter) : Promise<GetSObjectsIndex[] | null> {
        if (orgSfName.length < 3) {
            throw new Error(`Invalid orgSfName: "${orgSfName}"`);
        }

        const latest = metadataStatus(orgSfName).fetchedAt ?? 0;
        if (latest > (cacheFetchedAt.get(orgSfName) ?? 0)) cache.delete(orgSfName);
        if (!cache.has(orgSfName)) {
            const response = await loadGlobal(orgSfName);
            const sobjects: SObject[] = response.map((sobject, index) => ({
                ...sobject,
                orgSfName,
                sObjectLocalId: index,
                mapFields: new Map(),
                metadataFieldDownloaded: null,
            }));
            const fetchedAt = metadataStatus(orgSfName).fetchedAt ?? 0;
            if (!cache.has(orgSfName) || (cacheFetchedAt.get(orgSfName) ?? 0) < fetchedAt) {
                cache.set(orgSfName, {
                    name: orgSfName,
                    sobjects,
                    indexMap: new Map(sobjects.map(sobject => [sobject.name, sobject.sObjectLocalId])),
                });
                cacheFetchedAt.set(orgSfName, fetchedAt);
            }
        } 

        const sobjects = cache.get(orgSfName)?.sobjects;
        if (!sobjects) {
            throw new Error(`Invalid orgSfName: "${orgSfName}"`);
        }

        const result: GetSObjectsIndex[] | null = sobjects
            .filter((sobject) => {return this.checkMatchObjectFilter(sobject, filter)})
            .map((sobject): GetSObjectsIndex => ({sObjectLocalId: sobject.sObjectLocalId, name: sobject.name, label: sobject.label, keyPrefix: sobject.keyPrefix!}));
        return new Promise((resolve) => resolve(result));
    }

    /**
     * @description Check if the object matches the filter
     * @param object - The object to be checked
     * @param filter - The filter object used to filter the Salesforce objects.
     * @returns true if the object matches the filter, false otherwise. 
     */
    private static checkMatchObjectFilter(sobject: SObject, filter: SObjectsFilter): boolean  {
        if (sobject.keyPrefix===null) return false;
        for (const key of Object.keys(filter)) {
            const valueFilter =  filter[key as keyof SObjectsFilter];
            const valueSObject = sobject[key as keyof SObject];
            if (key === 'searchText') {
                if (!(filter.searchText)) {
                    continue;
                } else {
                    const words=  filter.searchText.toUpperCase().split(' ');
                    const matchs = words.filter((word) =>  sobject.name.toUpperCase().includes(word)).length ;
                    if (matchs===undefined || matchs<words.length ) return false; else continue;
                }
            }
            if (valueFilter !== undefined && valueFilter !== null &&  valueSObject !== valueFilter) return false;
        }
        return true;
    }

    // Responsabilities: 
    // 1. Retrieves the fields of a Salesforce object based on the provided index.
    // 2. information is cached
    // 3. Field object is numbered
    // 4. Child relationships are linked to the object index of the child object
    
    public static async getFieldsAdapter(orgSfName: SchemaName, objectIndex: SObjectLocalId, filter: FieldsFilter | null) : Promise<GetFieldsIndex[]> {
        
        if (!cache.has(orgSfName)) {
            throw new Error(`Invalid orgSfName: "${orgSfName}"`);
        }
            let sobject = cache.get(orgSfName)!.sobjects[objectIndex];
            
            if (sobject.fields == null) {
                const name = cache.get(orgSfName)?.sobjects[objectIndex]?.name;
                const response = await loadObject(orgSfName, name!);
                const data: SObject = { ...response, orgSfName, sObjectLocalId: objectIndex,
                    mapFields: new Map(), metadataFieldDownloaded: null };
                
                if (data!==null) {
                    // Set object local index and org
                    data.sObjectLocalId = objectIndex;
                    data.orgSfName = orgSfName;
                    // Numbers the fields for the current object
                    data.fields?.forEach((item: Fields, index: number) => item.fieldLocalId = index);
                    // mapFields is used to get the index of the field by name
                    data.mapFields = new Map();
                    data.fields?.forEach((field) => data.mapFields.set(field.name, field.fieldLocalId));
                    // Link the child relationships to the object index of the child object
                    data.childRelationships?.forEach((item:ChildRelationships) => {
                        const tmp = modelReader.getSObjectLocalIdbyName(orgSfName, item.childSObject);
                        item.sObjectLocalId = (tmp===null)?-1:tmp;
                    });
                    // Update Lookup fields with the referenceTo field
                    data.fields?.forEach((field) => {
                        if (field.type === 'reference') {
                            field.referenceToLocalId = [];
                            const tmp  = modelReader.getSObjectLocalIdbyName(orgSfName, field.referenceTo[0]);
                            field.referenceToLocalId[0] = (tmp===null)?-1:tmp;
                        }
                    });
                    const current = cache.get(orgSfName)?.sobjects[objectIndex];
                    if (!current || current.name !== name) throw new Error('Object context changed');
                    sobject = current;
                    sobject.childRelationships = structuredClone(data.childRelationships);
                    sobject.fields = structuredClone(data.fields);
                    sobject.mapFields = structuredClone(data.mapFields);
                    
                }
                
                
            } 
            const result: GetFieldsIndex[] = sobject.fields!
                .filter((field) => this.checkMatchFieldFilter(field, filter)) 
                .map((field): GetFieldsIndex => ({
                    orgSfName: orgSfName,
                    sObjectLocalId: objectIndex,
                    fieldLocalId: field.fieldLocalId, 
                    isTechnicalField: false,
                    fieldApiName: field.name, 
                    label: field.label, 
                    length: field.length, 
                    precision: field.precision, 
                    scale: field.scale, 
                    unique: field.unique, 
                    custom: field.custom, 
                    type: field.type, 
                    referenceTo: field.referenceTo[0],
                    relationshipName: field.relationshipName,
                    referenceToLocalId: field.referenceToLocalId,
                    description: field.description,
                    picklistValues: field.picklistValues,
                }));
                
            return new Promise((resolve) => resolve(result));
    }

     /**
     * @description Check if the fidlds matches the filter
     * @param Field - The object to be checked
     * @param FieldsFilter - The filter used to filter the Salesforce fileds.
     * @returns true if the object matches the filter, false otherwise. 
     */
    private static checkMatchFieldFilter(field: Fields, filter: FieldsFilter | null): boolean  {
        if (filter===null) return true;
        for (const key of Object.keys(filter)) {
            const valueFilter =  filter[key as keyof FieldsFilter];
            const valueField = field[key as keyof Fields];
            if (key === 'searchText') {
                if (filter.searchText!==null) {
                    const words=  filter.searchText.toUpperCase().split(' ');
                    const matchs = words.filter((word) =>  field.name.toUpperCase().includes(word)).length;
                    if (matchs===undefined || matchs<words.length ) return false; else continue;
                }
                
            }           
            if (valueFilter !== undefined && valueFilter !== null &&  valueField !== valueFilter) return false;
        }
        return true;
    }
    
    public static getChildRelationships(orgSfName: string, objectIndex: SObjectLocalId): GetChildRelationships[] {
        if (!cache.has(orgSfName)) {
            throw new Error(`Invalid orgSfName: "${orgSfName}"`);
        }
        const sObject =  cache.get(orgSfName)!.sobjects[objectIndex];
        if (!sObject) {
            throw new Error(`No Data Found: "${orgSfName}"`);
        }
        
        if (!sObject.childRelationships) {
            throw new Error(`Invalid objectIndex: "${sObject.childRelationships}"`);
        }
        return sObject!.childRelationships!
            .filter((child) => child.relationshipName !== null)
            .map((child): GetChildRelationships => ({
                orgSfName: orgSfName,
                sObjectLocalId: child.sObjectLocalId,
                childSObject: child.childSObject, 
                relationshipName: child.relationshipName, 
                fieldNameAPI: child.field}));   
    }



    public static getFieldIdByIndex(orgSfName: string, sObjectIndex: number, fieldIndex: number): FieldId {
        if (!cache.has(orgSfName)) {
            throw new Error(`Invalid orgSfName: "${orgSfName}"`);
        }
        const sobject = cache.get(orgSfName)?.sobjects[sObjectIndex];
        if (!sobject) {
            throw new Error(`Invalid orgSfName: "${orgSfName}"`);
        }
        return  {fieldApiName: sobject.fields![fieldIndex].name, fieldIndex}; 
    }


    public static getSobjectIdByName(orgSfName: string, name: string): SObjectLocalId | null {
        if (!cache.has(orgSfName)) {
            throw new Error(`Invalid orgSfName: "${orgSfName}"`);
        }
        const sobjects = cache.get(orgSfName)?.sobjects;
        if (!sobjects) {
            throw new Error(`Invalid orgSfName: "${orgSfName}"`);
        }
        const result = sobjects.find((sobject) => sobject.name.toUpperCase() === name.toUpperCase());
        return (result===null || result===undefined)? null: result.sObjectLocalId!;
    }


    /**
     * @description get metadata of the fields' object and update the object cache
     * @param orgSfName 
     * @param object - The object with the fields to be retrieved
     */
    public static async getFieldsMetadata(orgSfName: string, objectIndex: SObjectLocalId) {
        if (!cache.has(orgSfName)) {
            throw new Error(`Invalid orgSfName: "${orgSfName}"`);
        }
        const sobject = cache.get(orgSfName)?.sobjects[objectIndex];
        if (!sobject) {
            throw new Error(`Invalid sObjectId "${objectIndex}"`);
        }

        // Check if the fields are already updated
        if (sobject.metadataFieldDownloaded ===  'DOWNLOADED'  ) return;
        sobject.metadataFieldDownloaded= 'DOWNLOADING'

//        try {
            if (sobject.fields===undefined || sobject.fields===null || sobject.fields.length===0) {
                throw new Error(`Missing fileds: "${sobject.name}"`);
            }
            const fields = sobject.fields
            const data = await getMetadataObject(orgSfName, sobject.name!);
            if (data===null) {
                throw new Error(`Missing metadata: "${sobject.name}"`);
            } else {
                data.forEach((item) => {
                    const {name, description} = item;
                    const fieldLocalId = sobject.mapFields.get(name);
                    if (fieldLocalId===undefined) {
                        return;
                    } else {
                        fields[fieldLocalId].description =description;
                    }
                });
                sobject.metadataFieldDownloaded= 'DOWNLOADED';
            }
        return;

    }


    public static async sendSoqlAdapter(orgSfName: string, query: string): Promise<SalesforceQueryResponse> {
        return await sendQuery(orgSfName, query);   
    }
}


