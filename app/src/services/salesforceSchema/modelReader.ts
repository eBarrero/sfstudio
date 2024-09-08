


export class ModelReader {
  private localSchema: Map<SchemaName, Schema> = new Map(); 

  constructor(localSchema: Map<SchemaName, Schema> ) {
    this.localSchema = localSchema
  }

  getSObjectApiName(orgSfName: SchemaName, sObjectIndex: SObjectLocalId): SObjectApiName {
    const sObjectApiName = this.localSchema.get(orgSfName)?.sobjects[sObjectIndex].name;
    if (sObjectApiName === undefined || sObjectApiName === null) {
      throw new Error(`Invalid orgSfName: "${orgSfName}" or sObjectIndex: "${sObjectIndex}"`);
    }
    return sObjectApiName;
  }
  getSObjectLocalIdbyName(orgSfName: SchemaName, name: SObjectApiName): SObjectLocalId {
    const sObjectLocalId = this.localSchema.get(orgSfName)?.indexMap.get(name);
    if (sObjectLocalId === undefined || sObjectLocalId === null) {
      throw new Error(`Invalid orgSfName: "${orgSfName}" or name: "${name}"`);
    }
    return sObjectLocalId;
  }
  getSObject(orgSfName: SchemaName, sObjectIndex: SObjectLocalId): SObject {
    const sObject = this.localSchema.get(orgSfName)?.sobjects[sObjectIndex];
    if (sObject === undefined || sObject === null) {
      throw new Error(`Invalid orgSfName: "${orgSfName}" or sObjectIndex: "${sObjectIndex}"`);
    }
    return {...sObject};
  }
  getFieldApiName(orgSfName: SchemaName, sObjectIndex: SObjectLocalId, fieldIndex: FieldLocalId): SObjectApiName {
    const org = this.localSchema.get(orgSfName)
    if (!org) {
      throw new Error(`Invalid orgSfName: "${orgSfName}"`);
    }    
    const object = org.sobjects[sObjectIndex]
    if (object === undefined || object === null) {
      throw new Error(`Invalid sObjectIndex: "${sObjectIndex}"`);
    }    
    const fieldApiName = object.fields![fieldIndex].name;

    if (fieldApiName === undefined || fieldApiName === null) {
      throw new Error(`Invalid orgSfName: "${orgSfName}" or sObjectIndex: "${sObjectIndex}" or fieldIndex: "${fieldIndex}"`);
    }
    return fieldApiName;
  }
  getField(orgSfName: SchemaName, sObjectIndex: SObjectLocalId, fieldIndex: FieldLocalId): Fields {
    const org = this.localSchema.get(orgSfName)
    if (!org) {
      throw new Error(`Invalid orgSfName: "${orgSfName}"`);
    }    
    const object = org.sobjects[sObjectIndex]
    if (object === undefined || object === null) {
      throw new Error(`Invalid sObjectIndex: "${sObjectIndex}"`);
    }    
    const field = object.fields![fieldIndex];
    if (field === undefined || field === null) {
      throw new Error(`Invalid orgSfName: "${orgSfName}" or sObjectIndex: "${sObjectIndex}" or fieldIndex: "${fieldIndex}"`);
    }
    return {...field};
  }
}