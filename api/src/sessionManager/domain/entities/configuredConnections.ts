import { ConnectionDriverDTO }  from './../../application/dtos/connectionDriverDTO';
import { createOrgKey, OrgKey } from './orgKey';




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
    
    getAlias(): string {
        if (!this.connectionDriver.alias) {
            throw new Error('Alias not found');
        }
        return this.connectionDriver.alias;
    }

    getOrgKey(): OrgKey {
        return createOrgKey(this.connectionDriver.dbId, this.connectionDriver.userId);
    }
}
