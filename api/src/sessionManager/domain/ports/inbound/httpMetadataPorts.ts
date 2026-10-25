/**
 * @description HttpMetadataPorts are the ports used to manage the http request about databes metadata info.
 * 
 */

import { SessionId } from '../../entities/workspaceSession';

export interface HttpMetadataInputPort {
    getDescribeGlobal(sessionId: SessionId, dbName: string): Promise<string>;
    describeSObject(sessionId: SessionId, dbName: string, sobject: string): Promise<string>;
    doSOQL(sessionId: SessionId, dbName: string, soql: string): Promise<string>;
}
