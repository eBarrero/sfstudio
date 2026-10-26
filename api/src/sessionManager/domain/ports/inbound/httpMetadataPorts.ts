/**
 * @description HttpMetadataPorts are the ports used to manage the http request about databes metadata info.
 * 
 */

import { SessionId } from '../../entities/workspaceSession';

export interface HttpMetadataInputPort {
    getDescribeGlobal(sessionId: SessionId, orgKey: string): Promise<string>;
    describeSObject(sessionId: SessionId, orgKey: string, sobject: string): Promise<string>;
    doSOQL(sessionId: SessionId, orgKey: string, soql: string): Promise<string>;
}
