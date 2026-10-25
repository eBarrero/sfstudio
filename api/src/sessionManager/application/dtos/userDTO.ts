


import { ConnectionDriverDTO } from "./connectionDriverDTO";
import { SessionId } from "../../domain/entities/workspaceSession";


export class UserDTO {
    constructor(
        public readonly sessionId: SessionId,
        public readonly name: string,
        public readonly createdAt: Date,
        public readonly expiresAt: Date,
        private connections: ConnectionDriverDTO[]
    ) {}

    public getConnections = (): ConnectionDriverDTO[] => {
        return this.connections.map(connection  => {
            return new ConnectionDriverDTO(connection);
        });
    }
}
