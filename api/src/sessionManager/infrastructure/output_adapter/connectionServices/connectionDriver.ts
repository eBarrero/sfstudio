import { ConnectionDriverDTO } from '../../../application/dtos/connectionDriverDTO';

export abstract class ConnectionDriver {
    protected isConnected: boolean = false;
    constructor(protected configDriverDTO: ConnectionDriverDTO) {}

    abstract requestAuthorization(): string;
    abstract login(): Promise<ConnectionDriverDTO>; 
    abstract getDescribeGlobal(): Promise<string>; 
    abstract describeSObject(sobject: string): Promise<string>;
    abstract doSOQL(decodedQuery: string): Promise<string>
}