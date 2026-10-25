import { HttpMetadataInputPort } from '../../domain/ports/inbound/httpMetadataPorts';
import ConnectionPool from '../../infrastructure/output_adapter/connectionServices/connectionPool';
import { SessionId } from '../../domain/entities/workspaceSession';

export class MetadataRequestUseCase implements HttpMetadataInputPort {
    
    async getDescribeGlobal(sessionId: SessionId, dbName: string): Promise<string> {
        const conn = ConnectionPool.getConnection(sessionId, dbName);
        return conn.getDescribeGlobal();
    }

    async describeSObject(sessionId: SessionId, dbName: string, sobject: string): Promise<string> {
        const conn = ConnectionPool.getConnection(sessionId, dbName);
        return conn.describeSObject(sobject);
    }

    async doSOQL(sessionId: SessionId, dbName: string, soql: string): Promise<string> {
        const conn = ConnectionPool.getConnection(sessionId, dbName);
        return conn.doSOQL(soql);
    }
}
