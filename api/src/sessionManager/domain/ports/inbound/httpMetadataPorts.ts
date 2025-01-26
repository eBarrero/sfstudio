/**
 * @description HttpMetadataPorts are the ports used to manage the http request about databes metadata info.
 * 
 */

export interface HttpMetadataInputPort {
    getDescribeGlobal(sessionId: number, dbName: string): Promise<string>;
    describeSObject(sessionId: number, dbName: string, sobject: string): Promise<string>;
    doSOQL(sessionId: number, dbName: string, soql: string): Promise<string>;
}