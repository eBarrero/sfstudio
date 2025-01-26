import { ConnectionDriverDTO } from '../../../application/dtos/connectionDriverDTO';

export abstract class ConnectionDriverPort {
    constructor(private ConfigDriverDTO: ConnectionDriverDTO) { }
    abstract requestAuthorization(): string;
}