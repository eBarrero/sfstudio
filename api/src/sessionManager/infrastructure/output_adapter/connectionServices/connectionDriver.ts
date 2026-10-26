import { ConnectionDriverDTO } from '../../../application/dtos/connectionDriverDTO';
import { QueryPage } from '../../../domain/entities/queryContract';

export abstract class ConnectionDriver {
    protected isConnected: boolean = false;
    constructor(protected configDriverDTO: ConnectionDriverDTO) {}

    abstract requestAuthorization(state: string): string;
    abstract login(): Promise<ConnectionDriverDTO>; 
    abstract getDescribeGlobal(): Promise<string>; 
    abstract describeSObject(sobject: string): Promise<string>;
    abstract doSOQL(query: string): Promise<QueryPage>
    abstract queryMore(locator: string): Promise<QueryPage>
    abstract revoke(): Promise<void>;
    abstract dispose(): void;
}
