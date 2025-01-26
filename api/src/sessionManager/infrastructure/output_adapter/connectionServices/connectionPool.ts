import { ConnectionDriver } from "./connectionDriver";

interface UserConections {
    conns: Map<string, ConnectionDriver>;
}

class ConnectionPool {
    private pool: Map<number, UserConections>;
    constructor() {
        this.pool = new Map();
    }

    private getUserPool(sessionId: number): UserConections {
        console.log(`getUserPool ${sessionId}`);
        if (!this.pool.has(sessionId)) {
            throw new Error('Session not found');
        }
        const userPool = this.pool.get(sessionId);
        if (!userPool) {
            throw new Error('Connections not found');
        }
        return userPool;
    }

    public addConnection(sessionId: number, dbName: string,  connection: ConnectionDriver): void {
        console.log(`addConnection ${sessionId}`);
        if (!this.pool.has(sessionId)) {
            this.pool.set(sessionId, { conns: new Map() });
        }
        const userPool = this.getUserPool(sessionId);
        userPool.conns.set(dbName, connection);
        return; 
    }

    public getConnection(sessionId: number, dbName: string): ConnectionDriver {
        console.log(`getConnection ${sessionId} ${dbName}`);
        const userPool = this.getUserPool(sessionId);
        if (!userPool.conns.has(dbName)) {
            throw new Error('Connection not found');
        }
        return userPool.conns.get(dbName) as ConnectionDriver;
    }

}

const connectionPool = new ConnectionPool();    
export default connectionPool;