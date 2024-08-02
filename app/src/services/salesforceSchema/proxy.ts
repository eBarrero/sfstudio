import { getDescribe, getDescribeObject } from './controller'



const cache: Map<SchemaName, Schema> = new Map(); 







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
                data.sobjects.forEach((sobject:SObject  , index: number) => sobject.sObjectLocalId = index);
            }
            cache.set(orgSfName, data);
        } 

        const sobjects = cache.get(orgSfName)?.sobjects;
        if (!sobjects) {
            throw new Error(`Invalid orgSfName: "${orgSfName}"`);
        }

        const result: GetSObjectsIndex[] | null = sobjects
            .filter((sobject) => sobject.queryable === true && sobject.keyPrefix!==null && sobject.name.toUpperCase().includes(filter.searchText))
            .map((sobject): GetSObjectsIndex => ({sObjectLocalId: sobject.sObjectLocalId, name: sobject.name, label: sobject.label, keyPrefix: sobject.keyPrefix!}));
        return new Promise((resolve) => resolve(result));
    }

    // Responsabilities: 
    // 1. Retrieves the fields of a Salesforce object based on the provided index.
    // 2. information is cached
    // 3. Field object is numbered
    // 4. Child relationships are linked to the object index of the child object
    
    public static async getFields(orgSfName: SchemaName, objectIndex: SObjectLocalId) : Promise<GetFieldsIndex[]> {
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

                    data.childRelationships?.forEach((item:ChildRelationships) => {
                        const i = cache.get(orgSfName)?.sobjects.findIndex((sobject) => sobject.name === item.childSObject);
                        if (i === -1) throw new Error(`Object not found: "${item.childSObject}"`);
                        item.sObjectLocalId = i!;
                    });
                }
                sobject.fields =  structuredClone(data.fields);
                sobject.childRelationships = structuredClone(data.childRelationships);
                console.log(`childRelationships: ${sobject.childRelationships.length}`);
            } 

            const result: GetFieldsIndex[] = sobject.fields!
                .map((field): GetFieldsIndex => ({fieldLocalId: field.fieldLocalId, name: field.name, label: field.label, length: field.length, precision: field.precision, scale: field.scale, unique: field.unique, custom: field.custom, type: field.type, referenceTo: field.referenceTo[0]}));
            return new Promise((resolve) => resolve(result));
        } catch (error) {
            console.error(`******Unexpected error: ${(error as Error).message}`);
            throw error;
        }
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


    public static getSobjectIdByName(orgSfName: string, name: string): SObjectId  {
        console.log(`getSobjectIdByName orgSfName: "${orgSfName}" name: "${name}"`);
        if (!cache.has(orgSfName)) {
            throw new Error(`Invalid orgSfName: "${orgSfName}"`);
        }
        const sobjects = cache.get(orgSfName)?.sobjects;
        if (!sobjects) {
            throw new Error(`Invalid orgSfName: "${orgSfName}"`);
        }
        const result = sobjects.find((sobject) => sobject.name === name);
        return {orgSfName, sObjectApiName: name, sObjectIndex: result!.localId!};
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


