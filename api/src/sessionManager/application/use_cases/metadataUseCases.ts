import { HttpMetadataInputPort } from '../../domain/ports/inbound/httpMetadataPorts';
import ConnectionPool from '../../infrastructure/output_adapter/connectionServices/connectionPool';

export class MetadataRequestUseCase implements HttpMetadataInputPort {
    
    async getDescribeGlobal(sessionId: number, dbName: string ): Promise<string> {
        const conn = ConnectionPool.getConnection(sessionId, dbName);
        return conn.getDescribeGlobal();
    }

    async describeSObject(sessionId: number, dbName: string, sobject: string ): Promise<string> {
        const conn = ConnectionPool.getConnection(sessionId, dbName);
        return conn.describeSObject(sobject);
    }

    async doSOQL(sessionId: number, dbName: string, soql: string): Promise<string> {
        const conn = ConnectionPool.getConnection(sessionId, dbName);
        return conn.doSOQL(soql);
    }
}