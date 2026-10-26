/**
 * @description HttpMetadataPorts are the ports used to manage the http request about databes metadata info.
 * 
 */

import { SessionId } from '../../entities/workspaceSession';
import { PublicQueryPage } from '../../entities/queryContract';

export interface HttpMetadataInputPort {
    getDescribeGlobal(sessionId: SessionId, orgKey: string): Promise<string>;
    describeSObject(sessionId: SessionId, orgKey: string, sobject: string): Promise<string>;
    runQuery(sessionId: SessionId, orgKey: unknown, query: unknown, limit: unknown): Promise<PublicQueryPage>;
}
