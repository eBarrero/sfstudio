import { getDescribe, getDescribeObject } from '../Service/Request'



const fullEnvironment: Map<string, Environment> = new Map(); 







export class Controller {


    public static getChildRelationships(orgSfName: string, objectIndex: number): GetChildRelationships[] {
        console.log(`getChildRelationships orgSfName: "${orgSfName}" name: "${objectIndex}"`);
        if (!fullEnvironment.has(orgSfName)) {
            throw new Error(`Invalid orgSfName: "${orgSfName}"`);
        }
        const sobjects = fullEnvironment.get(orgSfName)?.sobjects;
        if (!sobjects) {
            throw new Error(`Invalid orgSfName: "${orgSfName}"`);
        }
        const object = sobjects[objectIndex];

        return object!.childRelationships!
            .filter((child) => child.relationshipName !== null)
            .map((child): GetChildRelationships => ({childSObject: child.childSObject, relationshipName: child.relationshipName, field: child.field}));   
    }

    public static getSobjectIdByName(orgSfName: string, name: string): SObjectId  {
        console.log(`getSobjectIdByName orgSfName: "${orgSfName}" name: "${name}"`);
        if (!fullEnvironment.has(orgSfName)) {
            throw new Error(`Invalid orgSfName: "${orgSfName}"`);
        }
        const sobjects = fullEnvironment.get(orgSfName)?.sobjects;
        if (!sobjects) {
            throw new Error(`Invalid orgSfName: "${orgSfName}"`);
        }
        const result = sobjects.find((sobject) => sobject.name === name);
        return {orgSfName, sObjectApiName: name, sObjectIndex: result!.localId!};
    }

    public static getFieldIdByIndex(orgSfName: string, sObjectIndex: number, fieldIndex: number): FieldId {
        console.log(`getFieldIdByIndex orgSfName: "${orgSfName}" sObjectIndex: "${sObjectIndex}" fieldIndex: "${fieldIndex}"`);
        if (!fullEnvironment.has(orgSfName)) {
            throw new Error(`Invalid orgSfName: "${orgSfName}"`);
        }
        const sobject = fullEnvironment.get(orgSfName)?.sobjects[sObjectIndex];
        if (!sobject) {
            throw new Error(`Invalid orgSfName: "${orgSfName}"`);
        }
        return  {orgSfName, sObjectIndex, fieldApiName: sobject.fields![fieldIndex].name, fieldIndex}; 
        
    }


    public static getReferenceSObjectId(orgSfName: string, sObjectIndex: number, fieldIndex: number): SObjectReferenceId {
        console.log(`getReferenceSObjectId orgSfName: "${orgSfName}" sObjectIndex: "${sObjectIndex}" fieldIndex: "${fieldIndex}"`);
        if (!fullEnvironment.has(orgSfName)) {
            throw new Error(`Invalid orgSfName: "${orgSfName}"`);
        }
        const sobject = fullEnvironment.get(orgSfName)?.sobjects[sObjectIndex];
        if (!sobject) {
            throw new Error(`Invalid orgSfName: "${orgSfName}"`);
        }
        const field = sobject.fields![fieldIndex];
        if (field.type !== 'reference') {
            throw new Error(`Invalid fieldIndex: "${fieldIndex}" type: "${field.type}"`);
        }
        return {...Controller.getSobjectIdByName(orgSfName, field.referenceTo[0]), referenceName: field.relationshipName!};
        
    }


    public static async getSObjectsIndex(orgSfName: string, filter: FilterSObject) : Promise<GetSObjectsIndex[] | null> {
        console.log(`getSObjectsIndex orgSfName: "${orgSfName}"`);
        if (orgSfName.length < 3) {
            throw new Error(`Invalid orgSfName: "${orgSfName}"`);
        }

        if (!fullEnvironment.has(orgSfName)) {
            const data = await getDescribe(orgSfName);
            // numerar el valor localId de cada sobject
            if (data) {
                data.sobjects.forEach((sobject:SObject  , index: number) => sobject.localId = index);
            }
            fullEnvironment.set(orgSfName, data);
        } 

        const sobjects = fullEnvironment.get(orgSfName)?.sobjects;
        if (!sobjects) {
            throw new Error(`Invalid orgSfName: "${orgSfName}"`);
        }

        const result: GetSObjectsIndex[] | null = sobjects
            .filter((sobject) => sobject.queryable === true && sobject.keyPrefix!==null && sobject.name.toUpperCase().includes(filter.name))
            .map((sobject): GetSObjectsIndex => ({index: sobject.localId, name: sobject.name, label: sobject.label, keyPrefix: sobject.keyPrefix!}));
        return new Promise((resolve) => resolve(result));
    }
    
    public static async getFields(orgSfName: string, index: number) : Promise<GetFieldsIndex[]> {
        console.log(`getSObject orgSfName: "${orgSfName}" index: "${index}"`);
        
        if (!fullEnvironment.has(orgSfName)) {
            throw new Error(`Invalid orgSfName: "${orgSfName}"`);
        }
        try {
            const sobject =  fullEnvironment.get(orgSfName)!.sobjects[index];

            if (sobject.fields===undefined) {
                const name = fullEnvironment.get(orgSfName)?.sobjects[index]?.name;
                const data = await getDescribeObject(orgSfName, name!);
                // numerar el valor localId de cada sobject
                if (data) {
                    data.fields.forEach((sobject:Fields  , index: number) => sobject.localId = index);
                }
                sobject.fields = data.fields;
                sobject.childRelationships = data.childRelationships;
            } 

            const result: GetFieldsIndex[] = sobject.fields!
                .map((field): GetFieldsIndex => ({index: field.localId, name: field.name, label: field.label, length: field.length, precision: field.precision, scale: field.scale, unique: field.unique, custom: field.custom, type: field.type, referenceTo: field.referenceTo[0]}));
            return new Promise((resolve) => resolve(result));
        } catch (error) {
            console.error(`******Unexpected error: ${(error as Error).message}`);
            throw error;
        }
    }
}


