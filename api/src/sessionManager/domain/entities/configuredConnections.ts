import { ConnectionDriverDTO }  from './../../application/dtos/connectionDriverDTO';




export class configuredConnections {
    constructor (private connectionDriver: ConnectionDriverDTO) {}

    getConnectionDriverConfig(): ConnectionDriverDTO {
        return this.connectionDriver;
    }

    getTech(): string {
        if (!this.connectionDriver.tech) {
            throw new Error('Tech not found');
        }
        return this.connectionDriver.tech;
    }
    
    getDbName(): string  {
        if (!this.connectionDriver.dbName) {
            throw new Error('DbName not found');
        }
        return this.connectionDriver.dbName;
    }
    getAlias(): string {
        if (!this.connectionDriver.alias) {
            throw new Error('Alias not found');
        }
        return this.connectionDriver.alias;
    }
}
