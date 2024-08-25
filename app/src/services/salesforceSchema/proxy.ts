import { getDescribe, getDescribeObject } from './controller'
import { ModelReader } from './modelReader'


const cache: Map<SchemaName, Schema> = new Map(); 
export const modelReader = new ModelReader(cache);






export default class Proxy {


    /**
     * Retrieves the index of Salesforce objects based on the provided filter.
     * @param orgSfName - The name of the Salesforce organization.
     * @param filter - The filter object used to filter the Salesforce objects.
     * @returns A promise that resolves to an array of GetSObjectsIndex objects or null.
     * @throws Error if the orgSfName is invalid or if the Salesforce objects are not found.
     */
    public static async getSObjectsAdapter(orgSfName: SchemaName, filter: SObjectsFilter) : Promise<GetSObjectsIndex[] | null> {
        console.log(`getSObjectsIndex orgSfName: "${orgSfName}"`);
        if (orgSfName.length < 3) {
            throw new Error(`Invalid orgSfName: "${orgSfName}"`);
        }

        if (!cache.has(orgSfName)) {
            const data = await getDescribe(orgSfName);
            if (data) {
                // Numbers the objects
                data.sobjects.forEach((sobject:SObject  , index: number) => sobject.sObjectLocalId = index);
                // indexMap is used to get the index of the object by name
                data.indexMap = new Map();
                data.sobjects.forEach((sobject:SObject) => data.indexMap.set(sobject.name, sobject.sObjectLocalId));
            }
            cache.set(orgSfName, data);
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
        console.log(`getSObject orgSfName: "${orgSfName}" index: "${objectIndex}"`);
        
        if (!cache.has(orgSfName)) {
            throw new Error(`Invalid orgSfName: "${orgSfName}"`);
        }
        try {
            const sobject =  cache.get(orgSfName)!.sobjects[objectIndex];

            if (sobject.fields===undefined) {
                const name = cache.get(orgSfName)?.sobjects[objectIndex]?.name;
                const data: SObject = await getDescribeObject(orgSfName, name!);
                
                if (data!==null) {
                    // Numbers the fields for the current object
                    data.fields?.forEach((item: Fields, index: number) => item.fieldLocalId = index);
                    // mapFields is used to get the index of the field by name
                    data.mapFields = new Map();
                    data.fields?.forEach((field) => data.mapFields.set(field.name, field.fieldLocalId));
                    // Link the child relationships to the object index of the child object
                    data.childRelationships?.forEach((item:ChildRelationships) => {
                        item.sObjectLocalId = modelReader.getSObjectLocalIdbyName(orgSfName, item.childSObject);
                    });
                }
                sobject.fields =  structuredClone(data.fields);
                sobject.childRelationships = structuredClone(data.childRelationships);
            } 

            const result: GetFieldsIndex[] = sobject.fields!
                .filter((field) => this.checkMatchFieldFilter(field, filter)) 
                .map((field): GetFieldsIndex => ({
                    fieldLocalId: field.fieldLocalId, 
                    isTechnicalField: false,
                    sObjectApiName: field.name, 
                    label: field.label, 
                    length: field.length, 
                    precision: field.precision, 
                    scale: field.scale, 
                    unique: field.unique, 
                    custom: field.custom, 
                    type: field.type, 
                    referenceTo: field.referenceTo[0],
                    relationshipName: field.relationshipName
                }));
            return new Promise((resolve) => resolve(result));
        } catch (error) {
            console.error(`******Unexpected error: ${(error as Error).message}`);
            throw new Error((error as Error).message);
        }
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
            if (key === 'type') continue;
            if (key === 'searchText') {
                if (!filter.searchText) {
                    continue;
                } else {
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
        console.log(`getChildRelationships orgSfName: "${orgSfName}" name: "${objectIndex}"`);
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
                sObjectLocalId: child.sObjectLocalId,
                childSObject: child.childSObject, 
                relationshipName: child.relationshipName, 
                fieldNameAPI: child.field}));   
    }



    public static getFieldIdByIndex(orgSfName: string, sObjectIndex: number, fieldIndex: number): FieldId {
        console.log(`getFieldIdByIndex orgSfName: "${orgSfName}" sObjectIndex: "${sObjectIndex}" fieldIndex: "${fieldIndex}"`);
        if (!cache.has(orgSfName)) {
            throw new Error(`Invalid orgSfName: "${orgSfName}"`);
        }
        const sobject = cache.get(orgSfName)?.sobjects[sObjectIndex];
        if (!sobject) {
            throw new Error(`Invalid orgSfName: "${orgSfName}"`);
        }
        return  {orgSfName, sObjectIndex, fieldApiName: sobject.fields![fieldIndex].name, fieldIndex}; 
    }


    public static getSobjectIdByName(orgSfName: string, name: string): SObjectLocalId | null {
        console.log(`getSobjectIdByName orgSfName: "${orgSfName}" name: "${name}"`);
        if (!cache.has(orgSfName)) {
            throw new Error(`Invalid orgSfName: "${orgSfName}"`);
        }
        const sobjects = cache.get(orgSfName)?.sobjects;
        if (!sobjects) {
            throw new Error(`Invalid orgSfName: "${orgSfName}"`);
        }
        const result = sobjects.find((sobject) => sobject.name === name);
        return (result===null || result===undefined)? null: result.sObjectLocalId!;
    }



    public static getReferenceSObjectId(orgSfName: string, sObjectIndex: number, fieldIndex: number): SObjectReferenceId {
        console.log(`getReferenceSObjectId orgSfName: "${orgSfName}" sObjectIndex: "${sObjectIndex}" fieldIndex: "${fieldIndex}"`);
        if (!cache.has(orgSfName)) {
            throw new Error(`Invalid orgSfName: "${orgSfName}"`);
        }
        const sobject = cache.get(orgSfName)?.sobjects[sObjectIndex];
        if (!sobject) {
            throw new Error(`Invalid orgSfName: "${orgSfName}"`);
        }
        const field = sobject.fields![fieldIndex];
        if (field.type !== 'reference') {
            throw new Error(`Invalid fieldIndex: "${fieldIndex}" type: "${field.type}"`);
        }
        return {...Proxy.getSobjectIdByName(orgSfName, field.referenceTo[0]), referenceName: field.relationshipName!};
        
    }
}


