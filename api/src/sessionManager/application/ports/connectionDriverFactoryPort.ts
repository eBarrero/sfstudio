import { ConnectionDriverDTO } from '../dtos/connectionDriverDTO';
import { ActiveConnectionPort } from '../../domain/ports/outbound/connectionRegistryPort';

export interface AuthConnectionDriverPort extends ActiveConnectionPort {
    requestAuthorization(state: string): string;
    login(): Promise<ConnectionDriverDTO>;
}

export type CreateDriver = (configuration: ConnectionDriverDTO) => AuthConnectionDriverPort;
