


import { ConnectionDriverDTO } from "./connectionDriverDTO";


export class UserDTO {
    constructor(
        public readonly sessionId: number,
        public readonly name: string,
        public readonly createdAt: Date,
        private connections: ConnectionDriverDTO[]
    ) {}

    public getConnections = (): ConnectionDriverDTO[] => {
        return this.connections.map(connection  => {
            return new ConnectionDriverDTO(connection);
        });
    }
}