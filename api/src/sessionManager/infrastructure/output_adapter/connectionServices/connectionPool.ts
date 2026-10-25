import { ConnectionDriver } from "./connectionDriver";
import { SessionId } from "../../../domain/entities/workspaceSession";
import { OrgKey } from '../../../domain/entities/orgKey';

interface UserConections {
    conns: Map<OrgKey, ConnectionDriver>;
}

class ConnectionPool {
    private pool: Map<SessionId, UserConections>;
    constructor() {
        this.pool = new Map();
    }

    private getUserPool(sessionId: SessionId): UserConections {
        if (!this.pool.has(sessionId)) {
            throw new Error('Session not found');
        }
        const userPool = this.pool.get(sessionId);
        if (!userPool) {
            throw new Error('Connections not found');
        }
        return userPool;
    }

    public addConnection(sessionId: SessionId, orgKey: OrgKey, connection: ConnectionDriver): void {
        if (!this.pool.has(sessionId)) {
            this.pool.set(sessionId, { conns: new Map() });
        }
        const userPool = this.getUserPool(sessionId);
        userPool.conns.set(orgKey, connection);
        return; 
    }

    public getConnection(sessionId: SessionId, orgKey: OrgKey): ConnectionDriver {
        const userPool = this.getUserPool(sessionId);
        if (!userPool.conns.has(orgKey)) {
            throw new Error('Connection not found');
        }
        return userPool.conns.get(orgKey) as ConnectionDriver;
    }

    public rotateSession(previousId: SessionId, sessionId: SessionId): void {
        const connections = this.pool.get(previousId);
        this.pool.delete(previousId);

        if (connections) {
            this.pool.set(sessionId, connections);
        }
    }

    public deleteSession(sessionId: SessionId): void {
        this.pool.delete(sessionId);
    }

}

const connectionPool = new ConnectionPool();    
export default connectionPool;
